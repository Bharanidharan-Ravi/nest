import { useCurrentUser } from "../../../core/auth/useCurrentUser";
import { useLeaveRequestMaster } from "../../../core/master/selectors/selectors";

// Count of requests still awaiting a decision (admin only) — not an
// unread-notification count, so it only drops when a request is actually
// approved/rejected, never just from opening the list. Reuses the same
// master list the page renders, kept fresh by realtimeDispatcher's
// "LeaveRequest" invalidate entry.
export default function LeaveRequestNavBadge() {
  const { isAdmin } = useCurrentUser();
  const leaveRequests = useLeaveRequestMaster();
  const count = isAdmin
    ? leaveRequests.filter((request) => request.status?.toUpperCase() === "REQUESTED").length
    : 0;

  if (!isAdmin || !count) return null;

  return (
    <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
      {count > 99 ? "99+" : count}
    </span>
  );
}
