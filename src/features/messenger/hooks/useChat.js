import { useEffect, useMemo } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { subscribeChatMention, subscribeChatMessages, subscribeChatReaction, subscribeChatRead } from "../../../core/realtime/chatChannel";
import { readUserFromSession } from "../../../core/auth/useCurrentUser";
import { useMasterData } from "../../../core/master/masterCall/useMasterData";
import { chatApi } from "../api/chat.api";
import { CHAT_IDENTITY_STATUS, useChatIdentityStore } from "../e2ee/chatIdentityStore";
import { encryptMediaMessage, encryptTextMessage, sameId, withDecrypted } from "../e2ee/chatCryptoSession";
import { encryptFileBytes, generateFileKey, MAX_MEDIA_BYTES } from "../e2ee/mediaCrypto";
import { toBase64 } from "../e2ee/userKeyManager";
import { useChatUiStore } from "../state/useChatUiStore";
import { isAppInForeground, showBrowserNotification } from "../../../core/notifications/browserNotification";

export { sameId };
export { MAX_MESSAGE_LENGTH } from "../e2ee/messageCrypto";
export { MAX_MEDIA_BYTES } from "../e2ee/mediaCrypto";

export const PAGE_SIZE = 50;
export const COMMON_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🎉"];

const lower = (id) => String(id ?? "").toLowerCase();

export const chatQueryKeys = {
  all: ["chat"],
  conversations: ["chat", "conversations"],
  messages: (conversationId) => ["chat", "messages", lower(conversationId)],
};

export function useChatUserId() {
  return useMemo(() => readUserFromSession()?.userId ?? null, []);
}

// ─── Display helpers ─────────────────────────────────────────────────────────

export function useChatPeople() {
  const userId = useChatUserId();
  const { data: master } = useMasterData();

  return useMemo(() => {
    const all = master?.EmployeeList ?? [];
    const nameOf = (id) => all.find((e) => sameId(e.UserID, id))?.UserName ?? "Unknown user";
    const photoOf = (id) => all.find((e) => sameId(e.UserID, id))?.PreviewUrl || null;
    const people = all
      .filter((e) => e.Status === "Active" && !sameId(e.UserID, userId))
      .sort((a, b) => a.UserName.localeCompare(b.UserName));
    return { people, nameOf, photoOf };
  }, [master, userId]);
}

export function conversationTitle(conversation, userId, nameOf) {
  if (!conversation) return "";
  if (conversation.Title) return conversation.Title;
  const other = conversation.MemberUserIds?.find((id) => !sameId(id, userId));
  return other ? nameOf(other) : "Just you";
}

export const otherMemberId = (conversation, userId) =>
  conversation?.MemberUserIds?.find((id) => !sameId(id, userId)) ?? userId;

export const isGroupConversation = (conversation) => conversation?.Type === 2;

/** True if `userId` has the Admin role in this group (MemberRoles is empty/absent for Direct chats). */
export function isGroupAdmin(conversation, userId) {
  if (!isGroupConversation(conversation)) return false;
  const roles = conversation?.MemberRoles ?? {};
  const key = Object.keys(roles).find((id) => sameId(id, userId));
  return key ? roles[key] === "Admin" : false;
}

/** Stable avatar seed: the other member for a direct chat, the conversation itself for a group. */
export const conversationAvatarSeed = (conversation, userId) =>
  isGroupConversation(conversation) ? conversation?.ConversationId : otherMemberId(conversation, userId);

/** Photo to show: the group's own icon, or the other member's employee photo for a direct chat. */
export const conversationAvatarPhoto = (conversation, userId, photoOf) =>
  isGroupConversation(conversation) ? conversation?.GroupIconUrl ?? null : photoOf(otherMemberId(conversation, userId));

/** Groups a message's raw {UserId, Emoji} reactions into chips: [{ emoji, count, mine }]. */
export function groupReactions(message, userId) {
  const reactions = message?.Reactions;
  if (!reactions?.length) return [];
  const byEmoji = new Map();
  for (const r of reactions) {
    const chip = byEmoji.get(r.Emoji) ?? { emoji: r.Emoji, count: 0, mine: false };
    chip.count += 1;
    if (sameId(r.UserId, userId)) chip.mine = true;
    byEmoji.set(r.Emoji, chip);
  }
  return [...byEmoji.values()];
}

