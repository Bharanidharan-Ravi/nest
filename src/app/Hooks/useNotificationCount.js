// hooks/useNotificationCount.js

import { useApiQuery } from "../../core/query/useApiQuery";
import { queryKeys } from "../../core/query/queryKeys";

export const useNotificationCount = () => {
  return useApiQuery({
    queryKey: queryKeys.notification.unreadCount(),

    url: "/notification/unread-count",

    method: "GET",
    silent: true,
    options: {
      refetchInterval: 30000,
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
    },
  });
};
