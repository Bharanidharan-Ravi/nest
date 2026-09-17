import { executeApi } from "../../../core/api/executor";

const silent = { _silent: true };

export const chatApi = {
  listConversations: () =>
    executeApi({ url: "/Chats", method: "GET", config: silent }),

  openDirect: (userId) =>
    executeApi({ url: "/Chats/direct", method: "POST", payload: { UserId: userId }, config: silent }),

  getMessages: (conversationId, { deviceId, before, take }) =>
    executeApi({
      url: `/Chats/${conversationId}/messages`,
      method: "GET",
      params: { deviceId, before: before ?? undefined, take },
      config: silent,
    }),

  sendMessage: (conversationId, body) =>
    executeApi({ url: `/Chats/${conversationId}/messages`, method: "POST", payload: body, config: silent }),
};
