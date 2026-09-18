import { executeApi } from "../../../core/api/executor";

// Chat runs in the background on every screen (message bar), so no global
// loader and no global error toast — the chat UI shows its own errors inline
const background = { _silent: true, _noErrorToast: true };

export const chatApi = {
  /** My conversations, most recent first, with UnreadCount and LastMessage. */
  listConversations: () =>
    executeApi({ url: "/Chats", method: "GET", config: background }),

  /** Get-or-create the 1:1 conversation with a user. */
  openDirect: (userId) =>
    executeApi({ url: "/Chats/direct", method: "POST", payload: { UserId: userId }, config: background }),

  /** Creates a group conversation; the caller becomes its Admin. */
  openGroup: ({ title, memberUserIds }) =>
    executeApi({
      url: "/Chats/group",
      method: "POST",
      payload: { Title: title, MemberUserIds: memberUserIds },
      config: background,
    }),

  /** Admin only. Returns the conversation with its updated member list. */
  updateGroupMembers: (conversationId, { addUserIds = [], removeUserIds = [] }) =>
    executeApi({
      url: `/Chats/${conversationId}/members`,
      method: "POST",
      payload: { AddUserIds: addUserIds, RemoveUserIds: removeUserIds },
      config: background,
    }),

  /** Admin only. Uploads a new group photo; returns the conversation with its updated GroupIconUrl. */
  uploadGroupIcon: (conversationId, file) => {
    const form = new FormData();
    form.append("Icon", file, file.name || "icon.jpg");
    return executeApi({
      url: `/Chats/${conversationId}/icon`,
      method: "POST",
      payload: form,
      config: { ...background, headers: { "Content-Type": "multipart/form-data" } },
    });
  },

  /** Oldest-first page of messages created before `before` (a CreatedAt from the server). */
  getMessages: (conversationId, { before, take }) =>
    executeApi({
      url: `/Chats/${conversationId}/messages`,
      method: "GET",
      params: { before: before ?? undefined, take },
      config: background,
    }),

  /** Body: { ClientMessageId, EncryptedPayload, Keys: [{ RecipientUserId, WrappedMessageKey }], ReplyToMessageId } */
  sendMessage: (conversationId, body) =>
    executeApi({ url: `/Chats/${conversationId}/messages`, method: "POST", payload: body, config: background }),

  /**
   * Multipart send of an encrypted media/voice message — same envelope fields as sendMessage,
   * plus the already-encrypted file. `body`: { ClientMessageId, EncryptedPayload, Keys, ReplyToMessageId,
   * Tags, EncryptedFileKey, Iv, OriginalFileName, MimeType }, `file`: a Blob of ciphertext bytes.
   */
  sendMedia: (conversationId, body, file) => {
    const form = new FormData();
    form.append("ClientMessageId", body.ClientMessageId);
    form.append("EncryptedPayload", body.EncryptedPayload);
    body.Keys.forEach((k, i) => {
      form.append(`Keys[${i}].RecipientUserId`, k.RecipientUserId);
      form.append(`Keys[${i}].WrappedMessageKey`, k.WrappedMessageKey);
    });
    if (body.ReplyToMessageId) form.append("ReplyToMessageId", body.ReplyToMessageId);
    (body.Tags ?? []).forEach((t, i) => {
      form.append(`Tags[${i}].EntityType`, t.EntityType);
      form.append(`Tags[${i}].EntityId`, t.EntityId);
      form.append(`Tags[${i}].DisplayText`, t.DisplayText);
      if (t.NotifyUserId) form.append(`Tags[${i}].NotifyUserId`, t.NotifyUserId);
    });
    form.append("EncryptedFileKey", body.EncryptedFileKey);
    form.append("Iv", body.Iv);
    form.append("OriginalFileName", body.OriginalFileName);
    form.append("MimeType", body.MimeType);
    form.append("File", file, "file.bin"); // filename is arbitrary — the bytes are opaque ciphertext

    return executeApi({
      url: `/Chats/${conversationId}/media`,
      method: "POST",
      payload: form,
      config: { ...background, headers: { "Content-Type": "multipart/form-data" } },
    });
  },

  /** Base64 of one attachment's encrypted bytes; decrypt client-side with the message's content key. */
  getMedia: (mediaId) =>
    executeApi({ url: `/Chats/media/${mediaId}`, method: "GET", config: background }),

  /** Moves my read marker up to `readUpTo` (a CreatedAt from the server). */
  markRead: (conversationId, readUpTo) =>
    executeApi({
      url: `/Chats/${conversationId}/read`,
      method: "POST",
      payload: { ReadUpTo: readUpTo ?? null },
      config: background,
    }),

  /** Toggles my reaction on a message: adds it if missing, removes it if already set. */
  toggleReaction: (messageId, emoji) =>
    executeApi({
      url: `/Chats/messages/${messageId}/reactions`,
      method: "POST",
      payload: { Emoji: emoji },
      config: background,
    }),
};
