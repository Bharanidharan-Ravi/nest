import dayjs from "dayjs"

// Must match the permission limits in PermissionRequestRepo on the API.
export const PERMISSION_MAX_HOURS = 3
const OFFICE_END = { hour: 18, minute: 30 }

// How many whole hours can still be requested on a date. Future dates get
// the full 3; today shrinks as 6:30 PM approaches (till 3:30 PM → 3,
// till 4:30 PM → 2, till 6:30 PM → 1, after that → 0).
export const getMaxPermissionHours = (date, now = dayjs()) => {
  if (!dayjs(date).isSame(now, "day")) return PERMISSION_MAX_HOURS
  const officeEnd = now.hour(OFFICE_END.hour).minute(OFFICE_END.minute).second(0).millisecond(0)
  const minutesLeft = officeEnd.diff(now, "minute", true)
  if (minutesLeft <= 0) return 0
  return Math.min(PERMISSION_MAX_HOURS, Math.max(1, Math.floor(minutesLeft / 60)))
}
