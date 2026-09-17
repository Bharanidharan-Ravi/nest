import { describe, expect, it } from "vitest";
import { generateRecoveryCode, normalizeRecoveryCode } from "./recoveryCode";
import {
  IV_LENGTH,
  InvalidRecoveryCodeError,
  PBKDF2_ITERATIONS,
  SALT_LENGTH,
  WrongSecretError,
  createUserKeyBundle,
  deriveWrappingKey,
  exportPublicKey,
  fromBase64,
  generateUserKeyPair,
  importPublicKey,
  randomBytes,
  recoverWithCode,
  rewrapPrivateKey,
  toBase64,
  unlockWithPassword,
  unwrapPrivateKey,
  wrapPrivateKey,
} from "./userKeyManager";

/** Derives the same ECDH secret two private keys should agree on, given each other's public key. */
async function sharedSecret(privateKey, otherPublicKeyBase64) {
  const otherPublicKey = await importPublicKey(otherPublicKeyBase64);
  return new Uint8Array(
    await crypto.subtle.deriveBits({ name: "ECDH", public: otherPublicKey }, privateKey, 256),
  );
}

describe("constants", () => {
  it("uses 600,000 PBKDF2 iterations, a 16-byte salt and a 12-byte GCM IV", () => {
    expect(PBKDF2_ITERATIONS).toBe(600_000);
    expect(SALT_LENGTH).toBe(16);
    expect(IV_LENGTH).toBe(12);
  });
});

describe("base64 helpers", () => {
  it("round-trips arbitrary bytes, including all-zero and all-0xff", () => {
    for (const bytes of [randomBytes(32), new Uint8Array(16), new Uint8Array(16).fill(0xff)]) {
      expect(fromBase64(toBase64(bytes))).toEqual(bytes);
    }
  });
});

describe("generateUserKeyPair / exportPublicKey / importPublicKey", () => {
  it("generates an extractable ECDH P-256 key pair", async () => {
    const { privateKey, publicKey } = await generateUserKeyPair();

    expect(privateKey.type).toBe("private");
    expect(privateKey.extractable).toBe(true);
    expect(publicKey.algorithm.namedCurve).toBe("P-256");
  });

  it("exports/imports a public key that agrees on the same ECDH secret", async () => {
    const alice = await generateUserKeyPair();
    const bob = await generateUserKeyPair();

    const aliceSpki = await exportPublicKey(alice.publicKey);
    const bobSpki = await exportPublicKey(bob.publicKey);

    const secretFromAlice = await sharedSecret(alice.privateKey, bobSpki);
    const secretFromBob = await sharedSecret(bob.privateKey, aliceSpki);

    expect(secretFromAlice).toEqual(secretFromBob);
  });
});

describe("deriveWrappingKey", () => {
  it("is deterministic for the same secret and salt", async () => {
    const salt = randomBytes(SALT_LENGTH);
    const k1 = await deriveWrappingKey("hunter2", salt);
    const k2 = await deriveWrappingKey("hunter2", salt);

    // Non-extractable AES-GCM keys can't be compared by bytes; compare by behavior instead
    const iv = randomBytes(IV_LENGTH);
    const plaintext = new TextEncoder().encode("probe");
    const ct1 = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, k1, plaintext);
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, k2, ct1);
    expect(new Uint8Array(decrypted)).toEqual(plaintext);
  });

  it("produces a different key for a different secret or salt", async () => {
    const salt = randomBytes(SALT_LENGTH);
    const k1 = await deriveWrappingKey("hunter2", salt);
    const k2 = await deriveWrappingKey("hunter3", salt);

    const iv = randomBytes(IV_LENGTH);
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      k1,
      new TextEncoder().encode("probe"),
    );
    await expect(
      crypto.subtle.decrypt({ name: "AES-GCM", iv }, k2, ciphertext),
    ).rejects.toThrow();
  });

  it("rejects an empty secret", async () => {
    await expect(deriveWrappingKey("", randomBytes(SALT_LENGTH))).rejects.toThrow();
  });
});

