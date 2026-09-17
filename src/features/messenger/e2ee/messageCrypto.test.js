import { describe, expect, it } from "vitest";
import { MESSAGE_VERSION, additionalData, decryptMessage, encryptMessage } from "./messageCrypto";
import { exportPublicKey, fromBase64, generateUserKeyPair, importPrivateKey, toBase64 } from "./userKeyManager";

/** A user with a real, non-extractable ECDH private key and a base64 SPKI public key. */
async function makeUser(id) {
  const keyPair = await generateUserKeyPair();
  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", keyPair.privateKey));
  return { id, privateKey: await importPrivateKey(pkcs8), publicKey: await exportPublicKey(keyPair.publicKey) };
}

const conversationId = () => crypto.randomUUID();
const asRecipients = (users) => users.map((u) => ({ userId: u.id, publicKey: u.publicKey }));

/** Builds the ChatMessageDto shape decryptMessage expects, from encryptMessage's output. */
function dtoFor(body, senderUserId, conversationId, recipientUserId) {
  return {
    ConversationId: conversationId,
    SenderUserId: senderUserId,
    ClientMessageId: body.ClientMessageId,
    EncryptedPayload: body.EncryptedPayload,
    WrappedMessageKey: body.Keys.find((k) => k.RecipientUserId === recipientUserId)?.WrappedMessageKey,
  };
}

describe("encryptMessage", () => {
  it("wraps a 40-byte AES-KW key once per recipient", async () => {
    const [alice, bob, carol] = await Promise.all([makeUser("alice"), makeUser("bob"), makeUser("carol")]);
    const body = await encryptMessage({
      payload: { type: "text", text: "hi" },
      conversationId: conversationId(),
      senderUserId: alice.id,
      senderPrivateKey: alice.privateKey,
      recipients: asRecipients([alice, bob, carol]),
    });

    expect(body.Keys).toHaveLength(3);
    expect(body.Keys.map((k) => k.RecipientUserId).sort()).toEqual(["alice", "bob", "carol"]);
    body.Keys.forEach((k) => expect(fromBase64(k.WrappedMessageKey)).toHaveLength(40));
  });

  it("generates a random ClientMessageId when none is given, and honors one when given", async () => {
    const [alice, bob] = await Promise.all([makeUser("alice"), makeUser("bob")]);
    const args = {
      payload: { type: "text", text: "hi" },
      conversationId: conversationId(),
      senderUserId: alice.id,
      senderPrivateKey: alice.privateKey,
      recipients: asRecipients([alice, bob]),
    };

    const auto1 = await encryptMessage(args);
    const auto2 = await encryptMessage(args);
    expect(auto1.ClientMessageId).not.toBe(auto2.ClientMessageId);

    const fixed = await encryptMessage({ ...args, clientMessageId: "fixed-id" });
    expect(fixed.ClientMessageId).toBe("fixed-id");
  });

  it("throws when there are no recipients", async () => {
    const alice = await makeUser("alice");
    await expect(
      encryptMessage({
        payload: { type: "text", text: "hi" },
        conversationId: conversationId(),
        senderUserId: alice.id,
        senderPrivateKey: alice.privateKey,
        recipients: [],
      }),
    ).rejects.toThrow(/no recipients/i);
  });

  it("throws when the sender isn't one of the recipients", async () => {
    const [alice, bob] = await Promise.all([makeUser("alice"), makeUser("bob")]);
    await expect(
      encryptMessage({
        payload: { type: "text", text: "hi" },
        conversationId: conversationId(),
        senderUserId: alice.id,
        senderPrivateKey: alice.privateKey,
        recipients: asRecipients([bob]),
      }),
    ).rejects.toThrow(/sender must be one of the recipients/i);
  });

  it("accepts recipient public keys as base64 strings or already-imported CryptoKeys", async () => {
    const [alice, bob] = await Promise.all([makeUser("alice"), makeUser("bob")]);
    const bobKey = await crypto.subtle.importKey(
      "spki",
      fromBase64(bob.publicKey),
      { name: "ECDH", namedCurve: "P-256" },
      false,
      [],
    );
    const body = await encryptMessage({
      payload: { type: "text", text: "hi" },
      conversationId: conversationId(),
      senderUserId: alice.id,
      senderPrivateKey: alice.privateKey,
      recipients: [
        { userId: alice.id, publicKey: alice.publicKey }, // string
        { userId: bob.id, publicKey: bobKey }, // CryptoKey
      ],
    });
    expect(body.Keys).toHaveLength(2);
  });
});

