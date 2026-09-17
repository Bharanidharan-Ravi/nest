/**
 * Message encryption for end-to-end encrypted chat (user-based keys).
 *
 * Per message:
 *  1. A random AES-256-GCM content key (K_msg) encrypts { v: 1, type, text }.
 *     GCM additional data (AAD) = "wg-chat-v2|conversationId|senderUserId|clientMessageId",
 *     so the server can't move the ciphertext to another conversation or relabel its sender.
 *  2. For every member, sender included (so they can read their own history):
 *       shared  = ECDH(sender private key, member public key)       static-static
 *       K_wrap  = HKDF-SHA256(IKM = shared, salt = messageId, info = AAD)
 *       wrapped = AES-KW(K_wrap, K_msg)                             40 bytes
 *
 * ECDH is symmetric, so a recipient derives the same K_wrap from
 * ECDH(own private key, sender public key) — which also means only the holder of
 * the sender's private key could have produced a wrap that opens.
 *
 * The client message id is also the server-side message id (it's the HKDF salt).
 * Blob layout: EncryptedPayload = [12-byte IV | ciphertext + 16-byte tag]
 */

import { IV_LENGTH, fromBase64, importPublicKey, toBase64 } from "./userKeyManager";

export const MESSAGE_VERSION = "wg-chat-v2";
export const MAX_MESSAGE_LENGTH = 4000;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const normalizeId = (value) => String(value ?? "").toLowerCase();

export function additionalData({ conversationId, senderUserId, clientMessageId }) {
  return encoder.encode(
    [MESSAGE_VERSION, conversationId, senderUserId, clientMessageId].map(normalizeId).join("|"),
  );
}

async function deriveWrapKey({ privateKey, publicKey, messageId, aad }, usage) {
  const shared = await crypto.subtle.deriveBits({ name: "ECDH", public: publicKey }, privateKey, 256);
  const hkdfKey = await crypto.subtle.importKey("raw", shared, "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: encoder.encode(normalizeId(messageId)), info: aad },
    hkdfKey,
    { name: "AES-KW", length: 256 },
    false,
    [usage],
  );
}

const asPublicKey = (key) => (typeof key === "string" ? importPublicKey(key) : key);

/**
 * @param {object} args
 * @param {object} args.payload            e.g. { type: "text", text }
 * @param {string} args.conversationId
 * @param {string} args.senderUserId
 * @param {CryptoKey} args.senderPrivateKey
 * @param {Array<{ userId: string, publicKey: CryptoKey|string }>} args.recipients
 *   every conversation member, the sender included
 * @param {string} [args.clientMessageId]  defaults to a new UUID
 * @returns {Promise<{ ClientMessageId, EncryptedPayload, Keys: Array<{ RecipientUserId, WrappedMessageKey }> }>}
 *   the POST /api/Chats/{id}/messages body
 */
export async function encryptMessage({
  payload,
  conversationId,
  senderUserId,
  senderPrivateKey,
  recipients,
  clientMessageId = crypto.randomUUID(),
}) {
  if (!recipients?.length) throw new Error("No recipients to encrypt for");
  if (!recipients.some((r) => normalizeId(r.userId) === normalizeId(senderUserId))) {
    throw new Error("The sender must be one of the recipients");
  }

  const aad = additionalData({ conversationId, senderUserId, clientMessageId });
  // Extractable only so it can be wrapped; it never leaves this function unwrapped.
  // "wrapKey" usage lets a media/voice send also wrap the file's own AES key with this
  // same content key (see wrapFileKey) — harmless and unused for a plain text message.
  const contentKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "wrapKey"]);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv, additionalData: aad },
      contentKey,
      encoder.encode(JSON.stringify({ v: 1, ...payload })),
    ),
  );

  const blob = new Uint8Array(IV_LENGTH + ciphertext.length);
  blob.set(iv, 0);
  blob.set(ciphertext, IV_LENGTH);

  const Keys = await Promise.all(
    recipients.map(async (recipient) => {
      const wrapKey = await deriveWrapKey(
        {
          privateKey: senderPrivateKey,
          publicKey: await asPublicKey(recipient.publicKey),
          messageId: clientMessageId,
          aad,
        },
        "wrapKey",
      );
      const wrapped = await crypto.subtle.wrapKey("raw", contentKey, wrapKey, "AES-KW");
      return { RecipientUserId: recipient.userId, WrappedMessageKey: toBase64(wrapped) };
    }),
  );

  return { ClientMessageId: clientMessageId, EncryptedPayload: toBase64(blob), Keys, contentKey };
}

