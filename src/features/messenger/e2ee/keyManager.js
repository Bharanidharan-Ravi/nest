/**
 * Device key management for end-to-end encrypted chat (WhatsApp / Signal style).
 *
 * - Identity key  (ECDSA P-256): long-term, one per user per device.
 * - Signed pre-key (ECDH P-256): signed by the identity key, rotated every 7 days.
 *
 * Private keys are generated non-extractable and stay in this browser.
 * Only public keys + the pre-key signature are uploaded.
 */

export const PREKEY_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

// Retired pre-key private keys are never deleted: message history lives on the
// server encrypted to whichever pre-key was current when it was sent, so dropping
// an old key would make that history permanently unreadable on this device.

const SIGN_ALGORITHM = { name: "ECDSA", namedCurve: "P-256" };
const SIGN_PARAMS = { name: "ECDSA", hash: "SHA-256" };
const DH_ALGORITHM = { name: "ECDH", namedCurve: "P-256" };

// ─── Encoding ────────────────────────────────────────────────────────────────

export function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
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

/** SHA-256 of the SPKI bytes as upper-case hex — matches the server's Fingerprint column. */
export async function fingerprint(publicKeyBase64) {
  const hash = await crypto.subtle.digest("SHA-256", fromBase64(publicKeyBase64));
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

// ─── Key generation ──────────────────────────────────────────────────────────

export async function generateIdentityKey(now) {
  const { privateKey, publicKey } = await crypto.subtle.generateKey(SIGN_ALGORITHM, false, [
    "sign",
    "verify",
  ]);
  const spki = await crypto.subtle.exportKey("spki", publicKey);
  return { privateKey, publicKey: toBase64(spki), createdAt: now };
}

export async function generateSignedPreKey(identityPrivateKey, keyId, now) {
  const { privateKey, publicKey } = await crypto.subtle.generateKey(DH_ALGORITHM, false, [
    "deriveKey",
    "deriveBits",
  ]);
  const spki = await crypto.subtle.exportKey("spki", publicKey);
  const signature = await crypto.subtle.sign(SIGN_PARAMS, identityPrivateKey, spki);

  return {
    keyId,
    privateKey,
    publicKey: toBase64(spki),
    signature: toBase64(signature),
    createdAt: now,
  };
}

// ─── Ensure / rotate ─────────────────────────────────────────────────────────

/**
 * Makes sure this device has an identity key and a valid (< 7 days old) signed
 * pre-key, both locally and on the server. Safe to call on every login / app load.
 *
 * @param {object}   deps
 * @param {string}   deps.userId
 * @param {object}   deps.api    { getStatus, registerIdentity, registerPreKey }
 * @param {object}   deps.store  { get(userId), put(record) }
 * @param {string}   [deps.deviceInfo]
 * @param {Function} [deps.now]  clock, for tests
 * @returns {Promise<{ deviceId, fingerprint, preKeyId, rotated, identityRegistered }>}
 */
export async function ensureChatKeys({ userId, api, store, deviceInfo, now = Date.now }) {
  if (!userId) throw new Error("userId is required");

  let record = (await store.get(userId)) ?? {
    userId,
    deviceId: crypto.randomUUID(),
    preKeys: [],
    currentPreKeyId: null,
  };

  // New device (or browser data was cleared): new identity
  if (!record.identity) {
    record = { ...record, identity: await generateIdentityKey(now()), preKeys: [], currentPreKeyId: null };
    await store.put(record);
  }

  const localFingerprint = await fingerprint(record.identity.publicKey);
  let status = await api.getStatus(record.deviceId);
  let identityRegistered = false;

  if (status?.IdentityFingerprint !== localFingerprint) {
    status = await api.registerIdentity({
      deviceId: record.deviceId,
      publicKey: record.identity.publicKey,
      deviceInfo,
    });
    identityRegistered = true;
  }

  // A previous upload may have succeeded without us recording it (lost response)
  const serverKey = record.preKeys.find((k) => k.keyId === status?.PreKeyId);
  if (serverKey && record.currentPreKeyId !== serverKey.keyId) {
    record = { ...record, currentPreKeyId: serverKey.keyId };
    await store.put(record);
  }

  const current = record.preKeys.find((k) => k.keyId === record.currentPreKeyId);
  const rotationDue =
    !current ||
    status?.RotationDue !== false ||
    status?.PreKeyId !== current.keyId ||
    now() - current.createdAt >= PREKEY_LIFETIME_MS;

  let rotated = false;

  if (rotationDue) {
    const nextKeyId =
      Math.max(0, status?.PreKeyId ?? 0, ...record.preKeys.map((k) => k.keyId)) + 1;
    const preKey = await generateSignedPreKey(record.identity.privateKey, nextKeyId, now());

    // Persist the private key BEFORE uploading, so a successful upload can never
    // leave the server with a public key whose private half we don't have.
    record = { ...record, preKeys: [...record.preKeys, preKey] };
    await store.put(record);

    status = await api.registerPreKey({
      deviceId: record.deviceId,
      keyId: preKey.keyId,
      publicKey: preKey.publicKey,
      signature: preKey.signature,
    });

    record = { ...record, currentPreKeyId: preKey.keyId };
    await store.put(record);
    rotated = true;
  }

  return {
    deviceId: record.deviceId,
    fingerprint: localFingerprint,
    preKeyId: record.currentPreKeyId,
    rotated,
    identityRegistered,
  };
}

/** Serializes key checks per user across tabs (Web Locks), falling back to a direct call. */
export function withUserKeyLock(userId, fn) {
  if (typeof navigator !== "undefined" && navigator.locks?.request) {
    return navigator.locks.request(`wg-e2ee:${userId}`, fn);
  }
  return fn();
}