export function messagePreview(message) {
  switch (message?.decrypted?.status) {
    case "ok": {
      const body = message.decrypted.body;
      if (body.type === "voice") return "🎤 Voice message";
      if (body.type === "media") return `📎 ${body.fileName}`;
      return (body.text ?? "").replace(/\s+/g, " ").trim();
    }
    case "locked":
      return "🔒 Encrypted message";
    case undefined:
      return "";
    default:
      return "Message can't be decrypted";
  }
}

// ─── Cache helpers ───────────────────────────────────────────────────────────

const activityTime = (c) => new Date(c.LastMessageAt ?? c.CreatedAt).getTime();

/** Applies `updater` to one conversation in the list cache. Returns false if it isn't cached. */
function updateConversation(queryClient, conversationId, updater) {
  let found = false;
  queryClient.setQueryData(chatQueryKeys.conversations, (list) => {
    if (!list) return list;
    const next = list.map((c) => {
      if (!sameId(c.ConversationId, conversationId)) return c;
      found = true;
      return updater(c);
    });
    return found ? next.sort((a, b) => activityTime(b) - activityTime(a)) : list;
  });
  return found;
}

/** Inserts a message into an open timeline, or replaces the copy with the same id (pending -> sent). */
function upsertMessage(queryClient, message) {
  queryClient.setQueryData(chatQueryKeys.messages(message.ConversationId), (data) => {
    if (!data) return data;

    let replaced = false;
    const pages = data.pages.map((page) =>
      page.map((m) => {
        if (!sameId(m.MessageId, message.MessageId)) return m;
        replaced = true;
        return {
          ...m,
          ...message,
          decrypted: message.decrypted?.status === "ok" ? message.decrypted : m.decrypted,
        };
      }),
    );
    if (replaced) return { ...data, pages };

    const [newest = [], ...older] = data.pages;
    return { ...data, pages: [[...newest, message], ...older] };
  });
}

const readsInFlight = new Set();

/**
 * Clears the unread count locally right away and moves the server read marker.
 * @param {string} [readUpTo]  defaults to the conversation's newest message time
 * @param {boolean} [force]    send even if the cached count is already 0 (a message just arrived on screen)
 */
export function markConversationRead(queryClient, conversationId, { readUpTo, force = false } = {}) {
  const conversation = queryClient
    .getQueryData(chatQueryKeys.conversations)
    ?.find((c) => sameId(c.ConversationId, conversationId));
  if (!force && !conversation?.UnreadCount) return;

  const upTo = readUpTo ?? conversation?.LastMessageAt ?? null;
  const key = `${lower(conversationId)}|${upTo}`;
  if (readsInFlight.has(key)) return;
  readsInFlight.add(key);

  updateConversation(queryClient, conversationId, (c) => ({ ...c, UnreadCount: 0, LastReadAt: upTo ?? c.LastReadAt }));
  useChatUiStore.getState().dismissConversationNotifications(conversationId);

  chatApi
    .markRead(conversationId, upTo)
    .catch(() => queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations }))
    .finally(() => readsInFlight.delete(key));
}

// ─── Queries & mutations ─────────────────────────────────────────────────────

export function useConversations() {
  const userId = useChatUserId();
  return useQuery({
    queryKey: chatQueryKeys.conversations,
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      const list = (await chatApi.listConversations()) ?? [];
      return Promise.all(
        list.map(async (c) =>
          c.LastMessage ? { ...c, LastMessage: await withDecrypted(c.LastMessage, userId) } : c,
        ),
      );
    },
  });
}

export function useUnreadTotal() {
  const { data } = useConversations();
  return useMemo(() => (data ?? []).reduce((sum, c) => sum + (c.UnreadCount ?? 0), 0), [data]);
}

export function useOpenDirect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (otherUserId) => chatApi.openDirect(otherUserId),
    onSuccess: (conversation) => {
      const exists = updateConversation(queryClient, conversation.ConversationId, (c) => c);
      if (!exists) queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations });
    },
  });
}

export function useOpenGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ title, memberUserIds }) => chatApi.openGroup({ title, memberUserIds }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations }),
  });
}

export function useUpdateGroupMembers(conversationId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ addUserIds, removeUserIds }) =>
      chatApi.updateGroupMembers(conversationId, { addUserIds, removeUserIds }),
    onSuccess: (conversation) => {
      const exists = updateConversation(queryClient, conversation.ConversationId, (c) => ({ ...c, ...conversation }));
      if (!exists) queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations });
    },
  });
}

