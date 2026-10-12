// Today's meetings (not completed / cancelled) for the current user, for the
// header calendar badge. Reads the same cached list as the sidebar and the
// reminder, and re-evaluates every minute so it rolls over at midnight.

import { useEffect, useMemo, useState } from "react";
import { readUserFromSession } from "../../../core/auth/useCurrentUser";
import { todaysMeetings } from "../Helpers/reminders";
import { useUpcomingMeeting } from "./index";

export function useTodayMeetings() {
  const { data: upcoming } = useUpcomingMeeting();
  const [now, setNow] = useState(() => new Date());
  const userId = readUserFromSession()?.userId;

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  return useMemo(() => todaysMeetings(upcoming, now, userId), [upcoming, now, userId]);
}
