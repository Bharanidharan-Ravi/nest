import { beforeEach, describe, expect, it, vi } from "vitest";

// chatCryptoSession pulls these in as module-level singletons — fake the two that
// touch the network/IndexedDB, and drive chatIdentityStore's real zustand store
// directly with setState, the same way the app would after a real unlock/lock.
vi.mock("./chatKeys.api", () => ({ chatKeysApi: { getParticipantKeys: vi.fn() } }));
vi.mock("./keyStore", () => ({ indexedDbKeyStore: { get: vi.fn() } }));

const { chatKeysApi } = await import("./chatKeys.api");
const { indexedDbKeyStore } = await import("./keyStore");
const { CHAT_IDENTITY_STATUS, useChatIdentityStore } = await import("./chatIdentityStore");
const { exportPublicKey, generateUserKeyPair, importPrivateKey } = await import("./userKeyManager");
const {
  ChatLockedError,
  RecipientNotReadyError,
  clearChatCryptoCaches,
  encryptTextMessage,
  withDecrypted,
} = await import("./chatCryptoSession");

const S = CHAT_IDENTITY_STATUS;

async function makeUser(id) {
  const keyPair = await generateUserKeyPair();
  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", keyPair.privateKey));
  return { id, privateKey: await importPrivateKey(pkcs8), publicKeyBase64: await exportPublicKey(keyPair.publicKey) };
}

function setReady(userId, { privateKey } = {}) {
  useChatIdentityStore.setState({ status: S.READY, userId });
  indexedDbKeyStore.get.mockImplementation(async (id) =>
    id === userId && privateKey ? { userId, privateKey } : undefined,
  );
}

function setDirectory(users) {
  chatKeysApi.getParticipantKeys.mockImplementation(async (ids) =>
    users
      .filter((u) => ids.includes(u.id))
      .map((u) => ({ UserId: u.id, PublicKey: u.publicKeyBase64, KeyVersion: 1 })),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  clearChatCryptoCaches();
  useChatIdentityStore.getState().reset();
});

describe("withDecrypted", () => {
  it("resolves 'locked' instead of throwing when chat isn't READY", async () => {
    useChatIdentityStore.setState({ status: S.LOCKED_NEED_PASSWORD, userId: "alice" });

    const result = await withDecrypted(
      { MessageId: "m1", ConversationId: "c1", SenderUserId: "bob", WrappedMessageKey: "x" },
      "alice",
    );

    expect(result.decrypted).toEqual({ status: "locked" });
    expect(chatKeysApi.getParticipantKeys).not.toHaveBeenCalled();
  });

  it("passes a message through unchanged when it's already decrypted", async () => {
    const already = { MessageId: "m1", decrypted: { status: "ok", body: { text: "hi" } } };
    expect(await withDecrypted(already, "alice")).toBe(already);
  });

  it("returns null/undefined messages as-is", async () => {
    expect(await withDecrypted(null, "alice")).toBeNull();
  });

  it("decrypts a real message end-to-end and caches the result", async () => {
    const [alice, bob] = await Promise.all([makeUser("alice"), makeUser("bob")]);
    setReady(alice.id, alice);
    setDirectory([alice, bob]);

    const envelope = await encryptTextMessage({
      conversation: { ConversationId: "c1", MemberUserIds: [alice.id, bob.id] },
      userId: alice.id, // alice is the sender in this scenario
      text: "hello",
    });

    const dto = {
      MessageId: envelope.ClientMessageId,
      ConversationId: "c1",
      SenderUserId: alice.id,
      ClientMessageId: envelope.ClientMessageId,
      EncryptedPayload: envelope.EncryptedPayload,
      WrappedMessageKey: envelope.Keys.find((k) => k.RecipientUserId === bob.id).WrappedMessageKey,
    };

    setReady(bob.id, bob);
    const result = await withDecrypted(dto, bob.id);
    expect(result.decrypted).toEqual({ status: "ok", body: { v: 1, type: "text", text: "hello" } });

    // Cached: a second call for the same message doesn't need the directory again
    chatKeysApi.getParticipantKeys.mockClear();
    const again = await withDecrypted({ ...dto, decrypted: undefined }, bob.id);
    expect(again.decrypted.status).toBe("ok");
    expect(chatKeysApi.getParticipantKeys).not.toHaveBeenCalled();
  });

  it("returns 'error' when the sender has no key in the directory", async () => {
    const [alice, bob] = await Promise.all([makeUser("alice"), makeUser("bob")]);
    setReady(bob.id, bob);
    setDirectory([bob]); // alice (the sender) is missing

    const result = await withDecrypted(
      { MessageId: "m1", ConversationId: "c1", SenderUserId: alice.id, WrappedMessageKey: "abc" },
      bob.id,
    );
    expect(result.decrypted).toEqual({ status: "error" });
  });

  it("reuses a cached public key across multiple senders instead of re-querying every message", async () => {
    const [alice, bob, carol] = await Promise.all([makeUser("alice"), makeUser("bob"), makeUser("carol")]);
    setReady(carol.id, carol);
    setDirectory([alice, bob, carol]);

    await withDecrypted({ MessageId: "m1", ConversationId: "c1", SenderUserId: alice.id, WrappedMessageKey: "x" }, carol.id);
    await withDecrypted({ MessageId: "m2", ConversationId: "c1", SenderUserId: alice.id, WrappedMessageKey: "y" }, carol.id);

    expect(chatKeysApi.getParticipantKeys).toHaveBeenCalledTimes(1);
  });
});

