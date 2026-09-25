// useDocumentTitle.js
//
// Keeps the tab title as "(n) <app title>" while there are unread
// notifications. The base title is read once from index.html's <title>, so the
// app name lives in exactly one place.

import { useEffect } from "react";

export const BASE_TITLE =
  typeof document !== "undefined" ? document.title : "";

export const formatNotificationTitle = (count, baseTitle = BASE_TITLE) =>
  count > 0 ? `(${count > 99 ? "99+" : count}) ${baseTitle}` : baseTitle;

export const useDocumentTitle = (unreadCount) => {
  useEffect(() => {
    document.title = formatNotificationTitle(unreadCount);
  }, [unreadCount]);

  // Unmount = logout / leaving the authenticated layout → restore plain title
  useEffect(() => () => {
    document.title = BASE_TITLE;
  }, []);
};
