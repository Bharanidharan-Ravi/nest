import { useNotificationCount } from "../../../app/Hooks/useNotificationCount";
import { useCurrentUser } from "../../../core/auth/useCurrentUser";

/** Unread "New Leave Request" count next to "Leave Requests" in the sidebar (admin only). */
export default function LeaveRequestNavBadge() {
  const { isAdmin } = useCurrentUser();
  const { data } = useNotificationCount();
  const count = data?.LEAVE_REQUEST || 0;

  if (!isAdmin || !count) return null;

  return (
    <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
      {count > 99 ? "99+" : count}
    </span>
  );
}
