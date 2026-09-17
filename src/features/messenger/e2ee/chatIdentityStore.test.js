import { describe, expect, it } from "vitest";
import {
  CHAT_IDENTITY_STATUS,
  MissingPasswordError,
  NoChatKeyError,
  createChatIdentityStore,
} from "./chatIdentityStore";
import { WrongSecretError, createUserKeyBundle } from "./userKeyManager";

const S = CHAT_IDENTITY_STATUS;
const USER = "7f1c2d9e-0000-4000-8000-000000000001";

/** Same shape axios throws: err.response.status */
function httpError(status) {
  const err = new Error(`HTTP ${status}`);
  err.response = { status };
  return err;
}

/** Mirrors ChatKeysController: one row per user, versioned, 409 on conflicting register. */
function fakeApi() {
  let row = null; // { PublicKey, WrappedByPassword, PasswordSalt, WrappedByRecovery, RecoverySalt, KeyVersion }
  const calls = { getMine: 0, register: 0, rewrap: 0 };

  return {
    calls,
    /** Test hook: simulate the server having a key nobody in this test created (e.g. another device). */
    seed: (bundle) => {
      row = { ...bundle, KeyVersion: 1 };
    },
    getMine: async () => {
      calls.getMine++;
      if (!row) throw httpError(404);
      return { ...row };
    },
    register: async (body) => {
      calls.register++;
      if (!row) {
        row = { ...body, KeyVersion: 1 };
        return { ...row };
      }
      if (row.PublicKey === body.PublicKey) return { ...row }; // no-op resend
      throw httpError(409); // someone else registered first
    },
    rewrap: async (body) => {
      calls.rewrap++;
      if (!row) throw httpError(404);
      if (row.KeyVersion !== body.KeyVersion) throw httpError(400);
      row = {
        ...row,
        WrappedByPassword: body.WrappedByPassword,
        PasswordSalt: body.PasswordSalt,
        KeyVersion: row.KeyVersion + 1,
      };
      return { ...row };
    },
  };
}

function memoryKeyStore() {
  const data = new Map();
  return {
    data,
    get: async (userId) => data.get(userId),
    put: async (record) => void data.set(record.userId, record),
    delete: async (userId) => void data.delete(userId),
  };
}

function setup({ supported = true } = {}) {
  const api = fakeApi();
  const keyStore = memoryKeyStore();
  const store = createChatIdentityStore({ api, keyStore, isSupported: () => supported });
  return { api, keyStore, store };
}

