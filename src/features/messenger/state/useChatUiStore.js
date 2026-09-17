import { create } from "zustand";

const MAX_DOCK_WINDOWS = 2;
const MAX_NOTIFICATIONS = 3;

const lower = (id) => String(id ?? "").toLowerCase();

/**
 * UI state for the message bar (dock) and for knowing which conversations are
 * on screen, so incoming messages there are marked read instead of notified.
 */
export const useChatUiStore = create((set, get) => ({
  /** Conversation list panel of the message bar is expanded. */
  dockOpen: false,
  /** Mini chat windows docked next to the bar, most recently opened last. */
  windows: [], // [{ conversationId, minimized }]
  /** conversationId (lower-case) -> number of mounted, expanded views showing it */
  visible: {},
  /** In-app "new message" pop-ups. */
  notifications: [], // [{ id, conversationId, senderUserId, text, createdAt }]

  toggleDock: () => set((s) => ({ dockOpen: !s.dockOpen })),
  closeDock: () => set({ dockOpen: false }),

  openWindow: (conversationId) =>
    set((s) => {
      const rest = s.windows.filter((w) => lower(w.conversationId) !== lower(conversationId));
      const windows = [...rest, { conversationId, minimized: false }].slice(-MAX_DOCK_WINDOWS);
      return {
        windows,
        dockOpen: false,
        notifications: s.notifications.filter((n) => lower(n.conversationId) !== lower(conversationId)),
      };
    }),
  closeWindow: (conversationId) =>
    set((s) => ({ windows: s.windows.filter((w) => lower(w.conversationId) !== lower(conversationId)) })),
  toggleMinimized: (conversationId) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        lower(w.conversationId) === lower(conversationId) ? { ...w, minimized: !w.minimized } : w,
      ),
    })),

  /** Called by a conversation view while it is expanded on screen. Returns the unregister function. */
  registerVisible: (conversationId) => {
    const id = lower(conversationId);
    set((s) => ({ visible: { ...s.visible, [id]: (s.visible[id] ?? 0) + 1 } }));
    return () =>
      set((s) => {
        const count = (s.visible[id] ?? 1) - 1;
        const visible = { ...s.visible };
        if (count > 0) visible[id] = count;
        else delete visible[id];
        return { visible };
      });
  },

  /** On screen AND the browser tab is in front. */
  isViewing: (conversationId) =>
    !!get().visible[lower(conversationId)] &&
    (typeof document === "undefined" || document.visibilityState === "visible"),

  notify: (notification) =>
    set((s) => ({
      notifications: [
        ...s.notifications.filter((n) => lower(n.conversationId) !== lower(notification.conversationId)),
        { id: notification.messageId ?? crypto.randomUUID(), createdAt: Date.now(), ...notification },
      ].slice(-MAX_NOTIFICATIONS),
    })),
  dismissNotification: (id) => set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
  dismissConversationNotifications: (conversationId) =>
    set((s) => ({
      notifications: s.notifications.filter((n) => lower(n.conversationId) !== lower(conversationId)),
    })),

  reset: () => set({ dockOpen: false, windows: [], visible: {}, notifications: [] }),
}));
