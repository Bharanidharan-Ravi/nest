/**
 * User key management for end-to-end encrypted chat.
 *
 * Each USER has one ECDH P-256 key pair, shared by all of their devices. The
 * private key never reaches the server in usable form: the browser wraps it
 * twice and uploads only the wrapped blobs (see ChatUserKeys on the server):
 *
 *   wrappedByPassword = AES-GCM( PBKDF2(password,      passwordSalt), pkcs8 )
 *   wrappedByRecovery = AES-GCM( PBKDF2(recoveryCode,  recoverySalt), pkcs8 )
 *
 * Blob layout: [12-byte IV | AES-GCM ciphertext + 16-byte tag]
 *
 * Any device that knows the password (or the recovery code) can unwrap the
 * key; the server, which knows neither, cannot. The unwrapped key is imported
 * NON-extractable before it is stored in IndexedDB.
 */

import { normalizeRecoveryCode, isValidRecoveryCode, generateRecoveryCode } from "./recoveryCode";

export const PBKDF2_ITERATIONS = 600_000;
export const SALT_LENGTH = 16;
export const IV_LENGTH = 12;

const DH_ALGORITHM = { name: "ECDH", namedCurve: "P-256" };
// Phase 4 derives per-message wrap keys with ECDH -> HKDF, which needs deriveBits
const PRIVATE_KEY_USAGES = ["deriveBits"];

// ─── Encoding ────────────────────────────────────────────────────────────────

export function toBase64(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function fromBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function randomBytes(length) {
  return crypto.getRandomValues(new Uint8Array(length));
}

function toSecretBytes(secret) {
  if (typeof secret !== "string" || secret.length === 0) {
    throw new Error("A non-empty secret is required");
  }
  return new TextEncoder().encode(secret);
}

// ─── Key generation ──────────────────────────────────────────────────────────

/**
 * New ECDH P-256 key pair. The private key is EXTRACTABLE on purpose — it has
 * to be exported once as pkcs8 to be wrapped. Don't store this CryptoKey; store
 * the non-extractable copy from {@link importPrivateKey} instead.
 */
export function generateUserKeyPair() {
  return crypto.subtle.generateKey(DH_ALGORITHM, true, PRIVATE_KEY_USAGES);
}

/** Base64 SPKI — the format the server expects in ChatUserKeys.PublicKey. */
export async function exportPublicKey(publicKey) {
  return toBase64(await crypto.subtle.exportKey("spki", publicKey));
}

/** Imports a base64 SPKI public key (e.g. from GET /api/ChatKeys/participants). */
export function importPublicKey(publicKeyBase64) {
  return crypto.subtle.importKey("spki", fromBase64(publicKeyBase64), DH_ALGORITHM, false, []);
}

/** Imports pkcs8 bytes as a NON-extractable private key. */
export function importPrivateKey(pkcs8Bytes) {
  return crypto.subtle.importKey("pkcs8", pkcs8Bytes, DH_ALGORITHM, false, PRIVATE_KEY_USAGES);
}

// ─── Wrapping ────────────────────────────────────────────────────────────────

/**
 * PBKDF2-SHA256 (600,000 iterations) -> non-extractable AES-256-GCM key.
 * @param {string} secret  login password, or a recovery code (normalize it first)
 * @param {Uint8Array} salt
 */
export async function deriveWrappingKey(secret, salt) {
  const baseKey = await crypto.subtle.importKey("raw", toSecretBytes(secret), "PBKDF2", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: PBKDF2_ITERATIONS },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/** AES-GCM encrypts raw bytes under a secret: returns [12-byte IV | ciphertext]. */
async function sealBytes(plaintext, secret, salt) {
  const wrappingKey = await deriveWrappingKey(secret, salt);
  const iv = randomBytes(IV_LENGTH);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, wrappingKey, plaintext),
  );

  const out = new Uint8Array(IV_LENGTH + ciphertext.length);
  out.set(iv, 0);
  out.set(ciphertext, IV_LENGTH);
  return out;
}

/**
 * Reverses {@link sealBytes}. Throws {@link WrongSecretError} when the secret or
 * salt is wrong (or the blob was tampered with) — AES-GCM can't tell those apart.
 */
async function openBytes(wrappedBytes, secret, salt) {
  const bytes = wrappedBytes instanceof Uint8Array ? wrappedBytes : new Uint8Array(wrappedBytes);
  if (bytes.length <= IV_LENGTH) throw new Error("Wrapped key is too short");

  const wrappingKey = await deriveWrappingKey(secret, salt);
  try {
    return new Uint8Array(
      await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: bytes.slice(0, IV_LENGTH) },
        wrappingKey,
        bytes.slice(IV_LENGTH),
      ),
    );
  } catch {
    throw new WrongSecretError();
  }
}

/**
 * Exports the (extractable) private key as pkcs8 and encrypts it.
 * @returns {Promise<Uint8Array>} [12-byte IV | ciphertext]
 */
export async function wrapPrivateKey(cryptoKey, secret, salt) {
  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", cryptoKey));
  try {
    return await sealBytes(pkcs8, secret, salt);
  } finally {
    pkcs8.fill(0);
  }
}

/**
 * Decrypts a wrapped blob and imports the private key as NON-extractable.
 * @throws {WrongSecretError} wrong password / recovery code
 */
