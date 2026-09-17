import { describe, expect, it } from "vitest";
import { fingerprint, generateIdentityKey, generateSignedPreKey } from "./keyManager";
import { decryptMessage, encryptMessage, verifiedDevices } from "./messageCrypto";

const CONVERSATION = "11111111-1111-4111-8111-111111111111";
const ALICE = "aaaaaaaa-0000-4000-8000-000000000001";
const BOB = "bbbbbbbb-0000-4000-8000-000000000002";

async function makeDevice(userId, preKeyId = 1) {
  const identity = await generateIdentityKey(0);
  const preKey = await generateSignedPreKey(identity.privateKey, preKeyId, 0);
  return {
    userId,
    record: { userId, deviceId: crypto.randomUUID(), identity, preKeys: [preKey], currentPreKeyId: preKeyId },
  };
}

/** Shape returned by GET /ChatKeys/participants */
async function participantsFor(...devices) {
  const byUser = new Map();
  for (const { userId, record } of devices) {
    const preKey = record.preKeys.find((k) => k.keyId === record.currentPreKeyId);
    const list = byUser.get(userId) ?? [];
    list.push({
      DeviceId: record.deviceId,
      IdentityPublicKey: record.identity.publicKey,
      IdentityFingerprint: await fingerprint(record.identity.publicKey),
      PreKeyId: preKey.keyId,
      PreKeyPublicKey: preKey.publicKey,
      PreKeySignature: preKey.signature,
    });
    byUser.set(userId, list);
  }
  return [...byUser].map(([UserId, Devices]) => ({ UserId, Devices }));
}

/** What the server stores and returns: the envelope plus metadata, keys filtered per device */
function asServerMessage(body, senderUserId, forDeviceId) {
  return {
    MessageId: crypto.randomUUID(),
    ConversationId: CONVERSATION,
    SenderUserId: senderUserId,
    SenderDeviceId: body.SenderDeviceId,
    ClientMessageId: body.ClientMessageId,
    Ciphertext: body.Ciphertext,
    Iv: body.Iv,
    EphemeralPublicKey: body.EphemeralPublicKey,
    Keys: body.Keys.filter((k) => k.RecipientDeviceId === forDeviceId),
  };
}

async function send(from, to, text = "hello bob") {
  const devices = await verifiedDevices(await participantsFor(...to));
  return encryptMessage({
    payload: { type: "text", text },
    conversationId: CONVERSATION,
    senderUserId: from.userId,
    senderDeviceId: from.record.deviceId,
    devices,
  });
}

describe("messageCrypto", () => {
  it("round-trips a message to every recipient device, including the sender's own", async () => {
    const alice = await makeDevice(ALICE);
    const bobLaptop = await makeDevice(BOB);
    const bobPhone = await makeDevice(BOB);

    const body = await send(alice, [bobLaptop, bobPhone, alice]);

    expect(body.Keys).toHaveLength(3);
    expect(body.Ciphertext).not.toContain("hello");

    for (const device of [bobLaptop, bobPhone, alice]) {
      const result = await decryptMessage(asServerMessage(body, ALICE, device.record.deviceId), device.record);
      expect(result).toEqual({ status: "ok", body: { v: 1, type: "text", text: "hello bob" } });
    }
  });

  it("reports no-key on a device the message wasn't encrypted for", async () => {
    const alice = await makeDevice(ALICE);
    const bob = await makeDevice(BOB);
    const bobNewBrowser = await makeDevice(BOB);

    const body = await send(alice, [bob, alice]);
    const result = await decryptMessage(
      asServerMessage(body, ALICE, bobNewBrowser.record.deviceId),
      bobNewBrowser.record,
    );

    expect(result).toEqual({ status: "no-key" });
  });

  it("still decrypts with a retired pre-key after the device rotated", async () => {
    const alice = await makeDevice(ALICE);
    const bob = await makeDevice(BOB);
    const body = await send(alice, [bob, alice]);

    const rotated = await generateSignedPreKey(bob.record.identity.privateKey, 2, 0);
    const bobLater = { ...bob.record, preKeys: [...bob.record.preKeys, rotated], currentPreKeyId: 2 };

    const result = await decryptMessage(asServerMessage(body, ALICE, bob.record.deviceId), bobLater);
    expect(result.status).toBe("ok");
  });

  it("fails if the server moves the ciphertext to another conversation or sender", async () => {
    const alice = await makeDevice(ALICE);
    const bob = await makeDevice(BOB);
    const body = await send(alice, [bob, alice]);
    const message = asServerMessage(body, ALICE, bob.record.deviceId);

    const moved = { ...message, ConversationId: "22222222-2222-4222-8222-222222222222" };
    const spoofed = { ...message, SenderUserId: BOB };

    expect(await decryptMessage(moved, bob.record)).toEqual({ status: "error" });
    expect(await decryptMessage(spoofed, bob.record)).toEqual({ status: "error" });
  });

  it("fails if the wrapped key was swapped onto a different device", async () => {
    const alice = await makeDevice(ALICE);
    const bob = await makeDevice(BOB);
    const body = await send(alice, [bob, alice]);

    // Alice's own envelope relabelled as Bob's
    const message = asServerMessage(body, ALICE, alice.record.deviceId);
    message.Keys = message.Keys.map((k) => ({ ...k, RecipientDeviceId: bob.record.deviceId }));

    expect(await decryptMessage(message, bob.record)).toEqual({ status: "error" });
  });

  it("drops devices whose pre-key isn't signed by their identity key", async () => {
    const bob = await makeDevice(BOB);
    const attacker = await makeDevice(BOB);
    const [participant] = await participantsFor(bob);
    const [attackerParticipant] = await participantsFor(attacker);

    // Server swaps in its own pre-key under Bob's identity
    const forged = {
      ...participant.Devices[0],
      DeviceId: crypto.randomUUID(),
      PreKeyPublicKey: attackerParticipant.Devices[0].PreKeyPublicKey,
    };
    // Or claims a fingerprint that doesn't match the key
    const wrongFingerprint = { ...participant.Devices[0], DeviceId: crypto.randomUUID(), IdentityFingerprint: "00" };

    const devices = await verifiedDevices([
      { UserId: BOB, Devices: [participant.Devices[0], forged, wrongFingerprint] },
    ]);

    expect(devices.map((d) => d.deviceId)).toEqual([bob.record.deviceId]);
  });
});
