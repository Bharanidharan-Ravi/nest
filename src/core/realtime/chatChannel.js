// Fan-out for the SignalR "ChatMessage" event (end-to-end encrypted chat).
const listeners = new Set();

export function subscribeChatMessages(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitChatMessage(message) {
  listeners.forEach((listener) => {
    try {
      listener(message);
    } catch (err) {
      console.error("[Chat] realtime listener failed", err);
    }
  });
}
