// ─────────────────────────────────────────────────────────────────────────────
// LeaveDateRangePicker.jsx
// Click-to-open calendar for the Create Leave Request form's From/To Date
// fields. Past dates are fully disabled. Dates already covered by one of the
// current user's own REQUESTED/APPROVED leave requests are flagged — if a
// drag-selection would cross one, the range is truncated right before it
// (a leave request is a single contiguous FROM/TO pair, so a range can't
// have a hole in the middle) and a warning explains what was excluded.
// ─────────────────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import dayjs from "dayjs"

const CAL_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
const fmt = (d) => d.format("YYYY-MM-DD")

export default function LeaveDateRangePicker({ fromDate, toDate, onChange, blockedDates }) {
  const [showCal, setShowCal] = useState(false)
  const [month, setMonth] = useState(() => (fromDate ? dayjs(fromDate) : dayjs()))
  const [dragStart, setDragStart] = useState(null)
  const [hoverDay, setHoverDay] = useState(null)
  const [calPosition, setCalPosition] = useState({ top: 0, left: 0 })

  const wrapRef = useRef(null)
  const gridRef = useRef(null)
  const fromTriggerRef = useRef(null)
  const toTriggerRef = useRef(null)
  const dragStartRef = useRef(null)
  const hoverDayRef = useRef(null)

  const setHover = (d) => {
    hoverDayRef.current = d
    setHoverDay(d)
  }

  const blockedSet = useMemo(() => blockedDates || new Set(), [blockedDates])
  const isPast = (d) => d.isBefore(dayjs().startOf("day"), "day")
  const isRequested = (d) => blockedSet.has(fmt(d))
  const isDisabled = useCallback(
    (d) => d.isBefore(dayjs().startOf("day"), "day") || blockedSet.has(fmt(d)),
    [blockedSet],
  )

  const start = fromDate ? dayjs(fromDate) : null
  const end = toDate ? dayjs(toDate) : null

  // ── Outside-click → close calendar ───────────────────────────────────────
  useEffect(() => {
    const close = (e) => {
      if (dragStartRef.current) return
      const portal = document.getElementById("leave-date-cal-portal")
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

  useEffect(() => {
    const grid = gridRef.current
    if (!grid) return
    const onTouchMove = (e) => {
      if (!dragStartRef.current) return
      e.preventDefault()
      const touch = e.touches[0]
      if (!touch) return
      const el = document.elementFromPoint(touch.clientX, touch.clientY)
      const dateStr = el?.closest("[data-date]")?.getAttribute("data-date")
      if (dateStr) setHover(dayjs(dateStr))
    }
    grid.addEventListener("touchmove", onTouchMove, { passive: false })
    return () => grid.removeEventListener("touchmove", onTouchMove)
  }, [])

  // ── Finish a drag/click: truncate the range at the first disabled date
  //    encountered walking away from the anchor (dragStart) ────────────────
  const finishSelection = useCallback(
    (ds, hd) => {
      if (!ds) return
      const anchor = ds
      const target = hd || ds

      if (anchor.isSame(target, "day")) {
        if (!isDisabled(anchor)) onChange(fmt(anchor), fmt(anchor), null)
        dragStartRef.current = null
        setDragStart(null)
        setHover(null)
        setShowCal(false)
        return
      }

      const forward = anchor.isBefore(target, "day")
      let cursor = anchor
      let boundary = anchor
      let blockedHit = null
      // Walk one day at a time from the anchor toward the target, stopping
      // at (and not including) the first disabled date.
      while (true) {
        const next = cursor.add(forward ? 1 : -1, "day")
        if (forward ? next.isAfter(target, "day") : next.isBefore(target, "day")) break
        if (isDisabled(next)) {
          blockedHit = next
          break
        }
        boundary = next
        cursor = next
      }

      const from = forward ? anchor : boundary
      const to = forward ? boundary : anchor
      const warning = blockedHit
        ? `${blockedHit.format("DD MMM")} is already requested — selection limited to ${from.format("DD MMM")}–${to.format("DD MMM")} (${to.diff(from, "day") + 1} day${to.diff(from, "day") + 1 > 1 ? "s" : ""}).`
        : null

      onChange(fmt(from), fmt(to), warning)
      dragStartRef.current = null
      setDragStart(null)
      setHover(null)
      setShowCal(false)
    },
    [onChange, isDisabled],
  )

  useEffect(() => {
    const onMouseUp = () => {
      if (!dragStartRef.current) return
      finishSelection(dragStartRef.current, hoverDayRef.current)
    }
    document.addEventListener("mouseup", onMouseUp)
    return () => document.removeEventListener("mouseup", onMouseUp)
  }, [finishSelection])

  const openCal = (triggerEl) => {
    const rect = triggerEl?.getBoundingClientRect()
    if (rect) {
      setCalPosition({
        top: rect.bottom + 4,
        left: Math.min(rect.left, window.innerWidth - 296),
      })
    }
    setMonth(start || dayjs())
    setShowCal(true)
  }

  const previewStart =
    dragStart && hoverDay ? (dragStart.isBefore(hoverDay, "day") ? dragStart : hoverDay) : start
  const previewEnd =
    dragStart && hoverDay ? (dragStart.isBefore(hoverDay, "day") ? hoverDay : dragStart) : end

  const getDayClass = (d) => {
    const disabled = isDisabled(d)
    const isS = previewStart && d.isSame(previewStart, "day")
    const isE = previewEnd && d.isSame(previewEnd, "day")
    const inR = previewStart && previewEnd && d.isAfter(previewStart, "day") && d.isBefore(previewEnd, "day")
    const isT = d.isSame(dayjs(), "day")
    return [
      "h-8 w-full flex items-center justify-center text-xs select-none transition-colors touch-none relative",
      disabled
        ? "text-gray-300 cursor-not-allowed line-through"
        : "cursor-pointer",
      !disabled && (isS || isE) ? "bg-blue-500 text-white" : "",
      !disabled && isS ? "rounded-l-full" : "",
      !disabled && isE ? "rounded-r-full" : "",
      !disabled && inR ? "bg-blue-100 text-blue-700" : "",
      !disabled && !isS && !isE && !inR ? "hover:bg-gray-100 active:bg-gray-200 rounded-full text-gray-700" : "",
      isRequested(d) && !isPast(d) ? "bg-red-50 text-red-400" : "",
      isT && !isS && !isE ? "font-bold underline underline-offset-2" : "",
    ]
      .filter(Boolean)
      .join(" ")
  }

  const buildDayCells = () => {
    const cells = []
    const offset = month.startOf("month").day()
    for (let i = 0; i < offset; i++) cells.push(null)
    for (let d = 1; d <= month.daysInMonth(); d++) cells.push(month.date(d))
    return cells
  }

  const label = (value, placeholder) =>
    value ? dayjs(value).format("DD MMM YYYY") : placeholder

  return (
    <div ref={wrapRef} className="grid grid-cols-2 gap-4 md:col-span-2">
      <div>
        <label className="block mb-1.5 text-sm font-semibold text-gray-700">
          From Date <span className="text-red-500">*</span>
        </label>
        <button
          type="button"
          ref={fromTriggerRef}
          onClick={() => (showCal ? setShowCal(false) : openCal(fromTriggerRef.current))}
          className="wg-input text-left flex items-center justify-between"
        >
          <span className={fromDate ? "text-gray-800" : "text-gray-400"}>{label(fromDate, "Select date")}</span>
          <span className="text-gray-400">📅</span>
        </button>
      </div>

      <div>
        <label className="block mb-1.5 text-sm font-semibold text-gray-700">
          To Date <span className="text-red-500">*</span>
        </label>
        <button
          type="button"
          ref={toTriggerRef}
          onClick={() => (showCal ? setShowCal(false) : openCal(toTriggerRef.current))}
          className="wg-input text-left flex items-center justify-between"
        >
          <span className={toDate ? "text-gray-800" : "text-gray-400"}>{label(toDate, "Select date")}</span>
          <span className="text-gray-400">📅</span>
        </button>
      </div>

      {showCal &&
        createPortal(
          <div
            id="leave-date-cal-portal"
            className="bg-white border border-gray-200 rounded-xl shadow-2xl p-4 w-[288px]"
            style={{ position: "fixed", top: calPosition.top, left: calPosition.left, zIndex: 99999 }}
            onMouseLeave={() => {
              if (dragStartRef.current) setHover(null)
            }}
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

            <div
              ref={gridRef}
              className="grid grid-cols-7"
              onTouchEnd={() => finishSelection(dragStartRef.current, hoverDayRef.current)}
            >
              {buildDayCells().map((date, i) =>
                !date ? (
                  <div key={`e-${i}`} />
                ) : (
                  <div
                    key={fmt(date)}
                    data-date={fmt(date)}
                    title={isRequested(date) && !isPast(date) ? "Already requested" : undefined}
                    className={getDayClass(date)}
                    onMouseDown={() => {
                      if (isDisabled(date)) return
                      dragStartRef.current = date
                      setDragStart(date)
                      setHover(date)
                    }}
                    onMouseEnter={() => dragStartRef.current && setHover(date)}
                    onTouchStart={(e) => {
                      if (isDisabled(date)) return
                      e.preventDefault()
                      dragStartRef.current = date
                      setDragStart(date)
                      setHover(date)
                    }}
                  >
                    {date.date()}
                  </div>
                ),
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3 text-[10px] text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-50 border border-red-200 inline-block" /> Already requested
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