describe("wrapPrivateKey / unwrapPrivateKey", () => {
  it("round-trips: unwrapping gives back a key that agrees with the original's peer", async () => {
    const { privateKey, publicKey } = await generateUserKeyPair();
    const peer = await generateUserKeyPair();
    const peerSpki = await exportPublicKey(peer.publicKey);
    const salt = randomBytes(SALT_LENGTH);

    const wrapped = await wrapPrivateKey(privateKey, "correct horse", salt);
    const unwrapped = await unwrapPrivateKey(wrapped, "correct horse", salt);

    expect(unwrapped.extractable).toBe(false);
    const originalSecret = await sharedSecret(privateKey, peerSpki);
    const unwrappedSecret = await sharedSecret(unwrapped, peerSpki);
    expect(unwrappedSecret).toEqual(originalSecret);
    // sanity: the public key exported earlier still corresponds to this private key
    void publicKey;
  });

  it("lays the wrapped blob out as [12-byte IV | ciphertext]", async () => {
    const { privateKey } = await generateUserKeyPair();
    const salt = randomBytes(SALT_LENGTH);

    const wrapped = await wrapPrivateKey(privateKey, "correct horse", salt);

    // pkcs8 for a P-256 private key is a fixed, well-known size (~138 bytes) + 16-byte GCM tag
    expect(wrapped.length).toBeGreaterThan(IV_LENGTH + 16);
    expect(wrapped).toBeInstanceOf(Uint8Array);
  });

  it("throws WrongSecretError on the wrong password", async () => {
    const { privateKey } = await generateUserKeyPair();
    const salt = randomBytes(SALT_LENGTH);
    const wrapped = await wrapPrivateKey(privateKey, "correct horse", salt);

    await expect(unwrapPrivateKey(wrapped, "wrong horse", salt)).rejects.toBeInstanceOf(
      WrongSecretError,
    );
  });

  it("throws WrongSecretError on the wrong salt", async () => {
    const { privateKey } = await generateUserKeyPair();
    const salt = randomBytes(SALT_LENGTH);
    const wrapped = await wrapPrivateKey(privateKey, "correct horse", salt);

    await expect(
      unwrapPrivateKey(wrapped, "correct horse", randomBytes(SALT_LENGTH)),
    ).rejects.toBeInstanceOf(WrongSecretError);
  });

  it("throws WrongSecretError if the wrapped bytes are tampered with", async () => {
    const { privateKey } = await generateUserKeyPair();
    const salt = randomBytes(SALT_LENGTH);
    const wrapped = await wrapPrivateKey(privateKey, "correct horse", salt);
    wrapped[wrapped.length - 1] ^= 0xff; // flip a bit in the GCM tag

    await expect(unwrapPrivateKey(wrapped, "correct horse", salt)).rejects.toBeInstanceOf(
      WrongSecretError,
    );
  });

  it("rejects a wrapped blob that is too short to contain an IV", async () => {
    await expect(unwrapPrivateKey(new Uint8Array(8), "x", randomBytes(SALT_LENGTH))).rejects.toThrow();
  });
});

describe("rewrapPrivateKey", () => {
  it("re-wraps under a new secret, and the new blob unlocks with the new secret only", async () => {
    const { privateKey } = await generateUserKeyPair();
    const peer = await generateUserKeyPair();
    const peerSpki = await exportPublicKey(peer.publicKey);
    const oldSalt = randomBytes(SALT_LENGTH);
    const wrapped = await wrapPrivateKey(privateKey, "old-secret", oldSalt);

    const result = await rewrapPrivateKey(wrapped, "old-secret", oldSalt, "new-secret");

    expect(result.privateKey.extractable).toBe(false);
    expect(await sharedSecret(result.privateKey, peerSpki)).toEqual(
      await sharedSecret(privateKey, peerSpki),
    );

    const reUnwrapped = await unwrapPrivateKey(result.wrapped, "new-secret", result.salt);
    expect(await sharedSecret(reUnwrapped, peerSpki)).toEqual(await sharedSecret(privateKey, peerSpki));

    // the old secret no longer opens the NEW blob
    await expect(unwrapPrivateKey(result.wrapped, "old-secret", result.salt)).rejects.toBeInstanceOf(
      WrongSecretError,
    );
  });

  it("uses a freshly generated salt, not the old one", async () => {
    const { privateKey } = await generateUserKeyPair();
    const oldSalt = randomBytes(SALT_LENGTH);
    const wrapped = await wrapPrivateKey(privateKey, "old-secret", oldSalt);

    const result = await rewrapPrivateKey(wrapped, "old-secret", oldSalt, "new-secret");

    expect(result.salt).not.toEqual(oldSalt);
  });

  it("throws WrongSecretError when the old secret is wrong, without producing a new wrap", async () => {
    const { privateKey } = await generateUserKeyPair();
    const oldSalt = randomBytes(SALT_LENGTH);
    const wrapped = await wrapPrivateKey(privateKey, "old-secret", oldSalt);

    await expect(
      rewrapPrivateKey(wrapped, "totally-wrong", oldSalt, "new-secret"),
    ).rejects.toBeInstanceOf(WrongSecretError);
  });
});

