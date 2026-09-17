// Fan-out for the end-to-end encrypted chat SignalR events:
//   "ChatMessage"            — a new message (ciphertext + this user's wrapped key)
//   "ChatRead"               — this user read a conversation in another tab / device
//   "MessageReactionChanged" — someone added or removed an emoji reaction
//   "ChatMention"            — this user was @tagged, or is the notified owner of a #tagged entity
const listeners = { message: new Set(), read: new Set(), reaction: new Set(), mention: new Set() };

function subscribe(kind, listener) {
  listeners[kind].add(listener);
  return () => listeners[kind].delete(listener);
}

function emit(kind, payload) {
  listeners[kind].forEach((listener) => {
    try {
      listener(payload);
    } catch (err) {
      console.error("[Chat] realtime listener failed", err);
    }
  });
}

export const subscribeChatMessages = (listener) => subscribe("message", listener);
export const subscribeChatRead = (listener) => subscribe("read", listener);
export const subscribeChatReaction = (listener) => subscribe("reaction", listener);
export const subscribeChatMention = (listener) => subscribe("mention", listener);

export const emitChatMessage = (message) => emit("message", message);
export const emitChatRead = (read) => emit("read", read);
export const emitChatReaction = (reaction) => emit("reaction", reaction);
export const emitChatMention = (mention) => emit("mention", mention);
