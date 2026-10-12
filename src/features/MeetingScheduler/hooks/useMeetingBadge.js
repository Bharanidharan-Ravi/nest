// The meeting count shown on the header calendar and the sidebar entry:
// unseen "meeting created" notifications (cleared when the header calendar is
// opened) plus today's meetings, which stay until completed or cancelled.

import { useNotificationCount } from "../../../app/Hooks/useNotificationCount";
import { useTodayMeetings } from "./useTodayMeetings";

export function useMeetingBadge() {
  const { data } = useNotificationCount();
  const todayMeetings = useTodayMeetings();
  const unseenNotifications = data?.MEETING || 0;

  return {
    todayMeetings,
    unseenNotifications,
    count: unseenNotifications + todayMeetings.length,
  };
}
