// ─────────────────────────────────────────────────────────────────────────────
// useHolidayDates.js
// Holidays from the /sync/v2 "HolidayList" master as a Map of
// "YYYY-MM-DD" → holiday name. Leave / permission calendars block these dates
// (the API rejects them too).
// ─────────────────────────────────────────────────────────────────────────────
import { useMemo } from "react"
import dayjs from "dayjs"
import { getHolidayList } from "../employeeArea/hooks/useHolidayList"

export const useHolidayDates = () => {
  const { data } = getHolidayList(null, { staleTime: 5 * 60 * 1000 })

  return useMemo(() => {
    const map = new Map()
    ;(Array.isArray(data) ? data : []).forEach((h) => {
      if (h?.HolidayDate) map.set(dayjs(h.HolidayDate).format("YYYY-MM-DD"), h.HolidayName?.trim() || "Holiday")
    })
    return map
  }, [data])
}