describe("encryptTextMessage", () => {
  it("throws ChatLockedError when chat isn't READY", async () => {
    useChatIdentityStore.setState({ status: S.LOCKED_NEED_RECOVERY, userId: "alice" });
    await expect(
      encryptTextMessage({ conversation: { ConversationId: "c1", MemberUserIds: ["alice", "bob"] }, userId: "alice", text: "hi" }),
    ).rejects.toBeInstanceOf(ChatLockedError);
  });

  it("throws RecipientNotReadyError listing members without a chat key, and sends nothing", async () => {
    const [alice, bob] = await Promise.all([makeUser("alice"), makeUser("bob")]);
    setReady(alice.id, alice);
    setDirectory([alice]); // bob never set up a chat key

    await expect(
      encryptTextMessage({
        conversation: { ConversationId: "c1", MemberUserIds: [alice.id, bob.id] },
        userId: alice.id,
        text: "hi",
      }),
    ).rejects.toMatchObject({ userIds: [bob.id] });
  });

  it("re-queries the directory on every send (refresh), even if it was cached from a decrypt", async () => {
    const [alice, bob] = await Promise.all([makeUser("alice"), makeUser("bob")]);
    setReady(alice.id, alice);
    setDirectory([alice, bob]);

    // Warm the cache via a decrypt first
    await withDecrypted({ MessageId: "m1", ConversationId: "c1", SenderUserId: bob.id, WrappedMessageKey: "x" }, alice.id);
    chatKeysApi.getParticipantKeys.mockClear();

    await encryptTextMessage({
      conversation: { ConversationId: "c1", MemberUserIds: [alice.id, bob.id] },
      userId: alice.id,
      text: "hi",
    });

    expect(chatKeysApi.getParticipantKeys).toHaveBeenCalledTimes(1);
  });

  it("encrypts for every member including the sender, and the result decrypts back to the same text", async () => {
    const [alice, bob] = await Promise.all([makeUser("alice"), makeUser("bob")]);
    setReady(alice.id, alice);
    setDirectory([alice, bob]);

    const body = await encryptTextMessage({
      conversation: { ConversationId: "c1", MemberUserIds: [alice.id, bob.id] },
      userId: alice.id,
      text: "secret plan",
    });

    expect(body.Keys.map((k) => k.RecipientUserId).sort()).toEqual([alice.id, bob.id].sort());

    setReady(bob.id, bob);
    const dto = {
      MessageId: body.ClientMessageId,
      ConversationId: "c1",
      SenderUserId: alice.id,
      ClientMessageId: body.ClientMessageId,
      EncryptedPayload: body.EncryptedPayload,
      WrappedMessageKey: body.Keys.find((k) => k.RecipientUserId === bob.id).WrappedMessageKey,
    };
    expect((await withDecrypted(dto, bob.id)).decrypted).toEqual({
      status: "ok",
      body: { v: 1, type: "text", text: "secret plan" },
    });
  });

  it("pre-caches the sender's own plaintext so re-decrypting their own sent message needs no directory call", async () => {
    const [alice, bob] = await Promise.all([makeUser("alice"), makeUser("bob")]);
    setReady(alice.id, alice);
    setDirectory([alice, bob]);

    const body = await encryptTextMessage({
      conversation: { ConversationId: "c1", MemberUserIds: [alice.id, bob.id] },
      userId: alice.id,
      text: "my own words",
    });

    chatKeysApi.getParticipantKeys.mockClear();
    const ownCopy = {
      MessageId: body.ClientMessageId,
      ConversationId: "c1",
      SenderUserId: alice.id,
      WrappedMessageKey: body.Keys.find((k) => k.RecipientUserId === alice.id).WrappedMessageKey,
    };
    const result = await withDecrypted(ownCopy, alice.id);
    expect(result.decrypted).toEqual({ status: "ok", body: { v: 1, type: "text", text: "my own words" } });
    expect(chatKeysApi.getParticipantKeys).not.toHaveBeenCalled();
  });
});

