// ─────────────────────────────────────────────────────────────────────────────
// LeaveSingleDatePicker.jsx
// Single-date version of LeaveDateRangePicker's trigger + calendar popover,
// so fields like Permission Date visually match the Leave Request From/To
// Date fields (same wg-input trigger, 📅 icon, DD MMM YYYY label, calendar).
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import dayjs from "dayjs"
import { formatDate } from "../../../app/shared/utils/dateFormat"

const CAL_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
const fmt = (d) => d.format("YYYY-MM-DD")

// holidays: Map of "YYYY-MM-DD" → holiday name; those dates can't be picked.
export default function LeaveSingleDatePicker({ value, onChange, blockedDates, holidays, allowPast = false }) {
  const [showCal, setShowCal] = useState(false)
  const [month, setMonth] = useState(() => (value ? dayjs(value) : dayjs()))

  const wrapRef = useRef(null)
  const triggerRef = useRef(null)
  const [calPosition, setCalPosition] = useState({ top: 0, left: 0 })

  const blockedSet = useMemo(() => blockedDates || new Set(), [blockedDates])
  const holidayMap = useMemo(() => holidays || new Map(), [holidays])
  const isPast = (d) => !allowPast && d.isBefore(dayjs().startOf("day"), "day")
  const holidayName = (d) => holidayMap.get(fmt(d))
  const isDisabled = (d) => isPast(d) || blockedSet.has(fmt(d)) || holidayMap.has(fmt(d))

  const selected = value ? dayjs(value) : null

  useEffect(() => {
    const close = (e) => {
      const portal = document.getElementById("leave-single-date-cal-portal")
      const clickedInsideTrigger = wrapRef.current?.contains(e.target)
      const clickedInsidePortal = portal?.contains(e.target)
      if (!clickedInsideTrigger && !clickedInsidePortal) setShowCal(false)
    }
    document.addEventListener("mousedown", close)
    document.addEventListener("touchstart", close, { passive: true })
    return () => {
      document.removeEventListener("mousedown", close)
      document.removeEventListener("touchstart", close)
    }
  }, [])

  const openCal = () => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (rect) {
      setCalPosition({
        top: rect.bottom + 4,
        left: Math.min(rect.left, window.innerWidth - 296),
      })
    }
    setMonth(selected || dayjs())
    setShowCal(true)
  }

  const buildDayCells = () => {
    const cells = []
    const offset = month.startOf("month").day()
    for (let i = 0; i < offset; i++) cells.push(null)
    for (let d = 1; d <= month.daysInMonth(); d++) cells.push(month.date(d))
    return cells
  }

  const getDayClass = (d) => {
    const disabled = isDisabled(d)
    const isSel = selected && d.isSame(selected, "day")
    const isT = d.isSame(dayjs(), "day")
    return [
      "h-8 w-full flex items-center justify-center text-xs select-none transition-colors relative",
      disabled ? "text-gray-300 cursor-not-allowed line-through" : "cursor-pointer",
      !disabled && isSel ? "bg-blue-500 text-white rounded-full" : "",
      !disabled && !isSel ? "hover:bg-gray-100 active:bg-gray-200 rounded-full text-gray-700" : "",
      holidayName(d) && !isPast(d) ? "bg-purple-50 text-purple-400 rounded-full" : "",
      isT && !isSel ? "font-bold underline underline-offset-2" : "",
    ]
      .filter(Boolean)
      .join(" ")
  }

  const label = (val, placeholder) => (val ? formatDate(val) : placeholder)

  return (
    <div ref={wrapRef}>
      <button
        type="button"
        ref={triggerRef}
        onClick={() => (showCal ? setShowCal(false) : openCal())}
        className="wg-input text-left flex items-center justify-between"
      >
        <span className={value ? "text-gray-800" : "text-gray-400"}>{label(value, "Select date")}</span>
        <span className="text-gray-400">📅</span>
      </button>

      {showCal &&
        createPortal(
          <div
            id="leave-single-date-cal-portal"
            className="bg-white border border-gray-200 rounded-xl shadow-2xl p-4 w-[288px]"
            style={{ position: "fixed", top: calPosition.top, left: calPosition.left, zIndex: 99999 }}
          >
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => setMonth((m) => m.subtract(1, "month"))}
                className="p-1.5 hover:bg-gray-100 active:bg-gray-200 rounded-md text-gray-500 text-xs"
              >
                ◁
              </button>
              <span className="text-sm font-semibold text-gray-700">{month.format("MMMM YYYY")}</span>
              <button
                type="button"
                onClick={() => setMonth((m) => m.add(1, "month"))}
                className="p-1.5 hover:bg-gray-100 active:bg-gray-200 rounded-md text-gray-500 text-xs"
              >
                ▷
              </button>
            </div>

            <div className="grid grid-cols-7 mb-1">
              {CAL_DAYS.map((d) => (
                <div key={d} className="text-center text-[10px] font-semibold text-gray-400">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {buildDayCells().map((date, i) =>
                !date ? (
                  <div key={`e-${i}`} />
                ) : (
                  <div
                    key={fmt(date)}
                    title={holidayName(date) ? `Holiday: ${holidayName(date)}` : undefined}
                    className={getDayClass(date)}
                    onClick={() => {
                      if (isDisabled(date)) return
                      onChange(fmt(date))
                      setShowCal(false)
                    }}
                  >
                    {date.date()}
                  </div>
                ),
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3 text-[10px] text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-50 border border-purple-200 inline-block" /> Holiday
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-100 border border-gray-200 inline-block" /> Unavailable
              </span>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
