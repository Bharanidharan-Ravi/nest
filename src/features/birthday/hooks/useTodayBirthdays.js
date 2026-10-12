// useTodayBirthdays.js
//
// Today's birthdays from the employee master, as seen by the logged-in user:
//   isMyBirthday → the user is an active Admin/Employee whose birthday is today
//   others       → everyone else celebrating today (for the header banner)
// A Client login gets nothing. Re-evaluates when the date rolls over, so a tab
// left open overnight stops (or starts) celebrating.

import { useEffect, useMemo, useState } from "react";
import { hasAnyRole, readUserFromSession } from "../../../core/auth/useCurrentUser";
import { ROLES } from "../../../core/auth/permissions";
import { useMasterList } from "../../../core/master/useMasterItem";
import { birthdaysOn } from "../helpers/birthday";

const CHECK_DATE_EVERY_MS = 60 * 1000;
const NONE = { isMyBirthday: false, me: null, others: [] };

function useToday() {
  const [day, setDay] = useState(() => new Date().toDateString());
  useEffect(() => {
    const timer = setInterval(() => {
      const current = new Date().toDateString();
      setDay((prev) => (prev === current ? prev : current));
    }, CHECK_DATE_EVERY_MS);
    return () => clearInterval(timer);
  }, []);
  return day;
}

export function useTodayBirthdays() {
  const employees = useMasterList("employee");
  const day = useToday();
  const user = readUserFromSession();
  const userId = user?.userId != null ? String(user.userId) : null;
  const isStaff = hasAnyRole(user, [ROLES.ADMIN, ROLES.MANAGER]);

  return useMemo(() => {
    if (!isStaff) return NONE;
    const today = birthdaysOn(employees, new Date(day));
    const me = today.find((e) => String(e.id) === userId) ?? null;
    return {
      isMyBirthday: Boolean(me),
      me,
      others: today.filter((e) => e !== me),
    };
  }, [employees, day, userId, isStaff]);
}
