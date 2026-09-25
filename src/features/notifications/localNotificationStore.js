/**
 * src/features/notifications/localNotificationStore.js
 *
 * Client-side stand-in for admin notifications. The Notifications page
 * (`getNotification()` in useNotificationCount.js) only reads from
 * `/notification/list`, and there is no `/notification/create` endpoint yet.
 * Until that exists, notifications raised from the client (e.g. a new leave
 * request) are kept here and merged into NotificationsPage's list.
 */

const STORAGE_KEY = "localNotifications";

const readAll = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

let notifications = readAll();
const listeners = new Set();

const persist = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch {
    // ignore quota/serialization errors
  }
  listeners.forEach((cb) => cb(notifications));
};

export const getLocalNotifications = () => notifications;

// Matches the shape of normalizeNotification() in app/shared/utils/normalizer.js
export const addLocalNotification = ({ title, message, entityType, entityId, actorName }) => {
  const notification = {
    id: `local-${Date.now()}`,
    notificationId: `local-${Date.now()}`,
    title,
    message,
    entityType,
    entityId,
    createdAt: new Date().toISOString(),
    actorName,
    isUnread: true,
  };
  notifications = [notification, ...notifications];
  persist();
  return notification;
};

export const subscribeLocalNotifications = (callback) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};
