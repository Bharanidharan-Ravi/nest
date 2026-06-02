import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { useRef, useEffect, useState, useCallback } from "react";
import {createPortal} from "react-dom";
dayjs.extend(isBetween);

const CAL_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const CAL_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const PRESETS = [
  {
    label: "This Week",
    get: () => [dayjs().startOf("week"), dayjs().startOf("week").add(6, "day")],
  },
  {
    label: "Last Week",
    get: () => [
      dayjs().startOf("week").subtract(7, "day"),
      dayjs().startOf("week").subtract(1, "day"),
    ],
  },
  {
    label: "This Month",
    get: () => [dayjs().startOf("month"), dayjs().endOf("month")],
  },
  { label: "Last 7d", get: () => [dayjs().subtract(6, "day"), dayjs()] },
  { label: "Last 14d", get: () => [dayjs().subtract(13, "day"), dayjs()] },
  { label: "Last 30d", get: () => [dayjs().subtract(29, "day"), dayjs()] },
];

export function WeekRangeFilter({ filter, currentValue, updateQuery }) {
  const [showCal, setShowCal] = useState(false);
  const [calMode, setCalMode] = useState("day"); // "day" | "month" | "year"
  const [month, setMonth] = useState(dayjs());
  const [yearPage, setYearPage] = useState(0);
  const [dragStart, setDragStart] = useState(null);
  const [hoverDay, setHoverDay] = useState(null);
  const [calPosition, setCalPosition] = useState({top:0, left:0});
  const triggerRef = useRef(null);

  const ref = useRef(null);
  const gridRef = useRef(null);
  // ── Ref mirror for dragStart so touch-move handler never goes stale ──────
  const dragStartRef = useRef(null);
  const hoverDayRef = useRef(null);
  const setHover = (d) => {
    hoverDayRef.current = d;
    setHoverDay(d);
  };

  // ── Feature flags ─────────────────────────────────────────────────────────
  const enableDaily = !!filter.enableDailyNav;
  const enableMonthly = !!filter.enableMonthlyNav;
  // "week" → Today resets to this week; anything else → Today resets to today
  const filterDefaultRange = filter.defaultRange;

  // ── Resolve the default value from filter config ──────────────────────────
  function resolveDefault(filterConfig) {
    const dv = filterConfig.defaultValue;
    const range = filterConfig.defaultRange;

    if (!dv) {
      if (range === "week") {
        // No specific date → use current week
        const s = dayjs().startOf("week");
        return `${s.format("YYYY-MM-DD")}~${s.add(6, "day").format("YYYY-MM-DD")}`;
      }
      // Default: today (single day) for daily or unspecified
      const today = dayjs().format("YYYY-MM-DD");
      return `${today}~${today}`;
    }

    // A specific date was provided — parse it
    const fmt = filterConfig.apiDateFormat || "YYYY-MM-DD";
    const date = dayjs(dv, fmt);
    const iso = date.format("YYYY-MM-DD");

    if (range === "week") {
      // Show a 7-day window ending on that date
      const s = date.subtract(6, "day");
      return `${s.format("YYYY-MM-DD")}~${iso}`;
    }

    // Single day (start === end)
    return `${iso}~${iso}`;
  }

  // ── Initialise query string with default on first mount ───────────────────
  useEffect(() => {
    if (!currentValue) {
      updateQuery(filter.key, resolveDefault(filter));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Parse current stored value ────────────────────────────────────────────
  const raw = currentValue || resolveDefault(filter);
  const [startStr, endStr] = raw.split("~");
  const start = dayjs(startStr);
  const end = dayjs(endStr || startStr);

  // ── Outside-click → close calendar ───────────────────────────────────────
  useEffect(() => {
    const close = (e) => {
      if (dragStartRef.current) return;
      const portal = document.getElementById("weekrange-cal-portal");
      if (
        ref.current &&
        !ref.current.contains(e.target) &&
        (!portal || !portal.contains(e.target))
      ) {
        setShowCal(false);
        setCalMode("day");
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close, { passive: true });
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, []);

  // ── Touch-move on calendar grid (passive:false lets us preventDefault) ────
  // We use a ref for dragStart so this effect never needs to re-register.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const onTouchMove = (e) => {
      if (!dragStartRef.current) return;
      // Prevent the page from scrolling while dragging dates
      e.preventDefault();
      const touch = e.touches[0];
      if (!touch) return;
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      if (!el) return;
      const dateStr = el.closest("[data-date]")?.getAttribute("data-date");
      if (dateStr) {
        setHover(dayjs(dateStr));
      }
    };

    grid.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => grid.removeEventListener("touchmove", onTouchMove);
  }, []); // registers once; uses ref, so never stale

  // ── Apply range → write to query string ───────────────────────────────────
  const applyRange = useCallback(
    (s, e, closeCal = true) => {
      updateQuery(
        filter.key,
        `${s.format("YYYY-MM-DD")}~${e.format("YYYY-MM-DD")}`,
      );
      if (closeCal) {
        setShowCal(false);
        setCalMode("day");
      }
      dragStartRef.current = null;
      setDragStart(null);
      setHover(null);
    },
    [filter.key, updateQuery],
  );

  // ── Navigation helpers ────────────────────────────────────────────────────

  // Weekly ‹ / › — always snaps to a clean 7-day window.
  // Preserving an arbitrary span (e.g. 9 days) through week arrows is a
  // production bug: it sends inconsistent date windows to the API and makes
  // the "week" label misleading.
  const shiftWeek = (direction) => {
    // direction: -1 (back) or +1 (forward)
    const ns = start.add(direction * 7, "day");
    applyRange(ns, ns.add(6, "day")); // always exactly 7 days
  };

  // Monthly « / » — always snaps to a full calendar month.
  const shiftMonth = (direction) => {
    const nm = start.add(direction, "month").startOf("month");
    applyRange(nm, nm.endOf("month"));
  };

  // Daily −  →  fromDate (start) moves back 1 day; toDate stays
  const shiftStart = (amount) => {
    const ns = start.add(amount, "day");
    if (ns.isAfter(end, "day")) return; // guard: start can never exceed end
    applyRange(ns, end);
  };

  // Daily +  →  toDate (end) moves forward 1 day; fromDate stays
  const shiftEnd = (amount) => {
    const ne = end.add(amount, "day");
    if (ne.isBefore(start, "day")) return; // guard: end can never precede start
    applyRange(start, ne);
  };

  // Today reset — respects the filter's defaultRange:
  //   "week"  → reset to this Mon–Sun
  //   else    → reset to today (single day, from === to)
  const handleToday = () => {
    if (filterDefaultRange === "week") {
      applyRange(
        dayjs().startOf("week"),
        dayjs().startOf("week").add(6, "day"),
      );
    } else {
      const today = dayjs();
      applyRange(today, today);
    }
  };

  // ── Is the current range already on the "default today" state? ────────────
  const isOnDefault =
    filterDefaultRange === "week"
      ? start.isSame(dayjs().startOf("week"), "day") &&
        end.isSame(dayjs().startOf("week").add(6, "day"), "day")
      : start.isSame(dayjs(), "day") && end.isSame(dayjs(), "day");

  // ── Preset active detection ───────────────────────────────────────────────
  const isPresetActive = (s, e) =>
    start.isSame(s, "day") && end.isSame(e, "day");

  // ── Drag / hover preview ──────────────────────────────────────────────────
  const previewStart =
    dragStart && hoverDay
      ? dragStart.isBefore(hoverDay, "day")
        ? dragStart
        : hoverDay
      : start;
  const previewEnd =
    dragStart && hoverDay
      ? dragStart.isBefore(hoverDay, "day")
        ? hoverDay
        : dragStart
      : end;

  const getDayClass = (d) => {
    const isS = d.isSame(previewStart, "day");
    const isE = d.isSame(previewEnd, "day");
    const inR = d.isBetween(previewStart, previewEnd, "day", "()");
    const isT = d.isSame(dayjs(), "day");
    return [
      // touch-none prevents iOS from hijacking touch before our handlers fire
      "h-8 w-full flex items-center justify-center text-xs cursor-pointer select-none transition-colors touch-none",
      isS || isE ? "bg-blue-500 text-white" : "",
      isS ? "rounded-l-full" : "",
      isE ? "rounded-r-full" : "",
      inR ? "bg-blue-100 text-blue-700" : "",
      !isS && !isE && !inR
        ? "hover:bg-gray-100 active:bg-gray-200 rounded-full text-gray-700"
        : "",
      isT && !isS && !isE ? "font-bold underline underline-offset-2" : "",
    ]
      .filter(Boolean)
      .join(" ");
  };

  const buildDayCells = () => {
    const cells = [];
    const offset = month.startOf("month").day();
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= month.daysInMonth(); d++) cells.push(month.date(d));
    return cells;
  };

  // ── Shared drag-finish logic (mouse + touch) ──────────────────────────────
  const finishDrag = useCallback(
    (ds, hd) => {
      if (ds && hd) {
        const s = ds.isBefore(hd, "day") ? ds : hd;
        const e = ds.isBefore(hd, "day") ? hd : ds;
        applyRange(s, e);
      } else if (ds) {
        // Single tap / click with no drag → set both dates to the tapped day
        applyRange(ds, ds);
      }
    },
    [applyRange],
  );

  useEffect(()=>{
   const onMouseUp = ()=>{
    if (!dragStartRef.current) return;
    const ds = dragStartRef.current;
    const hd = hoverDayRef.current;
    const isDrag = ds && hd && !ds.isSame(hd, "day");
    if (isDrag) {
      const s = ds.isBefore(hd, "day") ? ds : hd;
      const e = ds.isBefore(hd, "day") ? hd : ds;
      applyRange(s, e, false);
    } else if (ds) {
      applyRange(ds, ds, true);
    }
   };
   document.addEventListener("mouseup", onMouseUp);
   return ()=> document.removeEventListener("mouseup", onMouseUp);
  }, [applyRange]);

  // ── Dynamic reset-button label (short enough to fit the pill) ────────────
  // "Week" for week mode, "Today" for daily/unset — both fit in ~32px width.
  const resetLabel = filterDefaultRange === "week" ? "Week" : "Today";
  const yearBase = dayjs().year() - 4 + yearPage * 12;
  const yearRange = Array.from({ length: 12 }, (_, i) => yearBase + i);

  // ── Label ─────────────────────────────────────────────────────────────────
  const isSingleDay = start.isSame(end, "day");
  const label = isSingleDay
    ? start.format("DD MMM YYYY")
    : `${start.format("DD MMM")} – ${end.format("DD MMM")}`;

  return (
    <div className="relative" ref={ref}>
      {/* ── Navigation Pill ───────────────────────────────────────────── */}
      <div className="flex items-center border border-gray-300 rounded-md bg-white h-[32px] overflow-hidden divide-x divide-gray-200">

        {enableMonthly && (
          <button onClick={() => shiftMonth(-1)} title="Previous month" className="px-2 h-full flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 text-gray-400 transition-colors text-[11px] font-bold">
            <span className="leading-none pb-[2px]">«</span>
          </button>
        )}

        <button onClick={() => shiftWeek(-1)} title="Previous week" className="px-2.5 h-full flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 text-gray-500 transition-colors text-[12px]">
          <span className="leading-none pb-[2px]">‹</span>
        </button>

        {enableDaily && (
          <button onClick={() => shiftStart(-1)} title="Decrease from-date by 1 day" className="px-2 h-full flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 text-gray-500 transition-colors text-[12px]">
            <span className="leading-none pb-[2px]">−</span>
          </button>
        )}

        <button
          ref = {triggerRef}
          onClick={() => { if (!showCal) {
            const rect = triggerRef.current?.getBoundingClientRect();
            if (rect) {
              setCalPosition({
                top: rect.bottom + 4,
                left: Math.min(rect.left, window.innerWidth - 296),
              });
            }
          }
          setShowCal((v)=> !v);
          setMonth(start);
          setCalMode("day");
        }}
          className="px-3 h-full flex items-center justify-center text-[11px] font-bold text-gray-600 uppercase tracking-tight min-w-[144px] hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          {label}
        </button>

        {enableDaily && (
          <button onClick={() => shiftEnd(1)} title="Increase to-date by 1 day" className="px-2 h-full flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 text-gray-500 transition-colors text-[12px]">
            <span className="leading-none pb-[1px]">+</span>
          </button>
        )}

        <button onClick={() => shiftWeek(1)} title="Next week" className="px-2.5 h-full flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 text-gray-500 transition-colors text-[12px]">
          <span className="leading-none pb-[2px]">›</span>
        </button>

        {enableMonthly && (
          <button onClick={() => shiftMonth(1)} title="Next month" className="px-2 h-full flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 text-gray-400 transition-colors text-[11px] font-bold">
            <span className="leading-none pb-[2px]">»</span>
          </button>
        )}

        {!isOnDefault && (
          <button onClick={handleToday} className="px-3 h-full flex items-center justify-center text-[10px] font-semibold text-blue-500 hover:bg-blue-50 active:bg-blue-100 transition-colors whitespace-nowrap">
            {resetLabel}
          </button>
        )}
      </div>
      {/* ── Calendar Popup ────────────────────────────────────────────── */}
      {showCal && createPortal(
        <div
          className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 p-4 w-[288px]"
          style={{
            position: "fixed",
            top:calPosition.top,
            left:calPosition.left,
            zIndex:99999,
          }}
          onMouseLeave={() => {
            // Cancel hover preview when mouse leaves the calendar
            if (dragStartRef.current) setHover(null);
          }}
        >
          {/* ── Header: month / year navigation + mode switcher ── */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => {
                if (calMode === "year") setYearPage((p) => p - 1);
                else if (calMode === "month")
                  setMonth((m) => m.subtract(1, "year"));
                else setMonth((m) => m.subtract(1, "month"));
              }}
              className="p-1.5 hover:bg-gray-100 active:bg-gray-200 rounded-md text-gray-500 text-xs"
            >
              ◁
            </button>

            <div className="flex items-center gap-1">
              {calMode === "year" ? (
                <span className="text-sm font-semibold text-gray-700">
                  {yearRange[0]} – {yearRange[11]}
                </span>
              ) : (
                <>
                  <button
                    onClick={() =>
                      setCalMode(calMode === "month" ? "day" : "month")
                    }
                    className={`text-sm font-semibold px-1.5 py-0.5 rounded transition-colors
                      ${
                        calMode === "month"
                          ? "bg-blue-500 text-white"
                          : "text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                      }`}
                  >
                    {month.format("MMMM")}
                  </button>
                  <button
                    onClick={() =>
                      setCalMode(calMode === "year" ? "day" : "year")
                    }
                    className={`text-sm font-semibold px-1.5 py-0.5 rounded transition-colors
                      ${
                        calMode === "year"
                          ? "bg-blue-500 text-white"
                          : "text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                      }`}
                  >
                    {month.format("YYYY")}
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => {
                if (calMode === "year") setYearPage((p) => p + 1);
                else if (calMode === "month")
                  setMonth((m) => m.add(1, "year"));
                else setMonth((m) => m.add(1, "month"));
              }}
              className="p-1.5 hover:bg-gray-100 active:bg-gray-200 rounded-md text-gray-500 text-xs"
            >
              ▷
            </button>
          </div>

          {/* ── YEAR grid ── */}
          {calMode === "year" && (
            <div className="grid grid-cols-4 gap-1">
              {yearRange.map((y) => (
                <button
                  key={y}
                  onClick={() => {
                    setMonth((m) => m.year(y));
                    setCalMode("month");
                  }}
                  className={`py-1.5 text-xs rounded-md transition-colors font-medium
                    ${
                      month.year() === y
                        ? "bg-blue-500 text-white"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                >
                  {y}
                </button>
              ))}
            </div>
          )}

          {/* ── MONTH grid ── */}
          {calMode === "month" && (
            <div className="grid grid-cols-3 gap-1">
              {CAL_MONTHS.map((m, i) => (
                <button
                  key={m}
                  onClick={() => {
                    setMonth((prev) => prev.month(i));
                    setCalMode("day");
                  }}
                  className={`py-2 text-xs rounded-md transition-colors font-medium
                    ${
                      month.month() === i
                        ? "bg-blue-500 text-white"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                >
                  {m}
                </button>
              ))}
            </div>
          )}

          {/* ── DAY grid ──────────────────────────────────────────────────────
              Mouse drag:  mousedown (start) → mousemove across cells → mouseup (finish)
              Touch drag:  touchstart (start) → touchmove handled via useEffect with
                           passive:false → touchend (finish)
              Single tap:  touchstart + touchend on same cell → sets from===to
          */}
          {calMode === "day" && (
            <>
              {/* Day-of-week headers */}
              <div className="grid grid-cols-7 mb-1">
                {CAL_DAYS.map((d) => (
                  <div
                    key={d}
                    className="text-center text-[10px] font-semibold text-gray-400"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells grid */}
              <div
                ref={gridRef}
                className="grid grid-cols-7"
                /* ── Mouse: finish drag on mouseup anywhere in grid ── */
                // onMouseUp={() => {
                //   finishDrag(dragStart, hoverDay);
                // }}
                /* ── Touch: finish drag on touchend anywhere in grid ── */
                onTouchEnd={() => {
                  finishDrag(dragStartRef.current, hoverDay);
                }}
              >
                {buildDayCells().map((date, i) =>
                  !date ? (
                    <div key={`e-${i}`} />
                  ) : (
                    <div
                      key={date.format("YYYY-MM-DD")}
                      // data-date is read by the touchmove handler via elementFromPoint
                      data-date={date.format("YYYY-MM-DD")}
                      className={getDayClass(date)}
                      /* ── Mouse events ── */
                      onMouseDown={() => {
                        dragStartRef.current = date;
                        setDragStart(date);
                        // setHoverDay(date);
                        setHover(date);
                      }}
                      // onMouseEnter={() => dragStart && setHoverDay(date)}
                      onMouseEnter={() => dragStartRef.current && setHover (date)}
                      /* ── Touch events ──
                         onTouchStart fires per-cell (where the finger lands).
                         onTouchMove is registered via useEffect with passive:false
                         so we can call preventDefault() and block page scroll.
                         onTouchEnd bubbles up to the grid container above.
                      */
                      onTouchStart={(e) => {
                        // Prevent 300ms click delay and page scroll on drag start
                        e.preventDefault();
                        dragStartRef.current = date;
                        setDragStart(date);
                        // setHoverDay(date);
                        setHover(date);
                      }}
                    >
                      {date.date()}
                    </div>
                  ),
                )}
              </div>
            </>
          )}

          {/* ── Presets ── */}
          <div className="grid grid-cols-3 gap-1.5 mt-3 pt-3 border-t border-gray-100">
            {PRESETS.map((p) => {
              const [s, e] = p.get();
              const active = isPresetActive(s, e);
              return (
                <button
                  key={p.label}
                  onClick={() => applyRange(s, e)}
                  className={`text-[10px] py-1.5 border rounded-md font-medium transition-colors
                    ${
                      active
                        ? "bg-blue-500 border-blue-500 text-white"
                        : "border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
                    }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}



{/* <div className="flex items-center border border-gray-300 rounded-md bg-white h-[32px] overflow-hidden divide-x divide-gray-200">

  
        {enableMonthly && (
          <button
            onClick={() => shiftMonth(-1)}
            title="Previous month"
            className="px-2 h-full hover:bg-gray-100 active:bg-gray-200 text-gray-400 transition-colors text-[11px] font-bold"
          >
            «
          </button>
        )}

        <button
          onClick={() => shiftWeek(-1)}
          title="Previous week"
          className="px-2.5 h-full hover:bg-gray-100 active:bg-gray-200 text-gray-500 transition-colors text-[11px]"
        >
          ‹
        </button>
        {enableDaily && (
          <button
            onClick={() => shiftStart(-1)}
            title="Decrease from-date by 1 day"
            className="px-2 h-full hover:bg-gray-100 active:bg-gray-200 text-gray-500 transition-colors text-[10px]"
          >
            −
          </button>
        )}
        <button
          onClick={() => {
            setShowCal((v) => !v);
            setMonth(start);
            setCalMode("day");
          }}
          className="px-3 h-full text-[11px] font-bold text-gray-600 uppercase tracking-tight min-w-[144px] text-center hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          {label}
        </button>
        {enableDaily && (
          <button
            onClick={() => shiftEnd(1)}
            title="Increase to-date by 1 day"
            className="px-2 h-full hover:bg-gray-100 active:bg-gray-200 text-gray-500 transition-colors text-[10px]"
          >
            +
          </button>
        )}
        <button
          onClick={() => shiftWeek(1)}
          title="Next week"
          className="px-2.5 h-full hover:bg-gray-100 active:bg-gray-200 text-gray-500 transition-colors text-[11px]"
        >
          ›
        </button>
        {enableMonthly && (
          <button
            onClick={() => shiftMonth(1)}
            title="Next month"
            className="px-2 h-full hover:bg-gray-100 active:bg-gray-200 text-gray-400 transition-colors text-[11px] font-bold"
          >
            »
          </button>
        )}
        {!isOnDefault && (
          <button
            onClick={handleToday}
            className="px-2 h-full text-[10px] font-semibold text-blue-500 hover:bg-blue-50 active:bg-blue-100 transition-colors whitespace-nowrap"
          >
            {resetLabel}
          </button>
        )}
      </div> */}