export function useUpdateGroupIcon(conversationId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file) => chatApi.uploadGroupIcon(conversationId, file),
    onSuccess: (conversation) => {
      const exists = updateConversation(queryClient, conversation.ConversationId, (c) => ({ ...c, ...conversation }));
      if (!exists) queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations });
    },
  });
}

/** Infinite timeline. Pages are newest-first; each page is in chronological order. */
export function useMessages(conversationId) {
  const userId = useChatUserId();
  const ready = useChatIdentityStore((s) => s.status === CHAT_IDENTITY_STATUS.READY);

  return useInfiniteQuery({
    queryKey: chatQueryKeys.messages(conversationId),
    enabled: !!conversationId && !!userId && ready,
    // Kept current by realtime events (and a full refetch after a SignalR reconnect)
    staleTime: 5 * 60_000,
    initialPageParam: null,
    queryFn: async ({ pageParam }) => {
      const page = (await chatApi.getMessages(conversationId, { before: pageParam, take: PAGE_SIZE })) ?? [];
      return Promise.all(page.map((m) => withDecrypted(m, userId)));
    },
    getNextPageParam: (lastPage) => (lastPage.length === PAGE_SIZE ? lastPage[0].CreatedAt : undefined),
  });
}

/**
 * mutate({ text, replyTo, tags }) encrypts and sends (optionally as a threaded reply, with
 * @user/#ticket/#meeting/#project/#repo tag metadata); mutate({ retry: failedMessage })
 * re-sends the same ciphertext (the server is idempotent on ClientMessageId).
 */
export function useSendMessage(conversation) {
  const queryClient = useQueryClient();
  const userId = useChatUserId();

  return useMutation({
    mutationFn: async ({ text, replyTo, tags, retry }) => {
      const body =
        retry?.envelope ??
        (await encryptTextMessage({
          conversation,
          userId,
          text,
          replyToMessageId: replyTo?.MessageId ?? null,
          tags,
        }));
      const plaintext = retry?.decrypted ?? { status: "ok", body: { v: 1, type: "text", text } };

      const local = {
        MessageId: body.ClientMessageId,
        ConversationId: conversation.ConversationId,
        SenderUserId: userId,
        ClientMessageId: body.ClientMessageId,
        ReplyToMessageId: body.ReplyToMessageId ?? retry?.ReplyToMessageId ?? null,
        Tags: body.Tags ?? retry?.Tags ?? [],
        CreatedAt: retry?.CreatedAt ?? new Date().toISOString(),
        decrypted: plaintext,
        envelope: body,
        pending: true,
        failed: false,
      };
      upsertMessage(queryClient, local);

      let saved;
      try {
        saved = await chatApi.sendMessage(conversation.ConversationId, body);
      } catch (err) {
        upsertMessage(queryClient, { ...local, pending: false, failed: true });
        throw err;
      }

      const confirmed = { ...(await withDecrypted(saved, userId)), pending: false, failed: false, envelope: undefined };
      upsertMessage(queryClient, confirmed);

      const listed = updateConversation(queryClient, conversation.ConversationId, (c) => ({
        ...c,
        LastMessage: confirmed,
        LastMessageAt: confirmed.CreatedAt,
      }));
      if (!listed) queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations });
      return confirmed;
    },
  });
}

/**
 * mutate({ file, kind, durationMs, replyTo, tags }) encrypts a file/voice-note client-side
 * (its own random AES key, wrapped with the message's content key) and uploads it.
 * `kind`: "media" (default, image/file attachment) or "voice" (recorded voice note).
 */