/**
 * Decrypts a ChatMessageDto (from the API or the "ChatMessage" realtime event).
 *
 * @param {object} message              { ConversationId, SenderUserId, ClientMessageId, EncryptedPayload, WrappedMessageKey }
 * @param {object} keys
 * @param {CryptoKey} keys.privateKey          the reader's private key
 * @param {CryptoKey|string} keys.senderPublicKey
 * @returns {Promise<{ status: "ok", body: object, contentKey?: CryptoKey } | { status: "no-key" } | { status: "error" }>}
 *   "no-key": the message carries no wrapped key for this user.
 *   "error": tampered ciphertext, wrong sender key, or an unsupported payload.
 *   `contentKey` is returned alongside a media/voice body so the caller can later
 *   unwrap and decrypt the attached file (see unwrapFileKey / GET .../media/{id}).
 */
export async function decryptMessage(message, { privateKey, senderPublicKey }) {
  if (!message?.WrappedMessageKey) return { status: "no-key" };

  try {
    const aad = additionalData({
      conversationId: message.ConversationId,
      senderUserId: message.SenderUserId,
      clientMessageId: message.ClientMessageId,
    });
    const unwrapKey = await deriveWrapKey(
      {
        privateKey,
        publicKey: await asPublicKey(senderPublicKey),
        messageId: message.ClientMessageId,
        aad,
      },
      "unwrapKey",
    );
    // "unwrapKey" usage lets a media/voice message's file key be unwrapped with this
    // same content key later (see unwrapFileKey); harmless and unused for plain text.
    const contentKey = await crypto.subtle.unwrapKey(
      "raw",
      fromBase64(message.WrappedMessageKey),
      unwrapKey,
      "AES-KW",
      "AES-GCM",
      false,
      ["decrypt", "unwrapKey"],
    );

    const blob = fromBase64(message.EncryptedPayload);
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: blob.slice(0, IV_LENGTH), additionalData: aad },
      contentKey,
      blob.slice(IV_LENGTH),
    );

    const body = JSON.parse(decoder.decode(plaintext));
    if (body?.v !== 1) return { status: "error" };
    if (body.type === "text") {
      if (typeof body.text !== "string") return { status: "error" };
      return { status: "ok", body };
    }
    if (body.type === "media" || body.type === "voice") {
      if (typeof body.fileName !== "string" || typeof body.mimeType !== "string" || typeof body.size !== "number") {
        return { status: "error" };
      }
      return { status: "ok", body, contentKey };
    }
    return { status: "error" };
  } catch {
    return { status: "error" };
  }
}

/**
 * Wraps a random per-file AES-256-GCM key with a message's content key (WebCrypto
 * wrapKey, AES-GCM) so the server never sees an unwrapped file key. Blob layout:
 * [12-byte wrap IV | wrapped key (32 bytes) + 16-byte tag] = 60 bytes.
 */
export async function wrapFileKey(fileKey, contentKey) {
  const wrapIv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const wrapped = new Uint8Array(
    await crypto.subtle.wrapKey("raw", fileKey, contentKey, { name: "AES-GCM", iv: wrapIv }),
  );
  const blob = new Uint8Array(IV_LENGTH + wrapped.length);
  blob.set(wrapIv, 0);
  blob.set(wrapped, IV_LENGTH);
  return toBase64(blob);
}

/** Reverses wrapFileKey; returns a non-extractable AES-GCM CryptoKey usable only to decrypt. */
export async function unwrapFileKey(encryptedFileKeyB64, contentKey) {
  const blob = fromBase64(encryptedFileKeyB64);
  const wrapIv = blob.slice(0, IV_LENGTH);
  const wrapped = blob.slice(IV_LENGTH);
  return crypto.subtle.unwrapKey(
    "raw",
    wrapped,
    contentKey,
    { name: "AES-GCM", iv: wrapIv },
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
}
