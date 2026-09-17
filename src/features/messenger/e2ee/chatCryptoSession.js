/**
 * Glue between the chat UI and the crypto engine: finds the logged-in user's
 * private key (IndexedDB) and members' public keys (key directory, cached),
 * and keeps decrypted results in memory only — plaintext is never persisted.
 */

import { chatApi } from "../api/chat.api";
import { chatKeysApi } from "./chatKeys.api";
import { CHAT_IDENTITY_STATUS, useChatIdentityStore } from "./chatIdentityStore";
import { indexedDbKeyStore } from "./keyStore";
import { decryptMessage, encryptMessage, unwrapFileKey, wrapFileKey } from "./messageCrypto";
import { decryptFileBytes } from "./mediaCrypto";
import { fromBase64, importPublicKey } from "./userKeyManager";

export const sameId = (a, b) => String(a ?? "").toLowerCase() === String(b ?? "").toLowerCase();
const idKey = (id) => String(id ?? "").toLowerCase();

/** Mirrors the backend's ChatTagEntityType. */
export const ChatTagEntityType = {
  User: "User",
  Ticket: "Ticket",
  Meeting: "Meeting",
  Project: "Project",
  Repo: "Repo",
};

export class ChatLockedError extends Error {
  constructor() {
    super("Unlock secure chat to send and read messages.");
    this.name = "ChatLockedError";
  }
}

export class RecipientNotReadyError extends Error {
  constructor(userIds) {
    super("They haven't set up secure chat yet — they need to log in to WGNest once.");
    this.name = "RecipientNotReadyError";
    this.userIds = userIds;
  }
}

let privateKeyPromise = null; // { userId, promise }
const publicKeys = new Map(); // userId -> { publicKey: base64, cryptoKey: Promise<CryptoKey> }
const decrypted = new Map(); // messageId -> { status: "ok", body }

export function clearChatCryptoCaches() {
  privateKeyPromise = null;
  publicKeys.clear();
  decrypted.clear();
}

// A new unlock, logout or key change invalidates everything cached for the old key
useChatIdentityStore.subscribe((state, previous) => {
  if (state.status !== previous.status || state.userId !== previous.userId) clearChatCryptoCaches();
});

export const isChatReady = () => useChatIdentityStore.getState().status === CHAT_IDENTITY_STATUS.READY;

async function getMyPrivateKey(userId) {
  if (!isChatReady()) throw new ChatLockedError();
  if (!privateKeyPromise || !sameId(privateKeyPromise.userId, userId)) {
    const promise = indexedDbKeyStore.get(userId).then((record) => {
      if (!record?.privateKey) throw new ChatLockedError();
      return record.privateKey;
    });
    promise.catch(() => {
      if (privateKeyPromise?.promise === promise) privateKeyPromise = null;
    });
    privateKeyPromise = { userId, promise };
  }
  return privateKeyPromise.promise;
}

/**
 * @param {string[]} userIds
 * @param {{ refresh?: boolean }} [options]  refresh: re-query the directory even for cached users
 * @returns {Promise<Map<string, CryptoKey>>} keyed by lower-cased userId; users without a key are absent
 */
async function getPublicKeys(userIds, { refresh = false } = {}) {
  const wanted = [...new Set(userIds.map(idKey))];
  const missing = refresh ? wanted : wanted.filter((id) => !publicKeys.has(id));

  if (missing.length) {
    const directory = (await chatKeysApi.getParticipantKeys(missing)) ?? [];
    for (const entry of directory) {
      const id = idKey(entry.UserId);
      if (publicKeys.get(id)?.publicKey === entry.PublicKey) continue;
      publicKeys.set(id, { publicKey: entry.PublicKey, cryptoKey: importPublicKey(entry.PublicKey) });
    }
    // Someone who still has no key (or lost it) must not keep a stale cached one
    if (refresh) {
      const found = new Set(directory.map((e) => idKey(e.UserId)));
      missing.filter((id) => !found.has(id)).forEach((id) => publicKeys.delete(id));
    }
  }

  const result = new Map();
  for (const id of wanted) {
    const entry = publicKeys.get(id);
    if (entry) result.set(id, await entry.cryptoKey);
  }
  return result;
}

/**
 * Adds `decrypted` to a message: { status: "ok", body } | "no-key" | "error" | "locked".
 * Only successful results are cached; "locked" is retried once chat is unlocked.
 */
