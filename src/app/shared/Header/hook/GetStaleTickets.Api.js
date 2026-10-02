import { useBadgeCount } from "../../../../core/notifications/badgeCounts";

// The signed-in user's stale tickets — part of GET /notification/counts (the
// server resolves the assignee from the token). Header and Dashboard share it.
export const useGetStaleTicketData = () => useBadgeCount("GetStaleTicketsForAssignee");
