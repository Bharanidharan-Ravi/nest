/**
 * IndexedDB storage for this device's chat key material.
 *
 * Private keys are stored as non-extractable CryptoKey objects: the browser can
 * use them to sign / derive, but JavaScript (and the server) can never read the
 * raw key bytes. One record per user, so shared browsers keep keys separate.
 *
 * Record shape:
 * {
 *   userId, deviceId,
 *   identity: { privateKey: CryptoKey, publicKey: base64Spki, createdAt },
 *   preKeys:  [{ keyId, privateKey: CryptoKey, publicKey, signature, createdAt }],
 *   currentPreKeyId
 * }
 */

const DB_NAME = "wg-e2ee";
const DB_VERSION = 1;
const STORE = "deviceKeys";

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "userId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
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
  get: (userId) => run("readonly", (store) => store.get(userId)),
  put: (record) => run("readwrite", (store) => store.put(record)),
};
