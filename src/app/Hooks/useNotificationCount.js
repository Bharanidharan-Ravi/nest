// hooks/useNotificationCount.js

import { useApiQuery } from "../../core/query/useApiQuery";
import { queryKeys } from "../../core/query/queryKeys";
import { normalizeNotificationList, normalizeTimelineList } from "../shared/utils/normalizer";

export const useNotificationCount = () => {
  return useApiQuery({
    queryKey: queryKeys.notification.unreadCount(),

    url: "/notification/unread-count",

    method: "GET",
    silent: true,
    options: {
      refetchInterval: 300000,
      staleTime: 10000,
    },
  });
};

export const getNotification = (showNotifications) => {
  return useApiQuery({
    queryKey: queryKeys.notification.list(),

    url: "/notification/list",

    method: "GET",
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
