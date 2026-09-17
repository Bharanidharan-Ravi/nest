/**
 * Chat identity: makes the logged-in user's chat private key available in this
 * browser (IndexedDB), creating it on first login and recovering it after a
 * password reset.
 *
 *   login (password known)  -> GET /ChatKeys/me
 *       404  -> create key, POST /ChatKeys/me, show recovery code once   -> READY
 *       200  -> unwrap with password                                     -> READY
 *               unwrap fails (password was reset)                        -> LOCKED_NEED_RECOVERY
 *   page reload (no password) -> key in IndexedDB matches server         -> READY
 *                                otherwise                               -> LOCKED_NEED_PASSWORD
 *
 * The login password is held only in a module variable, and only while a
 * recovery unlock may still need it. It is never put in state or storage.
 */

import { create } from "zustand";
import { chatKeysApi } from "./chatKeys.api";
import { indexedDbKeyStore } from "./keyStore";
import {
  WrongSecretError,
  createUserKeyBundle,
  recoverWithCode,
  unlockWithPassword,
} from "./userKeyManager";

export const CHAT_IDENTITY_STATUS = {
  IDLE: "IDLE", // not logged in
  INITIALIZING: "INITIALIZING",
  READY: "READY",
  LOCKED_NEED_PASSWORD: "LOCKED_NEED_PASSWORD", // key exists but isn't in this browser, password not in memory
  LOCKED_NEED_RECOVERY: "LOCKED_NEED_RECOVERY", // password no longer unwraps the key
  UNSUPPORTED: "UNSUPPORTED", // no WebCrypto / IndexedDB (plain http on a non-localhost host)
  ERROR: "ERROR", // network / server failure
};

export class MissingPasswordError extends Error {
  constructor() {
    super("Enter your current WGNest password.");
    this.name = "MissingPasswordError";
  }
}

export class NoChatKeyError extends Error {
  constructor() {
    super("Secure chat hasn't been set up for this account yet. Log in again to set it up.");
    this.name = "NoChatKeyError";
  }
}

const S = CHAT_IDENTITY_STATUS;

const httpStatus = (err) => err?.response?.status;

function browserSupportsChatCrypto() {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    !!window.crypto?.subtle &&
    !!window.indexedDB
  );
}

const initialState = {
  status: S.IDLE,
  userId: null,
  error: null,
  /** Shown once by SaveRecoveryCodeModal, then cleared. */
  pendingRecoveryCode: null,
  unlockOpen: false,
  /** Whether a recovery unlock can reuse the login password (the password itself is never in state). */
  hasLoginPassword: false,
};

/**
 * @param {object} deps
 * @param {object} deps.api         { getMine, register, rewrap }
 * @param {object} deps.keyStore    { get, put, delete }
 * @param {Function} deps.isSupported
 */
