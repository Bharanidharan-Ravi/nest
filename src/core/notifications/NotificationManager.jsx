// NotificationManager.jsx
//
// Headless component mounted once inside the authenticated layout. Keeps
// everything derived from the unread count in sync with the React Query cache
// (the same query the Header badges render — no extra request):
//   cache → useNotificationStore.count → document.title
// SignalR events themselves are handled in useRealtimeSync →
// handleIncomingNotification, so nothing here subscribes to SignalR.

import { useEffect } from "react";
import { useNotificationCount } from "../../app/Hooks/useNotificationCount";
import { useCurrentUser } from "../auth/useCurrentUser";
import { useNotificationStore } from "../state/useNotificationStore";
import { useDocumentTitle } from "./useDocumentTitle";
import { getUnreadTotal } from "./unreadCount";
import { requestNotificationPermission } from "./browserNotification";
import { preloadNotificationSound } from "./notificationSound";

export default function NotificationManager() {
  const { isViewer } = useCurrentUser();
  const { data } = useNotificationCount();

  // Viewers have no bell to clear notifications from (see Header), so they
  // get no count in the title either.
  const unreadTotal = isViewer ? 0 : getUnreadTotal(data);

  useEffect(() => {
    useNotificationStore.getState().setCount(unreadTotal);
  }, [unreadTotal]);

  useEffect(() => () => useNotificationStore.getState().reset(), []);

  useDocumentTitle(unreadTotal);

  // Permission prompts and audio both need a user gesture; use the first one
  // after login, once.
  useEffect(() => {
    if (isViewer) return undefined;

    const onFirstInteraction = (e) => {
      // Escape doesn't count as user activation for permission prompts
      if (e.type === "keydown" && e.key === "Escape") return;
      window.removeEventListener("pointerdown", onFirstInteraction, true);
      window.removeEventListener("keydown", onFirstInteraction, true);
      preloadNotificationSound();
      requestNotificationPermission();
    };

    window.addEventListener("pointerdown", onFirstInteraction, true);
    window.addEventListener("keydown", onFirstInteraction, true);
    return () => {
      window.removeEventListener("pointerdown", onFirstInteraction, true);
      window.removeEventListener("keydown", onFirstInteraction, true);
    };
  }, [isViewer]);

  return null;
}