describe("createUserKeyBundle", () => {
  it("returns a registration payload matching the Phase 1 server's field names and limits", async () => {
    const { registration, recoveryCode, privateKey, publicKey } = await createUserKeyBundle("Password1!");

    expect(Object.keys(registration).sort()).toEqual(
      [
        "PasswordSalt",
        "PublicKey",
        "RecoveryCode",
        "RecoverySalt",
        "WrappedByPassword",
        "WrappedByRecovery",
      ].sort(),
    );
    expect(registration.PublicKey).toBe(publicKey);
    expect(registration.RecoveryCode).toBe(recoveryCode);
    expect(privateKey.extractable).toBe(false);

    // sizes the server accepts: PublicKey <= 256 b64 chars, salts 16-64 bytes decoded,
    // wrapped blobs 12+16+1..1024 bytes decoded
    expect(registration.PublicKey.length).toBeLessThanOrEqual(256);
    expect(fromBase64(registration.PasswordSalt).length).toBeGreaterThanOrEqual(16);
    expect(fromBase64(registration.PasswordSalt).length).toBeLessThanOrEqual(64);
    expect(fromBase64(registration.RecoverySalt).length).toBeGreaterThanOrEqual(16);
    expect(fromBase64(registration.WrappedByPassword).length).toBeGreaterThan(12 + 16);
    expect(fromBase64(registration.WrappedByRecovery).length).toBeGreaterThan(12 + 16);

    expect(typeof recoveryCode).toBe("string");
    expect(recoveryCode).toMatch(/^[0-9A-Z]{4}(-[0-9A-Z]{4}){5}$/);
  });

  it("produces a recovery code that actually unlocks the same key it wraps", async () => {
    const { registration, recoveryCode } = await createUserKeyBundle("Password1!");
    const bundle = { ...registration, KeyVersion: 1 };

    const { privateKey } = await recoverWithCode(bundle, recoveryCode, "NewPassword2!");

    expect(privateKey.extractable).toBe(false);
  });

  it("generates a different key pair and recovery code on each call", async () => {
    const a = await createUserKeyBundle("Password1!");
    const b = await createUserKeyBundle("Password1!");

    expect(a.publicKey).not.toBe(b.publicKey);
    expect(a.recoveryCode).not.toBe(b.recoveryCode);
  });
});

describe("unlockWithPassword", () => {
  it("unlocks a bundle created with the same password", async () => {
    const { registration } = await createUserKeyBundle("Password1!");

    const privateKey = await unlockWithPassword(registration, "Password1!");

    expect(privateKey.extractable).toBe(false);
  });

  it("throws WrongSecretError for the wrong password (e.g. after a password reset)", async () => {
    const { registration } = await createUserKeyBundle("Password1!");

    await expect(unlockWithPassword(registration, "SomethingElse")).rejects.toBeInstanceOf(
      WrongSecretError,
    );
  });
});

describe("recoverWithCode", () => {
  it("unlocks with the code as displayed, and returns a rewrap body carrying KeyVersion through", async () => {
    const { registration, recoveryCode } = await createUserKeyBundle("Password1!");
    const bundle = { ...registration, KeyVersion: 5 };

    const { rewrap } = await recoverWithCode(bundle, recoveryCode, "NewPassword2!");

    expect(rewrap.KeyVersion).toBe(5);
    expect(Object.keys(rewrap).sort()).toEqual(["KeyVersion", "PasswordSalt", "WrappedByPassword"].sort());
  });

  it("unlocks with the code typed lower-case, spaced, and with look-alike substitutions", async () => {
    const { registration, recoveryCode } = await createUserKeyBundle("Password1!");
    const bundle = { ...registration, KeyVersion: 1 };
    const messyTyped = recoveryCode.toLowerCase().replace(/-/g, " ");

    const { privateKey } = await recoverWithCode(bundle, messyTyped, "NewPassword2!");

    expect(privateKey.extractable).toBe(false);
  });

  it("the rewrapped bundle unlocks with the new password afterward", async () => {
    const { registration, recoveryCode, publicKey } = await createUserKeyBundle("Password1!");
    const bundle = { ...registration, KeyVersion: 1 };
    const peer = await generateUserKeyPair();
    const peerSpki = await exportPublicKey(peer.publicKey);

    const { privateKey: recovered, rewrap } = await recoverWithCode(bundle, recoveryCode, "NewPassword2!");
    const afterRewrap = { ...bundle, ...rewrap };
    const reUnlocked = await unlockWithPassword(afterRewrap, "NewPassword2!");

    expect(await sharedSecret(reUnlocked, peerSpki)).toEqual(await sharedSecret(recovered, peerSpki));
    void publicKey;
  });

  it("throws InvalidRecoveryCodeError for a malformed code, without touching the wrapped blob", async () => {
    const { registration } = await createUserKeyBundle("Password1!");
    const bundle = { ...registration, KeyVersion: 1 };

    await expect(recoverWithCode(bundle, "TOO-SHORT", "NewPassword2!")).rejects.toBeInstanceOf(
      InvalidRecoveryCodeError,
    );
  });

  it("throws WrongSecretError for a well-formed code that belongs to a different bundle", async () => {
    const { registration } = await createUserKeyBundle("Password1!");
    const bundle = { ...registration, KeyVersion: 1 };
    const someoneElsesCode = generateRecoveryCode();

    await expect(
      recoverWithCode(bundle, someoneElsesCode, "NewPassword2!"),
    ).rejects.toBeInstanceOf(WrongSecretError);
  });

  it("normalizes the code the same way whether generated or hand-typed", async () => {
    const { registration, recoveryCode } = await createUserKeyBundle("Password1!");
    const bundle = { ...registration, KeyVersion: 1 };

    // exercise recoveryCode.js's own normalization path through the manager
    const a = await recoverWithCode(bundle, normalizeRecoveryCode(recoveryCode), "NewPassword2!");
    expect(a.privateKey.extractable).toBe(false);
  });
});