describe("chatIdentityStore", () => {
  const PASSWORD = "correct horse battery staple";
  const NEW_PASSWORD = "new-password-after-reset";

  it("first login: creates a key, shows the recovery code once, ends READY", async () => {
    const { api, keyStore, store } = setup();

    await store.getState().initializeAfterLogin({ userId: USER, password: PASSWORD });

    expect(store.getState().status).toBe(S.READY);
    expect(store.getState().pendingRecoveryCode).toMatch(/^([0-9A-HJKMNPQRSTVWXYZ]{4}-){5}[0-9A-HJKMNPQRSTVWXYZ]{4}$/);
    expect(api.calls.register).toBe(1);
    expect(keyStore.data.has(USER)).toBe(true);

    store.getState().acknowledgeRecoveryCode();
    expect(store.getState().pendingRecoveryCode).toBeNull();
  });

  it("page reload: local key matches the server, no recovery code, no re-register", async () => {
    const { api, store } = setup();
    await store.getState().initializeAfterLogin({ userId: USER, password: PASSWORD });
    store.getState().acknowledgeRecoveryCode();

    await store.getState().restoreSession({ userId: USER });

    expect(store.getState().status).toBe(S.READY);
    expect(store.getState().pendingRecoveryCode).toBeNull();
    expect(api.calls.register).toBe(1); // unchanged
  });

  it("re-login after logout: same password, same key, no new recovery code", async () => {
    const { api, keyStore, store } = setup();
    await store.getState().initializeAfterLogin({ userId: USER, password: PASSWORD });
    store.getState().acknowledgeRecoveryCode();

    await store.getState().forgetLocalKey(USER);
    expect(keyStore.data.has(USER)).toBe(false);
    expect(store.getState().status).toBe(S.IDLE);

    await store.getState().initializeAfterLogin({ userId: USER, password: PASSWORD });

    expect(store.getState().status).toBe(S.READY);
    expect(store.getState().pendingRecoveryCode).toBeNull();
    expect(api.calls.register).toBe(1); // no-op resend, not a fresh create
    expect(keyStore.data.has(USER)).toBe(true);
  });

  it("login after a password reset: wrong password locks for recovery and drops the stale local key", async () => {
    const { keyStore, store } = setup();
    await store.getState().initializeAfterLogin({ userId: USER, password: PASSWORD });
    store.getState().acknowledgeRecoveryCode();
    await store.getState().forgetLocalKey(USER);

    await store.getState().initializeAfterLogin({ userId: USER, password: "some-other-password" });

    expect(store.getState().status).toBe(S.LOCKED_NEED_RECOVERY);
    expect(store.getState().unlockOpen).toBe(true);
    expect(keyStore.data.has(USER)).toBe(false);
    // the login password is remembered so the unlock modal only needs the recovery code
    expect(store.getState().hasLoginPassword).toBe(true);
  });

  it("wrong recovery code is rejected and leaves the store locked", async () => {
    const { store } = setup();
    await store.getState().initializeAfterLogin({ userId: USER, password: PASSWORD });
    const goodCode = store.getState().pendingRecoveryCode;
    store.getState().acknowledgeRecoveryCode();
    await store.getState().forgetLocalKey(USER);
    await store.getState().initializeAfterLogin({ userId: USER, password: "wrong-password" });
    expect(store.getState().status).toBe(S.LOCKED_NEED_RECOVERY);

    await expect(
      store.getState().unlockWithRecoveryCode("WGN2-8F9K-M3NP-7X4R-29TV-B8CQ"),
    ).rejects.toBeInstanceOf(WrongSecretError);
    expect(goodCode).not.toBe("WGN2-8F9K-M3NP-7X4R-29TV-B8CQ");
    expect(store.getState().status).toBe(S.LOCKED_NEED_RECOVERY);
  });

  it("correct recovery code re-wraps under the current password and bumps KeyVersion", async () => {
    const { api, keyStore, store } = setup();
    await store.getState().initializeAfterLogin({ userId: USER, password: PASSWORD });
    const code = store.getState().pendingRecoveryCode;
    store.getState().acknowledgeRecoveryCode();
    await store.getState().forgetLocalKey(USER);
    await store.getState().initializeAfterLogin({ userId: USER, password: NEW_PASSWORD });
    expect(store.getState().status).toBe(S.LOCKED_NEED_RECOVERY);

    await store.getState().unlockWithRecoveryCode(code);

    expect(store.getState().status).toBe(S.READY);
    expect(store.getState().unlockOpen).toBe(false);
    expect(api.calls.rewrap).toBe(1);
    expect(keyStore.data.get(USER).keyVersion).toBe(2);
  });

  it("re-login with the new password after recovery succeeds directly (no recovery needed again)", async () => {
    const { store } = setup();
    await store.getState().initializeAfterLogin({ userId: USER, password: PASSWORD });
    const code = store.getState().pendingRecoveryCode;
    store.getState().acknowledgeRecoveryCode();
    await store.getState().forgetLocalKey(USER);
    await store.getState().initializeAfterLogin({ userId: USER, password: NEW_PASSWORD });
    await store.getState().unlockWithRecoveryCode(code);
    await store.getState().forgetLocalKey(USER);

    await store.getState().initializeAfterLogin({ userId: USER, password: NEW_PASSWORD });

    expect(store.getState().status).toBe(S.READY);
    expect(store.getState().pendingRecoveryCode).toBeNull();
  });

  it("reload with no local key locks for password; recovery flow works without a memoized password", async () => {
    const { api, keyStore, store } = setup();
    await store.getState().initializeAfterLogin({ userId: USER, password: PASSWORD });
    const code = store.getState().pendingRecoveryCode;
    store.getState().acknowledgeRecoveryCode();
    await keyStore.delete(USER); // simulate cleared site data, without going through logout
    store.getState().reset(); // simulate the page reload itself (fresh IDLE state)

    await store.getState().restoreSession({ userId: USER });
    expect(store.getState().status).toBe(S.LOCKED_NEED_PASSWORD);
    expect(store.getState().hasLoginPassword).toBe(false);

    // MissingPasswordError when no password is supplied and none is in memory
    await expect(store.getState().unlockWithRecoveryCode(code)).rejects.toBeInstanceOf(
      MissingPasswordError,
    );

    // explicit current password supplied by the modal
    await store.getState().unlockWithRecoveryCode(code, NEW_PASSWORD);

    expect(store.getState().status).toBe(S.READY);
    expect(api.calls.rewrap).toBe(1);
  });

  it("unlockWithPassword in LOCKED_NEED_PASSWORD state unwraps and stores the key", async () => {
    const { keyStore, store } = setup();
    await store.getState().initializeAfterLogin({ userId: USER, password: PASSWORD });
    store.getState().acknowledgeRecoveryCode();
    await keyStore.delete(USER);
    store.getState().reset(); // simulate the page reload itself (fresh IDLE state)
    await store.getState().restoreSession({ userId: USER });
    expect(store.getState().status).toBe(S.LOCKED_NEED_PASSWORD);

    await store.getState().unlockWithPassword(PASSWORD);

    expect(store.getState().status).toBe(S.READY);
    expect(keyStore.data.has(USER)).toBe(true);
  });

  it("unlockWithPassword rejects with WrongSecretError on a bad password and stays locked", async () => {
    const { store } = setup();
    await store.getState().initializeAfterLogin({ userId: USER, password: PASSWORD });
    store.getState().acknowledgeRecoveryCode();
    await store.getState().forgetLocalKey(USER);
    await store.getState().restoreSession({ userId: USER });
    expect(store.getState().status).toBe(S.LOCKED_NEED_PASSWORD);

    await expect(store.getState().unlockWithPassword("nope")).rejects.toBeInstanceOf(WrongSecretError);
    expect(store.getState().status).toBe(S.LOCKED_NEED_PASSWORD);
  });

  it("server key wiped out from under a stale local copy: drops it and locks for password", async () => {
    const { api, keyStore, store } = setup();
    await store.getState().initializeAfterLogin({ userId: USER, password: PASSWORD });
    store.getState().acknowledgeRecoveryCode();
    // simulate the server-side row disappearing (e.g. admin wipe) while a local copy remains
    api.seed(null);
    Object.defineProperty(api, "getMine", {
      value: async () => {
        throw httpError(404);
      },
    });
    store.getState().reset(); // simulate the page reload itself (fresh IDLE state)

    await store.getState().restoreSession({ userId: USER });

    expect(store.getState().status).toBe(S.LOCKED_NEED_PASSWORD);
    expect(keyStore.data.has(USER)).toBe(false);
  });

  it("409 on register (another tab won the race) adopts the winning key instead of erroring", async () => {
    const { api, store } = setup();
    // Pre-seed the server as if another tab already registered a different key
    const winner = await createUserKeyBundle("their-password");
    api.seed(winner.registration);

    await store.getState().initializeAfterLogin({ userId: USER, password: PASSWORD });

    // Our own password can't unlock the winner's key, so the store should land
    // locked for recovery rather than silently registering (and losing) our own bundle.
    expect(store.getState().status).toBe(S.LOCKED_NEED_RECOVERY);
  });

  it("unsupported browser (no secure context / WebCrypto / IndexedDB) short-circuits to UNSUPPORTED", async () => {
    const { store } = setup({ supported: false });

    await store.getState().initializeAfterLogin({ userId: USER, password: PASSWORD });

    expect(store.getState().status).toBe(S.UNSUPPORTED);
  });

  it("network/server failure on first login surfaces ERROR", async () => {
    const api = {
      getMine: async () => {
        throw new Error("network down");
      },
      register: async () => {
        throw new Error("unreachable");
      },
      rewrap: async () => {
        throw new Error("unreachable");
      },
    };
    const failingStore = createChatIdentityStore({
      api,
      keyStore: memoryKeyStore(),
      isSupported: () => true,
    });

    await failingStore.getState().initializeAfterLogin({ userId: USER, password: PASSWORD });

    expect(failingStore.getState().status).toBe(S.ERROR);
  });

  it("offline restoreSession with a local key present stays READY (offline-tolerant)", async () => {
    const { keyStore, store, api } = setup();
    await store.getState().initializeAfterLogin({ userId: USER, password: PASSWORD });
    store.getState().acknowledgeRecoveryCode();

    const flakyApi = {
      ...api,
      getMine: async () => {
        throw new Error("network down");
      },
    };
    const reloaded = createChatIdentityStore({ api: flakyApi, keyStore, isSupported: () => true });

    await reloaded.getState().restoreSession({ userId: USER });

    expect(reloaded.getState().status).toBe(S.READY);
  });

  it("recovery code sent while LOCKED with an invalid format throws InvalidRecoveryCodeError before touching the network", async () => {
    const { api, store } = setup();
    await store.getState().initializeAfterLogin({ userId: USER, password: PASSWORD });
    store.getState().acknowledgeRecoveryCode();
    await store.getState().forgetLocalKey(USER);
    await store.getState().initializeAfterLogin({ userId: USER, password: "different" });
    expect(store.getState().status).toBe(S.LOCKED_NEED_RECOVERY);

    const rewrapsBefore = api.calls.rewrap;
    await expect(store.getState().unlockWithRecoveryCode("not-a-real-code")).rejects.toThrow(
      /24 letters and numbers/,
    );
    expect(api.calls.rewrap).toBe(rewrapsBefore);
  });
});