describe("additionalData", () => {
  it("lower-cases and joins the fields, so casing differences still match at decrypt", () => {
    const a = additionalData({ conversationId: "AAAA", senderUserId: "BBBB", clientMessageId: "CCCC" });
    const b = additionalData({ conversationId: "aaaa", senderUserId: "bbbb", clientMessageId: "cccc" });
    expect(new TextDecoder().decode(a)).toBe(`${MESSAGE_VERSION}|aaaa|bbbb|cccc`);
    expect(a).toEqual(b);
  });
});

describe("encryptMessage / decryptMessage round trip", () => {
  it("lets a recipient decrypt the message", async () => {
    const [alice, bob] = await Promise.all([makeUser("alice"), makeUser("bob")]);
    const convId = conversationId();
    const body = await encryptMessage({
      payload: { type: "text", text: "hi 👋 bob" },
      conversationId: convId,
      senderUserId: alice.id,
      senderPrivateKey: alice.privateKey,
      recipients: asRecipients([alice, bob]),
    });

    const result = await decryptMessage(dtoFor(body, alice.id, convId, bob.id), {
      privateKey: bob.privateKey,
      senderPublicKey: alice.publicKey,
    });

    expect(result).toEqual({ status: "ok", body: { v: 1, type: "text", text: "hi 👋 bob" } });
  });

  it("lets the sender decrypt their own copy", async () => {
    const [alice, bob] = await Promise.all([makeUser("alice"), makeUser("bob")]);
    const convId = conversationId();
    const body = await encryptMessage({
      payload: { type: "text", text: "my own message" },
      conversationId: convId,
      senderUserId: alice.id,
      senderPrivateKey: alice.privateKey,
      recipients: asRecipients([alice, bob]),
    });

    const result = await decryptMessage(dtoFor(body, alice.id, convId, alice.id), {
      privateKey: alice.privateKey,
      senderPublicKey: alice.publicKey,
    });

    expect(result.status).toBe("ok");
    expect(result.body.text).toBe("my own message");
  });

  it("returns no-key when the message carries no wrapped key for this reader", async () => {
    const [alice, bob, carol] = await Promise.all([makeUser("alice"), makeUser("bob"), makeUser("carol")]);
    const convId = conversationId();
    const body = await encryptMessage({
      payload: { type: "text", text: "hi" },
      conversationId: convId,
      senderUserId: alice.id,
      senderPrivateKey: alice.privateKey,
      recipients: asRecipients([alice, bob]),
    });

    const dto = { ...dtoFor(body, alice.id, convId, bob.id), WrappedMessageKey: undefined };
    const result = await decryptMessage(dto, { privateKey: carol.privateKey, senderPublicKey: alice.publicKey });
    expect(result).toEqual({ status: "no-key" });
  });

  it("rejects decryption with the wrong reader private key", async () => {
    const [alice, bob, carol] = await Promise.all([makeUser("alice"), makeUser("bob"), makeUser("carol")]);
    const convId = conversationId();
    const body = await encryptMessage({
      payload: { type: "text", text: "hi" },
      conversationId: convId,
      senderUserId: alice.id,
      senderPrivateKey: alice.privateKey,
      recipients: asRecipients([alice, bob]),
    });

    const result = await decryptMessage(dtoFor(body, alice.id, convId, bob.id), {
      privateKey: carol.privateKey,
      senderPublicKey: alice.publicKey,
    });
    expect(result).toEqual({ status: "error" });
  });

  it("rejects decryption against the wrong sender public key", async () => {
    const [alice, bob, mallory] = await Promise.all([makeUser("alice"), makeUser("bob"), makeUser("mallory")]);
    const convId = conversationId();
    const body = await encryptMessage({
      payload: { type: "text", text: "hi" },
      conversationId: convId,
      senderUserId: alice.id,
      senderPrivateKey: alice.privateKey,
      recipients: asRecipients([alice, bob]),
    });

    const result = await decryptMessage(dtoFor(body, alice.id, convId, bob.id), {
      privateKey: bob.privateKey,
      senderPublicKey: mallory.publicKey,
    });
    expect(result).toEqual({ status: "error" });
  });

  it("rejects a message the server relabelled with a spoofed sender", async () => {
    const [alice, bob] = await Promise.all([makeUser("alice"), makeUser("bob")]);
    const convId = conversationId();
    const body = await encryptMessage({
      payload: { type: "text", text: "hi" },
      conversationId: convId,
      senderUserId: alice.id,
      senderPrivateKey: alice.privateKey,
      recipients: asRecipients([alice, bob]),
    });

    const dto = { ...dtoFor(body, alice.id, convId, bob.id), SenderUserId: "mallory" };
    const result = await decryptMessage(dto, { privateKey: bob.privateKey, senderPublicKey: alice.publicKey });
    expect(result).toEqual({ status: "error" });
  });

  it("rejects a message the server moved to a different conversation", async () => {
    const [alice, bob] = await Promise.all([makeUser("alice"), makeUser("bob")]);
    const convId = conversationId();
    const body = await encryptMessage({
      payload: { type: "text", text: "hi" },
      conversationId: convId,
      senderUserId: alice.id,
      senderPrivateKey: alice.privateKey,
      recipients: asRecipients([alice, bob]),
    });

    const dto = { ...dtoFor(body, alice.id, convId, bob.id), ConversationId: conversationId() };
    const result = await decryptMessage(dto, { privateKey: bob.privateKey, senderPublicKey: alice.publicKey });
    expect(result).toEqual({ status: "error" });
  });

  it("rejects tampered ciphertext", async () => {
    const [alice, bob] = await Promise.all([makeUser("alice"), makeUser("bob")]);
    const convId = conversationId();
    const body = await encryptMessage({
      payload: { type: "text", text: "hi" },
      conversationId: convId,
      senderUserId: alice.id,
      senderPrivateKey: alice.privateKey,
      recipients: asRecipients([alice, bob]),
    });

    const blob = fromBase64(body.EncryptedPayload);
    blob[blob.length - 1] ^= 0xff; // flip a byte inside the GCM tag/ciphertext
    const dto = { ...dtoFor(body, alice.id, convId, bob.id), EncryptedPayload: toBase64(blob) };
    const result = await decryptMessage(dto, { privateKey: bob.privateKey, senderPublicKey: alice.publicKey });
    expect(result).toEqual({ status: "error" });
  });

  it("rejects a wrapped key swapped from another message (different HKDF salt)", async () => {
    const [alice, bob] = await Promise.all([makeUser("alice"), makeUser("bob")]);
    const convId = conversationId();
    const args = {
      conversationId: convId,
      senderUserId: alice.id,
      senderPrivateKey: alice.privateKey,
      recipients: asRecipients([alice, bob]),
    };
    const first = await encryptMessage({ ...args, payload: { type: "text", text: "first" } });
    const second = await encryptMessage({ ...args, payload: { type: "text", text: "second" } });

    // Attach the second message's wrapped key (wrong salt) to the first message's envelope
    const dto = dtoFor(first, alice.id, convId, bob.id);
    dto.WrappedMessageKey = second.Keys.find((k) => k.RecipientUserId === bob.id).WrappedMessageKey;

    const result = await decryptMessage(dto, { privateKey: bob.privateKey, senderPublicKey: alice.publicKey });
    expect(result).toEqual({ status: "error" });
  });

  it("rejects a payload that doesn't match the expected text-message shape", async () => {
    const [alice, bob] = await Promise.all([makeUser("alice"), makeUser("bob")]);
    const convId = conversationId();
    const body = await encryptMessage({
      payload: { type: "text", text: 12345 }, // wrong type for `text`
      conversationId: convId,
      senderUserId: alice.id,
      senderPrivateKey: alice.privateKey,
      recipients: asRecipients([alice, bob]),
    });

    const result = await decryptMessage(dtoFor(body, alice.id, convId, bob.id), {
      privateKey: bob.privateKey,
      senderPublicKey: alice.publicKey,
    });
    expect(result).toEqual({ status: "error" });
  });

  it("returns no-key for a falsy message without throwing", async () => {
    await expect(decryptMessage(null, {})).resolves.toEqual({ status: "no-key" });
  });

  it("round-trips a long message with unicode content", async () => {
    const [alice, bob] = await Promise.all([makeUser("alice"), makeUser("bob")]);
    const convId = conversationId();
    const text = `${"a".repeat(3000)} — こんにちは 🎉`;
    const body = await encryptMessage({
      payload: { type: "text", text },
      conversationId: convId,
      senderUserId: alice.id,
      senderPrivateKey: alice.privateKey,
      recipients: asRecipients([alice, bob]),
    });

    const result = await decryptMessage(dtoFor(body, alice.id, convId, bob.id), {
      privateKey: bob.privateKey,
      senderPublicKey: alice.publicKey,
    });
    expect(result.body.text).toBe(text);
  });
});