export function useSendMedia(conversation) {
  const queryClient = useQueryClient();
  const userId = useChatUserId();

  return useMutation({
    mutationFn: async ({ file, kind = "media", durationMs, replyTo, tags }) => {
      if (!file) throw new Error("No file selected.");
      if (file.size > MAX_MEDIA_BYTES) {
        throw new Error(`Files must be ${Math.floor(MAX_MEDIA_BYTES / (1024 * 1024))} MB or smaller.`);
      }

      const fileKey = await generateFileKey();
      const arrayBuffer = await file.arrayBuffer();
      const { iv, ciphertext } = await encryptFileBytes(fileKey, arrayBuffer);

      const envelope = {
        type: kind,
        fileName: file.name || (kind === "voice" ? "voice-note.webm" : "file"),
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        ...(durationMs ? { durationMs } : {}),
      };

      const body = await encryptMediaMessage({
        conversation,
        userId,
        envelope,
        fileKey,
        replyToMessageId: replyTo?.MessageId ?? null,
        tags,
      });

      const local = {
        MessageId: body.ClientMessageId,
        ConversationId: conversation.ConversationId,
        SenderUserId: userId,
        ClientMessageId: body.ClientMessageId,
        ReplyToMessageId: body.ReplyToMessageId ?? null,
        Tags: body.Tags ?? [],
        Media: {
          MediaId: body.ClientMessageId,
          OriginalFileName: envelope.fileName,
          MimeType: envelope.mimeType,
          FileSize: envelope.size,
        },
        CreatedAt: new Date().toISOString(),
        decrypted: { status: "ok", body: { v: 1, ...envelope } },
        pending: true,
        failed: false,
      };
      upsertMessage(queryClient, local);

      let saved;
      try {
        saved = await chatApi.sendMedia(
          conversation.ConversationId,
          { ...body, Iv: toBase64(iv), OriginalFileName: envelope.fileName, MimeType: envelope.mimeType },
          new Blob([ciphertext]),
        );
      } catch (err) {
        upsertMessage(queryClient, { ...local, pending: false, failed: true });
        throw err;
      }

      const confirmed = { ...(await withDecrypted(saved, userId)), pending: false, failed: false };
      upsertMessage(queryClient, confirmed);

      const listed = updateConversation(queryClient, conversation.ConversationId, (c) => ({
        ...c,
        LastMessage: confirmed,
        LastMessageAt: confirmed.CreatedAt,
      }));
      if (!listed) queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations });
      return confirmed;
    },
  });
}

/** Applies one {MessageId, ConversationId, UserId, Emoji, Added} delta to the cached timeline. */
function applyReactionDelta(queryClient, evt) {
  queryClient.setQueryData(chatQueryKeys.messages(evt.ConversationId), (data) => {
    if (!data) return data;
    let changed = false;
    const pages = data.pages.map((page) =>
      page.map((m) => {
        if (!sameId(m.MessageId, evt.MessageId)) return m;
        const already = (m.Reactions ?? []).some((r) => sameId(r.UserId, evt.UserId) && r.Emoji === evt.Emoji);
        if (evt.Added === already) return m;
        changed = true;
        const reactions = evt.Added
          ? [...(m.Reactions ?? []), { UserId: evt.UserId, Emoji: evt.Emoji }]
          : (m.Reactions ?? []).filter((r) => !(sameId(r.UserId, evt.UserId) && r.Emoji === evt.Emoji));
        return { ...m, Reactions: reactions };
      }),
    );
    return changed ? { ...data, pages } : data;
  });
}

/** mutate({ messageId, emoji }) toggles my reaction; applied optimistically, confirmed by the server's own broadcast. */
export function useToggleReaction(conversationId) {
  const queryClient = useQueryClient();
  const userId = useChatUserId();

  return useMutation({
    mutationFn: ({ messageId, emoji }) => {
      const message = queryClient
        .getQueryData(chatQueryKeys.messages(conversationId))
        ?.pages?.flat()
        .find((m) => sameId(m.MessageId, messageId));
      const already = (message?.Reactions ?? []).some((r) => sameId(r.UserId, userId) && r.Emoji === emoji);

      applyReactionDelta(queryClient, {
        MessageId: messageId,
        ConversationId: conversationId,
        UserId: userId,
        Emoji: emoji,
        Added: !already,
      });

      return chatApi.toggleReaction(messageId, emoji);
    },
    onError: () => queryClient.invalidateQueries({ queryKey: chatQueryKeys.messages(conversationId) }),
  });
}

// ─── Realtime ────────────────────────────────────────────────────────────────

// Same rules as the other app notifications: only when the tab is hidden or another
// window has focus. Tagged per message, so every message pops up (a per-conversation
// tag made Chrome silently replace the previous one) and two open tabs still show it once.
function showDesktopNotification({ id, title, body, conversationId }) {
  if (isAppInForeground()) return;
  showBrowserNotification({
    id: `chat-${lower(id)}`,
    title,
    body,
    onClick: () => useChatUiStore.getState().openWindow(conversationId),
  });
}

/**
 * Mounted once for the whole app (by the message bar). Applies pushed messages and
 * read markers to the caches, marks on-screen conversations read, and notifies otherwise.
 */
