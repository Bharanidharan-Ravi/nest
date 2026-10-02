import { useBadgeCount } from "../../../core/notifications/badgeCounts";

// From GET /notification/counts — the leave list itself is only fetched when the
// Leave Requests page opens. Admin: requests awaiting a decision (drops only when
// one is approved/rejected). Employee: decisions on their own requests they
// haven't seen yet (drops when the Leave Requests page marks them seen).
// Refreshed by realtimeDispatcher's "LeaveRequest" entry and by mark-seen.
export default function LeaveRequestNavBadge() {
  const { data: count = 0 } = useBadgeCount("LeaveRequestCount");

  if (!count) return null;

  return (
    <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
      {count > 99 ? "99+" : count}
    </span>
  );
}
