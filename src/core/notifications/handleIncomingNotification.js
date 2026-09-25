// handleIncomingNotification.js
//
// Single entry point for a "Notification" EntityChanged event from SignalR.
// useRealtimeSync has already deduplicated it by NotificationId and dropped
// self-created ones; this does everything else from that one event:
//
//   resolve details from /notification/list →
//   update the cached unread count (header badges + tab title follow) →
//   sound, plus an OS notification if the app isn't in the foreground
//
// The SignalR payload only carries { NotificationId, CreatedByUserId }, so the
// title/message/type come from the existing list API — one call per event,
// which also refreshes the cached list the header dropdown shows. Alerts only
// fire for a notification that is actually in this user's own list.

import { queryKeys } from "../query/queryKeys";
import { fetchNotificationList } from "../../app/Hooks/useNotificationCount";
import { normalizeNotificationList } from "../../app/shared/utils/normalizer";
import { playNotificationSound } from "./notificationSound";
import { isAppInForeground, showBrowserNotification } from "./browserNotification";
import { applyRealtimeNotification, markRealtimeEvent } from "./unreadCountSync";

// How long a tab keeps the per-notification alert lock, so a second open tab
// receiving the same event doesn't chime / notify a second time.
const ALERT_CLAIM_HOLD_MS = 5000;

// Background tabs wait this long before claiming, so a tab the user is
// looking at wins the lock (→ chime only, no OS notification).
const BACKGROUND_CLAIM_DELAY_MS = 300;

// Scoped to user + notification: tabs signed in as different users in the
// same browser must never swallow each other's alerts.
const claimAlert = async (notificationId, userId) => {
  if (!notificationId || !navigator.locks?.request) return true;

  if (!isAppInForeground()) {
    await new Promise((resolve) => setTimeout(resolve, BACKGROUND_CLAIM_DELAY_MS));
  }

  const lockName = `wg-notification-${String(userId ?? "").toLowerCase()}-${notificationId}`;

  return new Promise((resolve) => {
    navigator.locks
      .request(lockName, { ifAvailable: true }, (lock) => {
        resolve(!!lock);
        if (!lock) return undefined;
        return new Promise((release) => setTimeout(release, ALERT_CLAIM_HOLD_MS));
      })
      .catch(() => resolve(true));
  });
};

// "Ticket T1: New comment added to ticket" → "... added to ticket by Func".
// Skipped when the message already names the actor (e.g. new leave requests).
export const withActorName = (message, actorName) => {
  const text = (message ?? "").trim();
  const name = (actorName ?? "").trim();
  if (!name || text.toLowerCase().includes(name.toLowerCase())) return text;
  return text ? `${text.replace(/\.+$/, "")} by ${name}` : `By ${name}`;
};

const sameId = (a, b) =>
  a != null && b != null && String(a).toLowerCase() === String(b).toLowerCase();

const findInList = async (queryClient, notificationId) => {
  const raw = await queryClient.fetchQuery({
    queryKey: queryKeys.notification.list(),
    queryFn: () => fetchNotificationList(),
    staleTime: 0,
  });
  return (
    normalizeNotificationList(raw).find((n) => sameId(n.notificationId, notificationId)) ?? null
  );
};

const resolveNotification = async (queryClient, notificationId) => {
  try {
    // fetchQuery joins a list request already in flight — in a burst that one
    // may have started before this notification existed, so look once more
    // (the second request necessarily starts after the first one finished).
    return (
      (await findInList(queryClient, notificationId)) ??
      (await findInList(queryClient, notificationId))
    );
  } catch (err) {
    console.warn("[Notification] Could not load notification details:", err);
    return null;
  }
};

/**
 * @param {import("@tanstack/react-query").QueryClient} queryClient
 * @param {{ notificationId: string, userId?: string, alertsEnabled: boolean }} options
 *   alertsEnabled = false → cache updates only (no sound / OS notification)
 */
export const handleIncomingNotification = async (
  queryClient,
  { notificationId, userId, alertsEnabled },
) => {
  // Ordered against count requests before any async work (see unreadCountSync)
  const event = markRealtimeEvent();

  // Claim in parallel with the lookup, so tabs race on arrival time and
  // focus rather than on how fast their list request returns.
  const claim = alertsEnabled ? claimAlert(notificationId, userId) : Promise.resolve(false);

  const notification = await resolveNotification(queryClient, notificationId);

  applyRealtimeNotification(queryClient, event, notification?.entityType);

  // Only refetches if the Timeline tab is currently mounted
  queryClient.invalidateQueries({ queryKey: queryKeys.notification.timeline() });

  const ownsAlert = await claim;
  if (!notification || !ownsAlert) return;

  playNotificationSound();

  if (!isAppInForeground()) {
    showBrowserNotification({
      id: notificationId,
      title: notification.title || "New notification",
      body: withActorName(notification.message, notification.actorName),
    });
  }
};
