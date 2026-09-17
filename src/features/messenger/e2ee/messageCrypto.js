/**
 * Message encryption for end-to-end encrypted chat.
 *
 * Per message:
 *  1. A random AES-256-GCM content key encrypts the payload once. The GCM
 *     additional data binds the ciphertext to its conversation, sender and
 *     client message id, so the server can't replay it elsewhere.
 *  2. A one-time ephemeral ECDH P-256 key pair is generated.
 *  3. For every recipient device (including the sender's own devices, so the
 *     sender can read their history): ECDH(ephemeral, device signed pre-key)
 *     -> HKDF-SHA-256 -> AES-KW key, which wraps the content key.
 *
 * Known limitation (v1): messages are not signed by the sender's identity key,
 * so a malicious server could inject messages. Sender authentication belongs
 * with safety-number verification in a later step.
 */

import { fingerprint, fromBase64, toBase64 } from "./keyManager";

const VERSION = "wg-chat-v1";
const DH_ALGORITHM = { name: "ECDH", namedCurve: "P-256" };
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const utf8 = (value) => encoder.encode(value);

function additionalData({ conversationId, senderUserId, senderDeviceId, clientMessageId }) {
  return utf8(
    [VERSION, conversationId, senderUserId, senderDeviceId, clientMessageId]
      .map((v) => String(v).toLowerCase())
      .join("|"),
  );
}

async function deriveWrappingKey(privateKey, publicKey, { deviceId, preKeyId, ephemeralPublicKey }, usage) {
  const shared = await crypto.subtle.deriveBits({ name: "ECDH", public: publicKey }, privateKey, 256);
  const hkdfKey = await crypto.subtle.importKey("raw", shared, "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(0),
      info: utf8(`${VERSION}|kek|${String(deviceId).toLowerCase()}|${preKeyId}|${ephemeralPublicKey}`),
    },
    hkdfKey,
    { name: "AES-KW", length: 256 },
    false,
    [usage],
  );
}

const importDhPublicKey = (spkiBase64) =>
  crypto.subtle.importKey("spki", fromBase64(spkiBase64), DH_ALGORITHM, false, []);

/**
 * Keeps only devices whose pre-key is genuinely signed by their identity key
 * (and whose fingerprint matches), dropping anything a server could have swapped.
 *
 * @param {Array<{ UserId, Devices: Array }>} participants  from GET /ChatKeys/participants
 * @returns {Promise<Array<{ userId, deviceId, preKeyId, preKeyPublicKey }>>}
 */
export async function verifiedDevices(participants) {
  const result = [];
  for (const participant of participants ?? []) {
    for (const device of participant.Devices ?? []) {
      try {
        if ((await fingerprint(device.IdentityPublicKey)) !== device.IdentityFingerprint) continue;

        const identityKey = await crypto.subtle.importKey(
          "spki",
          fromBase64(device.IdentityPublicKey),
          { name: "ECDSA", namedCurve: "P-256" },
          false,
          ["verify"],
        );
        const valid = await crypto.subtle.verify(
          { name: "ECDSA", hash: "SHA-256" },
          identityKey,
          fromBase64(device.PreKeySignature),
          fromBase64(device.PreKeyPublicKey),
        );
        if (!valid) continue;

        result.push({
          userId: participant.UserId,
          deviceId: device.DeviceId,
          preKeyId: device.PreKeyId,
          preKeyPublicKey: device.PreKeyPublicKey,
        });
      } catch {
        // Malformed key material — skip the device
      }
    }
  }
  return result;
}

/**
 * @param {object} args
 * @param {object} args.payload         JSON-serialisable message body, e.g. { type: "text", text }
 * @param {string} args.conversationId
 * @param {string} args.senderUserId
 * @param {string} args.senderDeviceId
 * @param {Array}  args.devices         [{ deviceId, preKeyId, preKeyPublicKey }]
 * @param {string} [args.clientMessageId]
 * @returns {Promise<object>} request body for POST /Chats/{id}/messages
 */
export async function encryptMessage({ payload, conversationId, senderUserId, senderDeviceId, devices, clientMessageId }) {
  if (!devices?.length) throw new Error("No recipient devices to encrypt for");

  const messageId = clientMessageId ?? crypto.randomUUID();
  const contentKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: additionalData({ conversationId, senderUserId, senderDeviceId, clientMessageId: messageId }),
    },
    contentKey,
    utf8(JSON.stringify({ v: 1, ...payload })),
  );

  const ephemeral = await crypto.subtle.generateKey(DH_ALGORITHM, false, ["deriveBits"]);
  const ephemeralPublicKey = toBase64(await crypto.subtle.exportKey("spki", ephemeral.publicKey));

  const keys = [];
  for (const device of devices) {
    const wrappingKey = await deriveWrappingKey(
      ephemeral.privateKey,
      await importDhPublicKey(device.preKeyPublicKey),
      { deviceId: device.deviceId, preKeyId: device.preKeyId, ephemeralPublicKey },
      "wrapKey",
    );
    const wrapped = await crypto.subtle.wrapKey("raw", contentKey, wrappingKey, "AES-KW");
    keys.push({
      RecipientDeviceId: device.deviceId,
      PreKeyId: device.preKeyId,
      WrappedKey: toBase64(wrapped),
    });
  }

  return {
    ClientMessageId: messageId,
    SenderDeviceId: senderDeviceId,
    Ciphertext: toBase64(ciphertext),
    Iv: toBase64(iv),
    EphemeralPublicKey: ephemeralPublicKey,
    Keys: keys,
  };
}

/**
 * Decrypts a message DTO for this device.
 *
 * @param {object} message   ChatMessageDto from the API or the "ChatMessage" realtime event
 * @param {object} record    this device's key record from the key store
 * @returns {Promise<{ status: "ok", body: object } | { status: "no-key" } | { status: "error" }>}
 *   "no-key": the message wasn't encrypted for this device (e.g. sent before this
 *   device existed, or the browser's key storage was cleared).
 */
export async function decryptMessage(message, record) {
  const key = message.Keys?.find(
    (k) => String(k.RecipientDeviceId).toLowerCase() === String(record?.deviceId).toLowerCase(),
  );
  const preKey = key && record.preKeys?.find((p) => p.keyId === key.PreKeyId);
  if (!preKey) return { status: "no-key" };

  try {
    const wrappingKey = await deriveWrappingKey(
      preKey.privateKey,
      await importDhPublicKey(message.EphemeralPublicKey),
      { deviceId: record.deviceId, preKeyId: key.PreKeyId, ephemeralPublicKey: message.EphemeralPublicKey },
      "unwrapKey",
    );
    const contentKey = await crypto.subtle.unwrapKey(
      "raw",
      fromBase64(key.WrappedKey),
      wrappingKey,
      "AES-KW",
      "AES-GCM",
      false,
      ["decrypt"],
    );
    const plaintext = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: fromBase64(message.Iv),
        additionalData: additionalData({
          conversationId: message.ConversationId,
          senderUserId: message.SenderUserId,
          senderDeviceId: message.SenderDeviceId,
          clientMessageId: message.ClientMessageId,
        }),
      },
      contentKey,
      fromBase64(message.Ciphertext),
    );
    return { status: "ok", body: JSON.parse(decoder.decode(plaintext)) };
  } catch {
    return { status: "error" };
  }
}