describe("encryptTextMessage — tags (Phase 7)", () => {
  it("defaults to an empty Tags array when none are given", async () => {
    const [alice, bob] = await Promise.all([makeUser("alice"), makeUser("bob")]);
    setReady(alice.id, alice);
    setDirectory([alice, bob]);

    const body = await encryptTextMessage({
      conversation: { ConversationId: "c1", MemberUserIds: [alice.id, bob.id] },
      userId: alice.id,
      text: "hi",
    });

    expect(body.Tags).toEqual([]);
  });

  it("attaches tags as plain PascalCase metadata, unrelated to the ciphertext", async () => {
    const [alice, bob] = await Promise.all([makeUser("alice"), makeUser("bob")]);
    setReady(alice.id, alice);
    setDirectory([alice, bob]);

    const body = await encryptTextMessage({
      conversation: { ConversationId: "c1", MemberUserIds: [alice.id, bob.id] },
      userId: alice.id,
      text: "check #TCK-1042 @bob",
      tags: [
        { entityType: "Ticket", entityId: "t1", displayText: "#TCK-1042", notifyUserId: "assignee-1" },
        { entityType: "User", entityId: bob.id, displayText: "@bob" },
      ],
    });

    expect(body.Tags).toEqual([
      { EntityType: "Ticket", EntityId: "t1", DisplayText: "#TCK-1042", NotifyUserId: "assignee-1" },
      { EntityType: "User", EntityId: bob.id, DisplayText: "@bob", NotifyUserId: null },
    ]);
  });

  it("still encrypts and decrypts the same text when tags are present (tags never touch the ciphertext)", async () => {
    const [alice, bob] = await Promise.all([makeUser("alice"), makeUser("bob")]);
    setReady(alice.id, alice);
    setDirectory([alice, bob]);

    const body = await encryptTextMessage({
      conversation: { ConversationId: "c1", MemberUserIds: [alice.id, bob.id] },
      userId: alice.id,
      text: "ping @bob",
      tags: [{ entityType: "User", entityId: bob.id, displayText: "@bob" }],
    });

    setReady(bob.id, bob);
    const dto = {
      MessageId: body.ClientMessageId,
      ConversationId: "c1",
      SenderUserId: alice.id,
      ClientMessageId: body.ClientMessageId,
      EncryptedPayload: body.EncryptedPayload,
      WrappedMessageKey: body.Keys.find((k) => k.RecipientUserId === bob.id).WrappedMessageKey,
    };
    expect((await withDecrypted(dto, bob.id)).decrypted).toEqual({
      status: "ok",
      body: { v: 1, type: "text", text: "ping @bob" },
    });
  });
});

describe("cache invalidation", () => {
  it("drops cached public keys and decrypted messages when the identity status changes", async () => {
    const [alice, bob] = await Promise.all([makeUser("alice"), makeUser("bob")]);
    setReady(alice.id, alice);
    setDirectory([alice, bob]);

    await withDecrypted({ MessageId: "m1", ConversationId: "c1", SenderUserId: bob.id, WrappedMessageKey: "x" }, alice.id);
    chatKeysApi.getParticipantKeys.mockClear();

    // Simulate a lock/unlock cycle (e.g. logout then a different user logs in)
    useChatIdentityStore.setState({ status: S.LOCKED_NEED_PASSWORD, userId: alice.id });
    useChatIdentityStore.setState({ status: S.READY, userId: alice.id });

    await withDecrypted({ MessageId: "m1", ConversationId: "c1", SenderUserId: bob.id, WrappedMessageKey: "x" }, alice.id);
    expect(chatKeysApi.getParticipantKeys).toHaveBeenCalledTimes(1);
  });
});
