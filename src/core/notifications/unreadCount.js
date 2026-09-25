// unreadCount.js
//
// The unread-count API (queryKeys.notification.unreadCount()) returns a map
// keyed by notification EntityType, e.g. { TICKET: 3, MEETING: 1 }.
//
// Only types the user can actually clear (via /Notification/mark-seen) count
// toward the header/tab-title total — otherwise the tab title would be stuck
// at "(n)" forever:
//   TICKET        → Header bell
//   MEETING       → Header calendar
//   LEAVE_REQUEST → opening the Leave Requests page
export const COUNTED_NOTIFICATION_TYPES = ["TICKET", "MEETING", "LEAVE_REQUEST"];

export const getUnreadTotal = (countData) => {
  if (!countData || typeof countData !== "object") return 0;
  return COUNTED_NOTIFICATION_TYPES.reduce(
    (sum, type) => sum + (Number(countData[type]) || 0),
    0,
  );
};

export const incrementUnreadCount = (countData, entityType) => {
  const type = String(entityType ?? "").toUpperCase();
  if (!type) return countData;
  const current = countData && typeof countData === "object" ? countData : {};
  return { ...current, [type]: (Number(current[type]) || 0) + 1 };
};
