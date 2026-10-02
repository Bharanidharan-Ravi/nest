// notificationNavigation.js
//
// OS notifications are raised from handleIncomingNotification, which runs from
// useRealtimeSync in App — outside <BrowserRouter>, so it can't use the router
// hooks. NotificationManager (inside the router) registers its goTo here, and a
// notification click goes through it to the same screen the header dropdown /
// Activity Hub would open for that notification.

import { ROUTE_KEYS } from "../routing/paths";

let goTo = null;

/** @returns {() => void} unregister */
export const setNotificationNavigator = (fn) => {
  goTo = fn;
  return () => {
    if (goTo === fn) goTo = null;
  };
};

/**
 * Same mapping as the header dropdown and NotificationsPage.
 * @returns {{ key: string, params?: object } | null}
 */
export const getNotificationTarget = (notification) => {
  if (!notification) return null;
  const type = String(notification.entityType ?? "").toUpperCase();

  switch (type) {
    case "LEAVE_REQUEST":
      return { key: ROUTE_KEYS.LEAVE_LIST };
    case "MEETING":
      return { key: ROUTE_KEYS.MEETING_LIST };
    case "TICKET":
    case "COMMENT":
      return notification.entityId
        ? { key: ROUTE_KEYS.TICKET_DETAIL, params: { ticketId: notification.entityId } }
        : { key: ROUTE_KEYS.NOTIFICATIONS };
    default:
      return { key: ROUTE_KEYS.NOTIFICATIONS };
  }
};

export const openNotificationTarget = (notification) => {
  const target = getNotificationTarget(notification);
  if (!target || !goTo) return;
  try {
    goTo(target.key, target.params);
  } catch (err) {
    console.warn("[Notification] Could not open notification target:", err);
  }
};