export async function withDecrypted(message, userId) {
  if (!message) return message;
  if (message.decrypted?.status === "ok") return message;

  const cached = decrypted.get(idKey(message.MessageId));
  if (cached) return { ...message, decrypted: cached };

  try {
    const privateKey = await getMyPrivateKey(userId);
    const senderKey = (await getPublicKeys([message.SenderUserId])).get(idKey(message.SenderUserId));
    if (!senderKey) return { ...message, decrypted: { status: "error" } };

    const result = await decryptMessage(message, { privateKey, senderPublicKey: senderKey });
    if (result.status === "ok") decrypted.set(idKey(message.MessageId), result);
    return { ...message, decrypted: result };
  } catch (err) {
    if (err instanceof ChatLockedError) return { ...message, decrypted: { status: "locked" } };
    console.warn("[Chat] Couldn't decrypt message", message.MessageId, err);
    return { ...message, decrypted: { status: "error" } };
  }
}

/** Encrypts a text message for every member of the conversation (sender included). */
export async function encryptTextMessage({ conversation, userId, text, replyToMessageId = null, tags = [] }) {
  const privateKey = await getMyPrivateKey(userId);
  const memberIds = conversation.MemberUserIds;

  // Always re-check the directory when sending: a member may have just set up (or reset) their key
  const keys = await getPublicKeys(memberIds, { refresh: true });
  const missing = memberIds.filter((id) => !keys.has(idKey(id)));
  if (missing.length) throw new RecipientNotReadyError(missing);

  const body = await encryptMessage({
    payload: { type: "text", text },
    conversationId: conversation.ConversationId,
    senderUserId: userId,
    senderPrivateKey: privateKey,
    recipients: memberIds.map((id) => ({ userId: id, publicKey: keys.get(idKey(id)) })),
  });
  // Plain metadata, not encrypted — same trust level as ClientMessageId. The @/# token itself
  // stays inside the encrypted payload text; this only carries what's needed to notify/link it.
  body.ReplyToMessageId = replyToMessageId ?? null;
  body.Tags = (tags ?? []).map((t) => ({
    EntityType: t.entityType,
    EntityId: t.entityId,
    DisplayText: t.displayText,
    NotifyUserId: t.notifyUserId ?? null,
  }));

  // The sender already knows the plaintext — no need to decrypt their own copy later
  decrypted.set(idKey(body.ClientMessageId), { status: "ok", body: { v: 1, type: "text", text } });
  delete body.contentKey;
  return body;
}

/**
 * Encrypts a media/voice message envelope for every member (sender included) and wraps
 * the attachment's own file key with the message's content key. The caller has already
 * encrypted the actual file bytes (see mediaCrypto.js) — this only builds the message
 * fields the upload form needs: everything SendMediaMessageDto expects except the file itself.
 *
 * @param {object} args.envelope  { type: "media"|"voice", fileName, mimeType, size, durationMs? }
 * @param {CryptoKey} args.fileKey  the attachment's own AES-GCM key (see generateFileKey)
 */
export async function encryptMediaMessage({ conversation, userId, envelope, fileKey, replyToMessageId = null, tags = [] }) {
  const privateKey = await getMyPrivateKey(userId);
  const memberIds = conversation.MemberUserIds;

  const keys = await getPublicKeys(memberIds, { refresh: true });
  const missing = memberIds.filter((id) => !keys.has(idKey(id)));
  if (missing.length) throw new RecipientNotReadyError(missing);

  const body = await encryptMessage({
    payload: envelope,
    conversationId: conversation.ConversationId,
    senderUserId: userId,
    senderPrivateKey: privateKey,
    recipients: memberIds.map((id) => ({ userId: id, publicKey: keys.get(idKey(id)) })),
  });
  body.ReplyToMessageId = replyToMessageId ?? null;
  body.Tags = (tags ?? []).map((t) => ({
    EntityType: t.entityType,
    EntityId: t.entityId,
    DisplayText: t.displayText,
    NotifyUserId: t.notifyUserId ?? null,
  }));

  const encryptedFileKey = await wrapFileKey(fileKey, body.contentKey);

  decrypted.set(idKey(body.ClientMessageId), { status: "ok", body: { v: 1, ...envelope }, contentKey: body.contentKey });
  delete body.contentKey;
  return { ...body, EncryptedFileKey: encryptedFileKey };
}

/**
 * Fetches and decrypts a media/voice message's attachment.
 * @param {object} message   the decrypted ChatMessageDto (must carry `decrypted.contentKey` and `Media`)
 * @returns {Promise<ArrayBuffer>} plaintext file bytes
 */
export async function decryptMediaAttachment(message) {
  const media = message.Media;
  const contentKey = message.decrypted?.contentKey;
  if (!media || !contentKey) throw new Error("This message has no attachment to decrypt.");

  const response = await chatApi.getMedia(media.MediaId);
  const ciphertext = fromBase64(response.FileData);
  const fileKey = await unwrapFileKey(media.EncryptedFileKey, contentKey);
  return decryptFileBytes(fileKey, fromBase64(media.Iv), ciphertext);
}