export function useChatRealtime({ nameOf }) {
  const queryClient = useQueryClient();
  const userId = useChatUserId();

  useEffect(() => {
    if (!userId) return;

    const offMessage = subscribeChatMessages(async (raw) => {
      const message = await withDecrypted(raw, userId);
      const conversationId = message.ConversationId;
      const mine = sameId(message.SenderUserId, userId);
      const ui = useChatUiStore.getState();
      const viewing = ui.isViewing(conversationId);

      upsertMessage(queryClient, message);

      let duplicate = false;
      const listed = updateConversation(queryClient, conversationId, (c) => {
        if (sameId(c.LastMessage?.MessageId, message.MessageId)) {
          duplicate = true;
          return c;
        }
        return {
          ...c,
          LastMessage: message,
          LastMessageAt: message.CreatedAt,
          UnreadCount: mine || viewing ? c.UnreadCount : (c.UnreadCount ?? 0) + 1,
        };
      });
      if (!listed) queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations });
      if (mine || duplicate) return;

      if (viewing) {
        markConversationRead(queryClient, conversationId, { readUpTo: message.CreatedAt, force: true });
        return;
      }

      const sender = nameOf(message.SenderUserId);
      const text = messagePreview(message);
      const conversation = queryClient
        .getQueryData(chatQueryKeys.conversations)
        ?.find((c) => sameId(c.ConversationId, conversationId));
      const notifTitle = isGroupConversation(conversation)
        ? `${conversationTitle(conversation, userId, nameOf)} : ${sender}`
        : sender;
      // Chat is locked in this browser, so the text can't be shown — say who it's from instead
      const desktopBody =
        message.decrypted?.status === "locked" ? `🔒 Encrypted message from ${sender}` : text;

      ui.notify({ messageId: message.MessageId, conversationId, senderUserId: message.SenderUserId, text, title: notifTitle });
      showDesktopNotification({ id: message.MessageId, title: notifTitle, body: desktopBody, conversationId });
    });

    const offReaction = subscribeChatReaction((evt) => applyReactionDelta(queryClient, evt));

    const offMention = subscribeChatMention((evt) => {
      const ui = useChatUiStore.getState();
      if (ui.isViewing(evt.ConversationId)) return;
      const sender = nameOf(evt.TaggedByUserId);
      const text = `${sender} mentioned ${evt.DisplayText}`;
 
      ui.notify({ messageId: evt.MessageId, conversationId: evt.ConversationId, senderUserId: evt.TaggedByUserId, text });
     
      // showDesktopNotification({ title: "You were mentioned", body: text, conversationId: evt.ConversationId });
      const mentionCachedConvs=queryClient.getQueryData(chatQueryKeys.conversations)
      const mentionConv=mentionCachedConvs
      ?.find(c=>sameId(c.ConversationId,evt.ConversationId))
      const mentionIsGroup=isGroupConversation(mentionConv)
      const mentionTitle=mentionIsGroup
      ? `${conversationTitle(mentionConv,userId,nameOf)}: You were mentioned`
      : "You were mentioned"
      showDesktopNotification({ id: `mention-${evt.MessageId}`, title: mentionTitle, body: text, conversationId: evt.ConversationId });

    });

    const offRead = subscribeChatRead((read) => {
      useChatUiStore.getState().dismissConversationNotifications(read.ConversationId);
      let caughtUp = true;
      const listed = updateConversation(queryClient, read.ConversationId, (c) => {
        caughtUp = !c.LastMessageAt || (!!read.LastReadAt && new Date(read.LastReadAt) >= new Date(c.LastMessageAt));
        return caughtUp ? { ...c, UnreadCount: 0, LastReadAt: read.LastReadAt } : c;
      });
      if (!listed || !caughtUp) queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations });
    });

    // Unlocking (or re-initializing) chat: decrypt everything again with the key now available
    const offIdentity = useChatIdentityStore.subscribe((state, previous) => {
      if (state.status === CHAT_IDENTITY_STATUS.READY && previous.status !== CHAT_IDENTITY_STATUS.READY) {
        queryClient.invalidateQueries({ queryKey: chatQueryKeys.all });
      }
    });

    return () => {
      offMessage();
      offReaction();
      offMention();
      offRead();
      offIdentity();
    };
  }, [queryClient, userId, nameOf]);
}