export function createChatIdentityStore({
  api = chatKeysApi,
  keyStore = indexedDbKeyStore,
  isSupported = browserSupportsChatCrypto,
} = {}) {
  let loginPassword = null;
  // Bumped on every new flow and on reset, so a slow flow can't overwrite newer state
  let generation = 0;

  return create((set, get) => {
    const rememberPassword = (password) => {
      loginPassword = password;
      set({ hasLoginPassword: !!password });
    };
    const forgetPassword = () => rememberPassword(null);

    const fetchBundle = async () => {
      try {
        return await api.getMine();
      } catch (err) {
        if (httpStatus(err) === 404) return null;
        throw err;
      }
    };

    const saveKey = (userId, privateKey, bundle) =>
      keyStore.put({
        userId,
        privateKey,
        publicKey: bundle.PublicKey,
        keyVersion: bundle.KeyVersion,
      });

    /**
     * Gets the key into this browser using the password: registers a new key if the
     * server has none, otherwise unwraps the existing one.
     * @throws {WrongSecretError} the password doesn't unwrap the server's key
     * @returns {Promise<boolean>} false if a newer flow started meanwhile
     */
    const runPasswordFlow = async (userId, password, run) => {
      const stale = () => run !== generation;

      let bundle = await fetchBundle();
      if (stale()) return false;

      if (!bundle) {
        const created = await createUserKeyBundle(password);
        try {
          bundle = await api.register(created.registration);
        } catch (err) {
          // Another tab or device registered first — use theirs
          if (httpStatus(err) !== 409) throw err;
          bundle = await fetchBundle();
          if (!bundle) throw err;
        }
        if (stale()) return false;

        if (bundle.PublicKey === created.publicKey) {
          // Show the code before anything else can fail: the server already has
          // this key, and the code can never be shown again
          set({ pendingRecoveryCode: created.recoveryCode });
          await saveKey(userId, created.privateKey, bundle);
          return true;
        }
      }

      const privateKey = await unlockWithPassword(bundle, password);
      if (stale()) return false;
      await saveKey(userId, privateKey, bundle);
      return true;
    };

    return {
      ...initialState,

      /** Called by the login page right after a successful login. Never throws. */
      initializeAfterLogin: async ({ userId, password }) => {
        const run = ++generation;
        if (!isSupported()) {
          forgetPassword();
          set({ ...initialState, status: S.UNSUPPORTED, userId });
          return;
        }

        rememberPassword(password);
        set({ ...initialState, status: S.INITIALIZING, userId, hasLoginPassword: true });

        try {
          if (!(await runPasswordFlow(userId, password, run))) return;
          forgetPassword();
          set({ status: S.READY });
        } catch (err) {
          if (run !== generation) return;

          if (err instanceof WrongSecretError) {
            // Password was reset since the key was wrapped. Keep the password in
            // memory so the unlock modal only needs the recovery code.
            await keyStore.delete(userId).catch(() => {});
            set({ status: S.LOCKED_NEED_RECOVERY, unlockOpen: true });
            return;
          }

          forgetPassword();
          console.error("[Chat] Setting up the chat key failed", err);
          set({ status: S.ERROR, error: "Secure chat couldn't be set up. Try logging in again." });
        }
      },

      /** Called on app load when a session already exists (page reload). Never throws. */
      restoreSession: async ({ userId }) => {
        const { status, userId: current } = get();
        // The login flow for this user is already running (or done)
        if (current === userId && status !== S.IDLE) return;

        const run = ++generation;
        if (!isSupported()) {
          set({ ...initialState, status: S.UNSUPPORTED, userId });
          return;
        }
        set({ ...initialState, status: S.INITIALIZING, userId });

        let local = null;
        try {
          local = await keyStore.get(userId);
          const bundle = await fetchBundle();
          if (run !== generation) return;

          if (local && bundle && local.publicKey === bundle.PublicKey) {
            if (local.keyVersion !== bundle.KeyVersion) {
              await keyStore.put({ ...local, keyVersion: bundle.KeyVersion });
            }
            set({ status: S.READY });
            return;
          }

          // Server key was replaced or removed — the local key can't read anything new
          if (local) await keyStore.delete(userId);
          set({ status: S.LOCKED_NEED_PASSWORD });
        } catch (err) {
          if (run !== generation) return;
          // Offline or server error: a key already in this browser is still usable
          console.warn("[Chat] Couldn't verify the chat key with the server", err);
          set(local ? { status: S.READY } : { status: S.ERROR, error: "Secure chat is unavailable right now." });
        }
      },

      /**
       * Unlock modal, password mode. Throws for the modal to display:
       * {@link WrongSecretError} for a wrong (or since-reset) password.
       */
      unlockWithPassword: async (password) => {
        const { userId } = get();
        const run = ++generation;
        set({ error: null });

        if (!(await runPasswordFlow(userId, password, run))) return;
        forgetPassword();
        set({ status: S.READY, unlockOpen: false });
      },

      /**
       * Unlock modal, recovery mode. Re-wraps the key under the current password.
       * @param {string} recoveryCode
       * @param {string} [password] required when the login password isn't in memory (page was reloaded)
       * Throws InvalidRecoveryCodeError / WrongSecretError / NoChatKeyError for the modal to display.
       */
      unlockWithRecoveryCode: async (recoveryCode, password) => {
        const { userId } = get();
        const currentPassword = loginPassword ?? password;
        if (!currentPassword) throw new MissingPasswordError();

        const run = ++generation;
        set({ error: null });

        let bundle = await fetchBundle();
        if (!bundle) throw new NoChatKeyError();

        let result = await recoverWithCode(bundle, recoveryCode, currentPassword);
        let updated;
        try {
          updated = await api.rewrap(result.rewrap);
        } catch (err) {
          if (httpStatus(err) !== 400) throw err;
          // Another tab re-wrapped first (KeyVersion moved on) — retry once on the fresh bundle
          const fresh = await fetchBundle();
          if (!fresh || fresh.KeyVersion === bundle.KeyVersion) throw err;
          bundle = fresh;
          result = await recoverWithCode(bundle, recoveryCode, currentPassword);
          updated = await api.rewrap(result.rewrap);
        }
        if (run !== generation) return;

        await saveKey(userId, result.privateKey, updated);
        forgetPassword();
        set({ status: S.READY, unlockOpen: false });
      },

      /** User confirmed they saved the recovery code. */
      acknowledgeRecoveryCode: () => set({ pendingRecoveryCode: null }),

      /** Phase 4's chat page calls this when the user opens chat while locked. */
      openUnlock: () => set({ unlockOpen: true }),
      closeUnlock: () => set({ unlockOpen: false }),

      /** Clears in-memory state (token gone). Does not touch IndexedDB. */
      reset: () => {
        generation++;
        forgetPassword();
        set({ ...initialState });
      },

      /** Logout: also removes this user's key from the browser. */
      forgetLocalKey: async (userIdFromSession) => {
        const userId = userIdFromSession ?? get().userId;
        get().reset();
        if (userId) await keyStore.delete(userId).catch(() => {});
      },
    };
  });
}

export const useChatIdentityStore = createChatIdentityStore();
