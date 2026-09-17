/**
 * IndexedDB storage for the logged-in user's unwrapped chat private key.
 *
 * The key is stored as a NON-extractable CryptoKey: the browser can use it to
 * derive message keys, but JavaScript (and the server) can never read the raw
 * key bytes. One record per user, so shared browsers keep users separate.
 *
 * Record shape:
 * { userId, privateKey: CryptoKey, publicKey: base64Spki, keyVersion, savedAt }
 *
 * DB version 2 replaces the old device-based "deviceKeys" store — those keys
 * belonged to the retired per-device design and can't read anything anymore.
 */

const DB_NAME = "wg-e2ee";
const DB_VERSION = 2;
const STORE = "userKeys";
const LEGACY_STORE = "deviceKeys";

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (db.objectStoreNames.contains(LEGACY_STORE)) {
        db.deleteObjectStore(LEGACY_STORE);
      }
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "userId" });
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      // Another tab upgraded the DB — close so it isn't blocked, reopen on next use
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
}

function run(mode, action) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const request = action(tx.objectStore(STORE));
        tx.oncomplete = () => resolve(request.result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      }),
  );
}

export const indexedDbKeyStore = {
  /** @returns {Promise<object|undefined>} */
  get: (userId) => run("readonly", (store) => store.get(userId)),

  /** Saves the unlocked key for a user, replacing any previous one. */
  put: ({ userId, privateKey, publicKey, keyVersion }) => {
    if (!userId) return Promise.reject(new Error("userId is required"));
    if (!(privateKey instanceof CryptoKey) || privateKey.extractable) {
      return Promise.reject(new Error("Only non-extractable private keys may be stored"));
    }
    return run("readwrite", (store) =>
      store.put({ userId, privateKey, publicKey, keyVersion, savedAt: Date.now() }),
    );
  },

  /** Forgets a user's key (e.g. on logout, or when the server key no longer matches). */
  delete: (userId) => run("readwrite", (store) => store.delete(userId)),
};