export async function unwrapPrivateKey(wrappedBytes, secret, salt) {
  const pkcs8 = await openBytes(wrappedBytes, secret, salt);
  try {
    return await importPrivateKey(pkcs8);
  } finally {
    pkcs8.fill(0);
  }
}

/**
 * Re-encrypts a wrapped private key under a new secret without ever creating an
 * extractable CryptoKey — used after a password reset: unlock with the recovery
 * code, re-wrap under the new password (POST /api/ChatKeys/rewrap).
 * @returns {Promise<{ privateKey: CryptoKey, wrapped: Uint8Array, salt: Uint8Array }>}
 * @throws {WrongSecretError} wrong old secret
 */
export async function rewrapPrivateKey(wrappedBytes, oldSecret, oldSalt, newSecret) {
  const pkcs8 = await openBytes(wrappedBytes, oldSecret, oldSalt);
  try {
    const salt = randomBytes(SALT_LENGTH);
    const [privateKey, wrapped] = await Promise.all([
      importPrivateKey(pkcs8),
      sealBytes(pkcs8, newSecret, salt),
    ]);
    return { privateKey, wrapped, salt };
  } finally {
    pkcs8.fill(0);
  }
}

export class WrongSecretError extends Error {
  constructor() {
    super("The password or recovery code is incorrect.");
    this.name = "WrongSecretError";
  }
}

// ─── High-level flows (used by the login / unlock hooks) ────────────────────

/**
 * First-time setup: new key pair, wrapped under the password and a fresh recovery code.
 *
 * @param {string} password  the login password (kept in memory only)
 * @returns {Promise<{
 *   registration: { PublicKey, WrappedByPassword, PasswordSalt, WrappedByRecovery, RecoverySalt, RecoveryCode },
 *   recoveryCode: string,   // formatted — shown once to the user; also escrowed server-side (see registration.RecoveryCode)
 *   privateKey: CryptoKey,  // non-extractable, ready for keyStore
 *   publicKey: string,      // base64 SPKI
 * }>}
 * `registration` is the POST /api/ChatKeys/me body, with base64 fields. RecoveryCode
 * travels in plaintext over TLS and is stored server-side encrypted with an admin-only
 * key, so support can re-issue it — the server never sees WrappedByPassword/WrappedByRecovery
 * unwrapped, so it still can't read message content from this alone.
 */
export async function createUserKeyBundle(password) {
  const keyPair = await generateUserKeyPair();
  const recoveryCode = generateRecoveryCode();
  const passwordSalt = randomBytes(SALT_LENGTH);
  const recoverySalt = randomBytes(SALT_LENGTH);

  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", keyPair.privateKey));
  try {
    const [publicKey, wrappedByPassword, wrappedByRecovery, privateKey] = await Promise.all([
      exportPublicKey(keyPair.publicKey),
      sealBytes(pkcs8, password, passwordSalt),
      sealBytes(pkcs8, normalizeRecoveryCode(recoveryCode), recoverySalt),
      importPrivateKey(pkcs8),
    ]);

    return {
      registration: {
        PublicKey: publicKey,
        WrappedByPassword: toBase64(wrappedByPassword),
        PasswordSalt: toBase64(passwordSalt),
        WrappedByRecovery: toBase64(wrappedByRecovery),
        RecoverySalt: toBase64(recoverySalt),
        RecoveryCode: recoveryCode,
      },
      recoveryCode,
      privateKey,
      publicKey,
    };
  } finally {
    pkcs8.fill(0);
  }
}

/**
 * Unlocks the key bundle from GET /api/ChatKeys/me with the login password.
 * @throws {WrongSecretError} password doesn't match — typically it was reset,
 *   so the user needs the recovery code ({@link recoverWithCode}).
 */
export function unlockWithPassword(bundle, password) {
  return unwrapPrivateKey(fromBase64(bundle.WrappedByPassword), password, fromBase64(bundle.PasswordSalt));
}

/**
 * Unlocks with the recovery code and re-wraps the key under the current password.
 *
 * @returns {Promise<{ privateKey: CryptoKey, rewrap: { WrappedByPassword, PasswordSalt, KeyVersion } }>}
 *   `rewrap` is the POST /api/ChatKeys/rewrap body.
 * @throws {InvalidRecoveryCodeError} code is malformed (wrong length / characters)
 * @throws {WrongSecretError} code is well-formed but doesn't unlock this key
 */
export async function recoverWithCode(bundle, recoveryCode, currentPassword) {
  if (!isValidRecoveryCode(recoveryCode)) throw new InvalidRecoveryCodeError();

  const { privateKey, wrapped, salt } = await rewrapPrivateKey(
    fromBase64(bundle.WrappedByRecovery),
    normalizeRecoveryCode(recoveryCode),
    fromBase64(bundle.RecoverySalt),
    currentPassword,
  );

  return {
    privateKey,
    rewrap: {
      WrappedByPassword: toBase64(wrapped),
      PasswordSalt: toBase64(salt),
      KeyVersion: bundle.KeyVersion,
    },
  };
}

export class InvalidRecoveryCodeError extends Error {
  constructor() {
    super("A recovery code has 24 letters and numbers, like WGN2-8F9K-M3NP-7X4R-29TV-B8CQ.");
    this.name = "InvalidRecoveryCodeError";
  }
}
