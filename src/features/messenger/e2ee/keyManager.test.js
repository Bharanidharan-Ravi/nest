import { describe, expect, it } from "vitest";
import {
  PREKEY_LIFETIME_MS,
  ensureChatKeys,
  fingerprint,
  fromBase64,
} from "./keyManager";

const DAY = 24 * 60 * 60 * 1000;
const USER = "7f1c2d9e-0000-4000-8000-000000000001";

function memoryStore() {
  const data = new Map();
  return {
    data,
    get: async (userId) => data.get(userId),
    put: async (record) => void data.set(record.userId, record),
  };
}

/** Mirrors ChatKeyRepo: verifies signatures and tracks one active identity + pre-key. */
function fakeServer(clock) {
  const state = { identity: null, preKey: null, calls: { identity: 0, preKey: 0 } };

  const status = (deviceId) => ({
    DeviceId: deviceId,
    IdentityFingerprint: state.identity?.fingerprint ?? null,
    PreKeyId: state.preKey?.keyId ?? null,
    RotationDue: !state.preKey || state.preKey.expiresAt <= clock.now(),
  });

  return {
    state,
    getStatus: async (deviceId) => status(deviceId),
    registerIdentity: async ({ deviceId, publicKey }) => {
      state.calls.identity++;
      const fp = await fingerprint(publicKey);
      if (state.identity?.fingerprint !== fp) {
        state.identity = { publicKey, fingerprint: fp };
        state.preKey = null;
      }
      return status(deviceId);
    },
    registerPreKey: async ({ deviceId, keyId, publicKey, signature }) => {
      state.calls.preKey++;
      const identityKey = await crypto.subtle.importKey(
        "spki",
        fromBase64(state.identity.publicKey),
        { name: "ECDSA", namedCurve: "P-256" },
        false,
        ["verify"],
      );
      const valid = await crypto.subtle.verify(
        { name: "ECDSA", hash: "SHA-256" },
        identityKey,
        fromBase64(signature),
        fromBase64(publicKey),
      );
      if (!valid) throw new Error("Pre-key signature is invalid.");
      state.preKey = { keyId, publicKey, expiresAt: clock.now() + PREKEY_LIFETIME_MS };
      return status(deviceId);
    },
  };
}

function setup() {
  let t = Date.UTC(2026, 8, 16);
  const clock = { now: () => t, advance: (ms) => (t += ms) };
  const store = memoryStore();
  const api = fakeServer(clock);
  const ensure = () => ensureChatKeys({ userId: USER, api, store, now: clock.now });
  return { clock, store, api, ensure };
}

describe("ensureChatKeys", () => {
  it("creates identity + signed pre-key on first login and uploads only public keys", async () => {
    const { store, api, ensure } = setup();

    const result = await ensure();
    const record = store.data.get(USER);

    expect(result).toMatchObject({ preKeyId: 1, rotated: true, identityRegistered: true });
    expect(api.state.identity.fingerprint).toBe(result.fingerprint);
    expect(api.state.preKey.keyId).toBe(1);
    expect(record.identity.privateKey.extractable).toBe(false);
    expect(record.preKeys[0].privateKey.extractable).toBe(false);
  });

  it("does nothing on a second login within the week", async () => {
    const { clock, api, ensure } = setup();
    await ensure();
    clock.advance(6 * DAY);

    const result = await ensure();

    expect(result).toMatchObject({ preKeyId: 1, rotated: false, identityRegistered: false });
    expect(api.state.calls).toEqual({ identity: 1, preKey: 1 });
  });

  it("rotates the pre-key after 7 days and keeps the identity", async () => {
    const { clock, store, api, ensure } = setup();
    const first = await ensure();
    clock.advance(7 * DAY);

    const second = await ensure();

    expect(second).toMatchObject({ preKeyId: 2, rotated: true, identityRegistered: false });
    expect(second.fingerprint).toBe(first.fingerprint);
    expect(api.state.preKey.keyId).toBe(2);
    // old private pre-key kept for late messages
    expect(store.data.get(USER).preKeys.map((k) => k.keyId)).toEqual([1, 2]);
  });

  it("never drops retired pre-keys, so old message history stays decryptable", async () => {
    const { clock, store, ensure } = setup();
    await ensure();
    for (let i = 0; i < 10; i++) {
      clock.advance(PREKEY_LIFETIME_MS);
      await ensure();
    }

    expect(store.data.get(USER).preKeys.map((k) => k.keyId)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    expect(store.data.get(USER).currentPreKeyId).toBe(11);
  });

  it("adopts a pre-key whose upload succeeded but whose response was lost", async () => {
    const { store, api, ensure } = setup();
    const register = api.registerPreKey;
    api.registerPreKey = async (args) => {
      await register(args);
      throw new Error("network dropped");
    };
    await expect(ensure()).rejects.toThrow("network dropped");
    api.registerPreKey = register;

    const result = await ensure();

    expect(result).toMatchObject({ preKeyId: 1, rotated: false });
    expect(store.data.get(USER).currentPreKeyId).toBe(1);
  });

  it("re-registers identity and a fresh pre-key when the server lost this device", async () => {
    const { api, ensure } = setup();
    const first = await ensure();
    api.state.identity = null;
    api.state.preKey = null;

    const result = await ensure();

    expect(result).toMatchObject({ identityRegistered: true, rotated: true, preKeyId: 2 });
    expect(result.fingerprint).toBe(first.fingerprint);
    expect(api.state.preKey.keyId).toBe(2);
  });
});
