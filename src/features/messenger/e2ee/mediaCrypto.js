/**
 * Encrypted file/voice-note bytes for chat attachments (Phase 8).
 *
 * Each attachment gets its own random AES-256-GCM key (K_file) + 12-byte IV,
 * independent of the message's content key (K_msg). K_file is wrapped with
 * K_msg — see messageCrypto.js#wrapFileKey/unwrapFileKey — so only conversation
 * members can ever recover it; this module only handles the file bytes.
 */
import { IV_LENGTH } from "./userKeyManager";

// Must not exceed the backend's SendMedia [RequestSizeLimit] (ChatRepo.MaxMediaBytes).
export const MAX_MEDIA_BYTES = 50 * 1024 * 1024;

/** A fresh, extractable (so it can be wrapped) AES-256-GCM key for one attachment. */
export function generateFileKey() {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt"]);
}

/** @returns {Promise<{ iv: Uint8Array, ciphertext: Uint8Array }>} */
export async function encryptFileBytes(fileKey, arrayBuffer) {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, fileKey, arrayBuffer));
  return { iv, ciphertext };
}

/** @returns {Promise<ArrayBuffer>} the plaintext file bytes */
export function decryptFileBytes(fileKey, iv, ciphertext) {
  return crypto.subtle.decrypt({ name: "AES-GCM", iv }, fileKey, ciphertext);
}
