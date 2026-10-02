// hooks/useNotificationCount.js

import { useApiQuery } from "../../core/query/useApiQuery";
import { queryKeys } from "../../core/query/queryKeys";
import { executeApi } from "../../core/api/executor";
import { normalizeNotificationList, normalizeTimelineList } from "../shared/utils/normalizer";
import { trackUnreadCountRequest } from "../../core/notifications/unreadCountSync";
import { fetchCount, useBadgeCount } from "../../core/notifications/badgeCounts";

// Shared with handleIncomingNotification so the realtime refresh fills the
// same cache entry (queryKeys.notification.list()) with the same raw shape.
export const fetchNotificationList = ({ _silent = true } = {}) =>
  executeApi({
    url: "/notification/list",
    method: "GET",
    config: { _silent },
  });

// Part of GET /notification/counts. No polling: realtime events bump it, and it
// only drops when the user opens / marks notifications seen. Tracked so a
// response that started before a realtime event can't drop that event's +1
// (see unreadCountSync).
export const useNotificationCount = () =>
  useBadgeCount("UnreadCount", {
    queryFn: () => trackUnreadCountRequest(() => fetchCount("UnreadCount")),
    // unreadCountSync keys request metadata by the exact data object
    structuralSharing: false,
  });

export const getNotification = (showNotifications) => {
  return useApiQuery({
    queryKey: queryKeys.notification.list(),

    queryFn: fetchNotificationList,
    silent: true,
    options: {
      enabled: showNotifications,
      select: (rawData) => normalizeNotificationList(rawData),
    },
  });
};

export const getTimeline = (showTimeline) => {
  return useApiQuery({
    queryKey: queryKeys.notification.timeline(),
    url: "/sync/v2",
    method: "POST",
    silent: true,
    source: "TicketHistory",
    payload: {
      ConfigKeys: ["TicketHistory"],
    },
    options: {
      enabled: showTimeline,
      select: (rawData) => normalizeTimelineList(rawData),
    },
  });
};
