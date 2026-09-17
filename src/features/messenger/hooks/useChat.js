import { useEffect } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { subscribeChatMessages } from "../../../core/realtime/chatChannel";
import { chatApi } from "../api/chat.api";
import { chatKeysApi } from "../e2ee/chatKeys.api";
import { indexedDbKeyStore } from "../e2ee/keyStore";
import { withUserKeyLock } from "../e2ee/keyManager";
import { decryptMessage, encryptMessage, verifiedDevices } from "../e2ee/messageCrypto";

export const PAGE_SIZE = 50;
export const MAX_MESSAGE_LENGTH = 4000;

export const chatQueryKeys = {
  conversations: ["chat", "conversations"],
  messages: (conversationId) => ["chat", "messages", conversationId],
};

export const sameId = (a, b) => String(a ?? "").toLowerCase() === String(b ?? "").toLowerCase();

/** Reads this device's keys, waiting for any in-progress key creation/rotation to finish. */
async function loadDeviceRecord(userId) {
  const record = await withUserKeyLock(userId, () => indexedDbKeyStore.get(userId));
  if (!record?.identity || record.currentPreKeyId == null) {
    throw new Error("Secure chat keys for this browser aren't ready yet.");
  }
  return record;
}

// Decrypted results kept in memory only; plaintext is never written to storage
const decrypted = new Map();

async function decryptCached(message, record) {
  const cached = decrypted.get(message.MessageId);
  if (cached) return { ...message, decrypted: cached };

  const result = await decryptMessage(message, record);
  if (result.status === "ok") decrypted.set(message.MessageId, result);
  return { ...message, decrypted: result };
}

function appendMessage(queryClient, message) {
  queryClient.setQueryData(chatQueryKeys.messages(message.ConversationId), (data) => {
    if (!data) return data;
    if (data.pages.some((page) => page.some((m) => sameId(m.MessageId, message.MessageId)))) return data;
    const [newest = [], ...older] = data.pages;
    return { ...data, pages: [[...newest, message], ...older] };
  });
}

export function useConversations() {
  return useQuery({
    queryKey: chatQueryKeys.conversations,
    queryFn: async () => (await chatApi.listConversations()) ?? [],
  });
}

export function useOpenDirect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId) => chatApi.openDirect(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations }),
  });
}

/** Pages are newest-first; each page is in chronological order. */
export function useMessages(conversationId, userId) {
  return useInfiniteQuery({
    queryKey: chatQueryKeys.messages(conversationId),
    enabled: !!conversationId && !!userId,
    initialPageParam: null,
    queryFn: async ({ pageParam }) => {
      const record = await loadDeviceRecord(userId);
      const messages =
        (await chatApi.getMessages(conversationId, {
          deviceId: record.deviceId,
          before: pageParam,
          take: PAGE_SIZE,
        })) ?? [];
      return Promise.all(messages.map((m) => decryptCached(m, record)));
    },
    getNextPageParam: (lastPage) => (lastPage.length === PAGE_SIZE ? lastPage[0].CreatedAt : undefined),
    retry: 3,
    retryDelay: 2000,
  });
}

export function useSendMessage(conversation, userId, nameOf) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (text) => {
      const record = await loadDeviceRecord(userId);
      const others = conversation.MemberUserIds.filter((id) => !sameId(id, userId));

      const devices = await verifiedDevices(await chatKeysApi.getParticipantKeys([...others, userId]));

      // Always include this browser, even if the directory listing lags behind a rotation
      if (!devices.some((d) => sameId(d.deviceId, record.deviceId))) {
        const current = record.preKeys.find((k) => k.keyId === record.currentPreKeyId);
        devices.push({
          userId,
          deviceId: record.deviceId,
          preKeyId: current.keyId,
          preKeyPublicKey: current.publicKey,
        });
      }

      const unreachable = others.filter((id) => !devices.some((d) => sameId(d.userId, id)));
      if (unreachable.length) {
        throw new Error(
          `${unreachable.map(nameOf).join(", ")} can't receive secure messages yet — they need to open the app first.`,
        );
      }

      const payload = { type: "text", text };
      const body = await encryptMessage({
        payload,
        conversationId: conversation.ConversationId,
        senderUserId: userId,
        senderDeviceId: record.deviceId,
        devices,
      });

      const saved = await chatApi.sendMessage(conversation.ConversationId, body);
      const result = { status: "ok", body: { v: 1, ...payload } };
      decrypted.set(saved.MessageId, result);
      return { ...saved, decrypted: result };
    },
    onSuccess: (message) => {
      appendMessage(queryClient, message);
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations });
    },
  });
}

/** Applies messages pushed over SignalR to the open conversation and the conversation list. */
export function useChatRealtime(userId) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    return subscribeChatMessages(async (message) => {
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations });
      if (!queryClient.getQueryData(chatQueryKeys.messages(message.ConversationId))) return;

      try {
        const record = await loadDeviceRecord(userId);
        appendMessage(queryClient, await decryptCached(message, record));
      } catch (err) {
        console.error("[Chat] could not apply realtime message", err);
        queryClient.invalidateQueries({ queryKey: chatQueryKeys.messages(message.ConversationId) });
      }
    });
  }, [queryClient, userId]);
}
