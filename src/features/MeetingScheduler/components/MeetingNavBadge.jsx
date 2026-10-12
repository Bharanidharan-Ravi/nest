import { useMeetingBadge } from "../hooks/useMeetingBadge";

// Sidebar count for Meeting Scheduler, same number as the header calendar.
export default function MeetingNavBadge() {
  const { count } = useMeetingBadge();

  if (!count) return null;

  return (
    <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
      {count > 99 ? "99+" : count}
    </span>
  );
}
