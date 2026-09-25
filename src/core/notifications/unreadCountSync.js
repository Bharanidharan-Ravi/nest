// unreadCountSync.js
//
// Keeps the cached unread count (queryKeys.notification.unreadCount()) correct
// while SignalR bumps and server count requests (30s poll, mark-seen
// invalidation, reconnect) race each other.
//
// The backend saves a notification before it publishes the SignalR ping, so a
// count request that *started* after the ping arrived always includes it. One
// that started earlier may or may not. Realtime events and count requests
// therefore share one sequence number:
//
//   event seq  < request start seq → the response already counts it
//   event seq  > request start seq → ambiguous: re-apply the local +1 on top
//                                    and schedule one reconciliation fetch
//
// So a stale response can never drop a realtime +1, local arithmetic never
// outlives the next count request, and the server stays the source of truth.

import { queryKeys } from "../query/queryKeys";
import { incrementUnreadCount } from "./unreadCount";

// A response that landed this close to an event may already include it
const AMBIGUITY_WINDOW_MS = 5000;

// One reconciliation fetch per burst, not one per event
const RECONCILE_DELAY_MS = 1000;

const MAX_PENDING = 200;

const unreadKey = () => queryKeys.notification.unreadCount();

let seq = 0;

// Cached count object → { startSeq, completedAt } of the request it came from
// (the count query uses structuralSharing: false so the object is kept as is)
const snapshots = new WeakMap();

// Realtime +1s not yet confirmed by a count request started after them
let pending = [];

let reconcileTimer = null;
let reconcileClient = null;

const scheduleReconcile = (queryClient) => {
  if (queryClient) reconcileClient = queryClient;
  if (reconcileTimer || !reconcileClient) return;

  reconcileTimer = setTimeout(() => {
    reconcileTimer = null;
    reconcileClient?.invalidateQueries({ queryKey: unreadKey() });
  }, RECONCILE_DELAY_MS);
};

/** Call as soon as the SignalR event arrives, before any async work. */
export const markRealtimeEvent = () => ({ seq: ++seq, at: Date.now() });

/**
 * Wraps the /notification/unread-count request (the count query's queryFn).
 * @param {() => Promise<object>} request
 */
export const trackUnreadCountRequest = async (request) => {
  const startSeq = ++seq;
  const server = await request();

  // Everything received before this request started is in its result
  pending = pending.filter((p) => p.seq > startSeq);

  const base = server && typeof server === "object" && !Array.isArray(server) ? server : {};
  const data = pending.reduce((acc, p) => incrementUnreadCount(acc, p.type), { ...base });
  snapshots.set(data, { startSeq, completedAt: Date.now() });

  if (pending.length) scheduleReconcile();
  return data;
};

/**
 * Applies one realtime notification to the cached count.
 * @param {import("@tanstack/react-query").QueryClient} queryClient
 * @param {{ seq: number, at: number }} event from markRealtimeEvent
 * @param {string | undefined} entityType undefined → type unknown
 */
export const applyRealtimeNotification = (queryClient, event, entityType) => {
  const key = unreadKey();
  const current = queryClient.getQueryData(key);
  const snapshot = current === undefined ? undefined : snapshots.get(current);

  // Cached count comes from a request started after this event → already counted
  if (snapshot && snapshot.startSeq > event.seq) return;

  if (!entityType || current === undefined) {
    // Type unknown or nothing cached yet → a fresh server count
    queryClient.invalidateQueries({ queryKey: key });
    return;
  }

  pending.push({ seq: event.seq, type: entityType });
  if (pending.length > MAX_PENDING) pending = pending.slice(-MAX_PENDING);

  queryClient.setQueryData(key, (old) => {
    const next = incrementUnreadCount(old, entityType);
    const meta = snapshots.get(old);
    if (meta && next !== old) snapshots.set(next, meta);
    return next;
  });

  // The cached count may already include this notification (it landed right
  // around the event), or a request that started before the event is still
  // in flight → confirm with the server once the burst settles.
  const ambiguous =
    (snapshot && event.at - snapshot.completedAt < AMBIGUITY_WINDOW_MS) ||
    queryClient.isFetching({ queryKey: key }) > 0;
  if (ambiguous) scheduleReconcile(queryClient);
};

/** Logout / session end. */
export const resetUnreadCountSync = () => {
  pending = [];
  clearTimeout(reconcileTimer);
  reconcileTimer = null;
  reconcileClient = null;
};
