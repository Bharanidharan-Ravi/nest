// badgeCounts.js
//
// Every header/sidebar badge comes from one GET /notification/counts call
// (sync-style Res, each key ok/fails on its own):
//
//   UnreadCount                → { TICKET, MEETING, LEAVE_REQUEST } unseen notifications
//   LeaveRequestCount          → admin: requests awaiting a decision
//                                others: unseen decisions on their own requests
//   GetStaleTicketsForAssignee → the user's stale tickets
//
// Each part keeps its own cache entry (all under queryKeys.notification.all, so
// mark-seen's invalidate of ["notification"] refreshes them together). Loaded
// once, then refreshed only by realtime events, mark-seen and reconnect — no
// polling. Queries fetching at the same time share one request.

import { useQuery } from "@tanstack/react-query";
import { executeApi } from "../api/executor";
import { queryClient } from "../api/queryClient";
import { queryKeys } from "../query/queryKeys";

// Res key → cache entry it fills
const COUNT_CACHES = {
  UnreadCount: queryKeys.notification.unreadCount,
  LeaveRequestCount: queryKeys.notification.leaveRequestCount,
  GetStaleTicketsForAssignee: queryKeys.notification.staleTickets,
};

// UnreadCount is written only by its own queryFn, wrapped in
// trackUnreadCountRequest (see unreadCountSync) — never seeded from a sibling
const SEEDABLE = Object.keys(COUNT_CACHES).filter((key) => key !== "UnreadCount");

let shared = null;

const requestCounts = () => {
  if (!shared) {
    shared = executeApi({
      url: "/notification/counts",
      method: "GET",
      config: { _silent: true, _noErrorToast: true },
    });
    // Only calls made in the same tick (one render, one invalidate) share it, so a
    // refetch after mark-seen never reuses a response that started before it
    setTimeout(() => {
      shared = null;
    }, 0);
  }
  return shared;
};

/** Fetches the counts and returns one part; the response also refreshes the sibling caches. */
export const fetchCount = async (source) => {
  const res = await requestCounts();

  for (const key of SEEDABLE) {
    if (key !== source && res?.[key]?.Ok) queryClient.setQueryData(COUNT_CACHES[key](), res[key].Data);
  }

  const entry = res?.[source];
  if (!entry?.Ok) throw new Error(entry?.Err?.M ?? `${source} unavailable`);
  return entry.Data;
};

/** One badge cache, e.g. useBadgeCount("LeaveRequestCount"). */
export const useBadgeCount = (source, options = {}) =>
  useQuery({
    queryKey: COUNT_CACHES[source](),
    queryFn: () => fetchCount(source),
    staleTime: Infinity,
    ...options,
  });
