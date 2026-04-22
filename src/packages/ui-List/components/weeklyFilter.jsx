import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { useRef } from "react";
import { useEffect } from "react";
import { useState } from "react";
dayjs.extend(isBetween);

const CAL_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const CAL_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
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
  const ref = useRef(null);
  function resolveDefault(filterConfig) {
    const dv = filterConfig.defaultValue;
    if (!dv) {
      // fallback: this week
      const s = dayjs().startOf("week");
      return `${s.format("YYYY-MM-DD")}~${s.add(6, "day").format("YYYY-MM-DD")}`;
    }

    // Single date like "04-22-2026" — parse using apiDateFormat
    const fmt = filterConfig.apiDateFormat || "YYYY-MM-DD";
    const date = dayjs(dv, fmt);
    const iso = date.format("YYYY-MM-DD");
console.log("filterConfig.defaultRange :", filterConfig.defaultRange);

    if (filterConfig.defaultRange === "week") {
      // Show last 7 days from that date
      const s = date.subtract(6, "day");
      return `${s.format("YYYY-MM-DD")}~${iso}`;
    }

    // Single day (start === end)
    return `${iso}~${iso}`;
  }
  useEffect(() => {
    if (!currentValue) {
      updateQuery(filter.key, resolveDefault(filter));
    }
  }, []); // runs once on mount
  const defaultRange = resolveDefault(filter);
  // Parse current stored value (or fall back to default)
  const raw = currentValue || resolveDefault(filter);
  const isOnDefault = raw === defaultRange;
  const [startStr, endStr] = raw.split("~");
  const start = dayjs(startStr);
  const end = dayjs(endStr || startStr);
  // ── Feature flags from config ─────────────────────────────────────────────
  const enableDaily = !!filter.enableDailyNav;
  const enableMonthly = !!filter.enableMonthlyNav;

  // ── Outside click ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fn = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setShowCal(false);
        setCalMode("day");
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // ── Apply range → write to query string ───────────────────────────────────
  const applyRange = (s, e) => {
    updateQuery(
      filter.key,
      `${s.format("YYYY-MM-DD")}~${e.format("YYYY-MM-DD")}`,
    );
    setShowCal(false);
    setDragStart(null);
    setHoverDay(null);
    setCalMode("day");
  };

  // ── Shift — preserves the current span ────────────────────────────────────
  //   const shift = (amount, unit) => {
  //     const span = end.diff(start, "day");
  //     const ns   = start.add(amount, unit);
  //     applyRange(ns, ns.add(span, "day"));
  //   };
  // Moves BOTH start + end (weekly / monthly nav)
  const shiftBoth = (amount, unit) => {
    const span = end.diff(start, "day");
    const ns = start.add(amount, unit);
    applyRange(ns, ns.add(span, "day"));
  };

  // Daily + and − — only ToDate moves, FromDate stays fixed
  const shiftEnd = (amount) => {
    const ne = end.add(amount, "day");
    if (ne.isBefore(start, "day")) return; // guard: can't go before start
    applyRange(start, ne);
  };
  // ── Preset active detection ───────────────────────────────────────────────
  const isPresetActive = (s, e) =>
    start.isSame(s, "day") && end.isSame(e, "day");

  // ── Drag preview ──────────────────────────────────────────────────────────
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
      "h-8 w-full flex items-center justify-center text-xs cursor-pointer select-none transition-colors",
      isS || isE ? "bg-blue-500 text-white" : "",
      isS ? "rounded-l-full" : "",
      isE ? "rounded-r-full" : "",
      inR ? "bg-blue-100 text-blue-700" : "",
      !isS && !isE && !inR
        ? "hover:bg-gray-100 rounded-full text-gray-700"
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

  // 12 years per page, centred on today
  const yearBase = dayjs().year() - 4 + yearPage * 12;
  const yearRange = Array.from({ length: 12 }, (_, i) => yearBase + i);

  const isThisWeek =
    start.isSame(dayjs().startOf("week"), "day") &&
    end.diff(start, "day") === 6;
  const isSingleDay = start.isSame(end, "day");
  const label = isSingleDay
    ? start.format("DD MMM YYYY")
    : `${start.format("DD MMM")} – ${end.format("DD MMM")}`;

  return (
    <div className="relative" ref={ref}>
      {/* ── Navigation Pill ───────────────────────────────────────────── */}
      <div className="flex items-center border border-gray-300 rounded-md bg-white h-[32px] overflow-hidden divide-x divide-gray-200">
        {/* Monthly « — shifts both */}
        {enableMonthly && (
          <button
            onClick={() => shiftBoth(-1, "month")}
            title="Previous month"
            className="px-2 h-full hover:bg-gray-100 text-gray-400 transition-colors text-[11px] font-bold"
          >
            «
          </button>
        )}

        {/* Weekly ‹ — shifts both */}
        <button
          onClick={() => shiftBoth(-7, "day")}
          title="Previous week"
          className="px-2.5 h-full hover:bg-gray-100 text-gray-500 transition-colors text-[11px]"
        >
          ‹
        </button>

        {/* Daily − → moves FROM date back by 1 */}
        {enableDaily && (
          <button
            onClick={() => shiftEnd(-1)}
            title="Decrease to-date"
            className="px-2 h-full hover:bg-gray-100 text-gray-500 transition-colors text-[10px]"
          >
            −
          </button>
        )}

        {/* Label */}
        <button
          onClick={() => {
            setShowCal((v) => !v);
            setMonth(start);
            setCalMode("day");
          }}
          className="px-3 h-full text-[11px] font-bold text-gray-600 uppercase tracking-tight min-w-[144px] text-center hover:bg-gray-50 transition-colors"
        >
          {label}
        </button>

        {/* Daily + → moves TO date forward by 1 */}
        {enableDaily && (
          <button
            onClick={() => shiftEnd(1)}
            title="Increase to-date"
            className="px-2 h-full hover:bg-gray-100 text-gray-500 transition-colors text-[10px]"
          >
            +
          </button>
        )}

        {/* Weekly › — shifts both */}
        <button
          onClick={() => shiftBoth(7, "day")}
          title="Next week"
          className="px-2.5 h-full hover:bg-gray-100 text-gray-500 transition-colors text-[11px]"
        >
          ›
        </button>

        {/* Monthly » — shifts both */}
        {enableMonthly && (
          <button
            onClick={() => shiftBoth(1, "month")}
            title="Next month"
            className="px-2 h-full hover:bg-gray-100 text-gray-400 transition-colors text-[11px] font-bold"
          >
            »
          </button>
        )}

        {/* Monthly ‹‹ */}
        {/* {enableMonthly && (
          <button
            onClick={() => shift(-1, "month")}
            title="Previous month"
            className="px-2 h-full hover:bg-gray-100 text-gray-400 transition-colors text-[11px] font-bold"
          >
            «
          </button>
        )}

        <button
          onClick={() => shift(-7, "day")}
          title="Previous week"
          className="px-2.5 h-full hover:bg-gray-100 text-gray-500 transition-colors text-[11px]"
        >
          ‹
        </button>

        {enableDaily && (
          <button
            onClick={() => shift(-1, "day")}
            title="Previous day"
            className="px-2 h-full hover:bg-gray-100 text-gray-500 transition-colors text-[10px]"
          >
            −
          </button>
        )} */}

        {/* Label */}
        {/* <button
          onClick={() => {
            setShowCal((v) => !v);
            setMonth(start);
            setCalMode("day");
          }}
          className="px-3 h-full text-[11px] font-bold text-gray-600 uppercase tracking-tight min-w-[144px] text-center hover:bg-gray-50 transition-colors"
        >
          {label}
        </button> */}

        {/* Daily + */}
        {/* {enableDaily && (
          <button
            onClick={() => shift(1, "day")}
            title="Next day"
            className="px-2 h-full hover:bg-gray-100 text-gray-500 transition-colors text-[10px]"
          >
            +
          </button>
        )}

        <button
          onClick={() => shift(7, "day")}
          title="Next week"
          className="px-2.5 h-full hover:bg-gray-100 text-gray-500 transition-colors text-[11px]"
        >
          ›
        </button>

        {enableMonthly && (
          <button
            onClick={() => shift(1, "month")}
            title="Next month"
            className="px-2 h-full hover:bg-gray-100 text-gray-400 transition-colors text-[11px] font-bold"
          >
            »
          </button>
        )} */}

        {/* Today reset */}
        {!isThisWeek && (
          <button
            onClick={() =>
              applyRange(
                dayjs().startOf("week"),
                dayjs().startOf("week").add(6, "day"),
              )
            }
            className="px-2 h-full text-[10px] font-semibold text-blue-500 hover:bg-blue-50 transition-colors"
          >
            Today
          </button>
        )}
      </div>

      {/* ── Calendar Popup ────────────────────────────────────────────── */}
      {showCal && (
        <div
          className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 p-4 w-[288px]"
          onMouseLeave={() => {
            if (dragStart) setHoverDay(null);
          }}
        >
          {/* Header — month nav / year nav / mode switcher */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => {
                if (calMode === "year") setYearPage((p) => p - 1);
                else if (calMode === "month")
                  setMonth((m) => m.subtract(1, "year"));
                else setMonth((m) => m.subtract(1, "month"));
              }}
              className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 text-xs"
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
                  {/* Click month name → month picker */}
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
                  {/* Click year → year picker */}
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
                else if (calMode === "month") setMonth((m) => m.add(1, "year"));
                else setMonth((m) => m.add(1, "month"));
              }}
              className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 text-xs"
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

          {/* ── DAY grid (drag-to-select) ── */}
          {calMode === "day" && (
            <>
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
              <div
                className="grid grid-cols-7"
                onMouseUp={() => {
                  if (dragStart && hoverDay) {
                    const s = dragStart.isBefore(hoverDay, "day")
                      ? dragStart
                      : hoverDay;
                    const e = dragStart.isBefore(hoverDay, "day")
                      ? hoverDay
                      : dragStart;
                    applyRange(s, e);
                  }
                  setDragStart(null);
                }}
              >
                {buildDayCells().map((date, i) =>
                  !date ? (
                    <div key={`e-${i}`} />
                  ) : (
                    <div
                      key={date.format("YYYY-MM-DD")}
                      className={getDayClass(date)}
                      onMouseDown={() => {
                        setDragStart(date);
                        setHoverDay(date);
                      }}
                      onMouseEnter={() => dragStart && setHoverDay(date)}
                    >
                      {date.date()}
                    </div>
                  ),
                )}
              </div>
            </>
          )}

          {/* ── Presets (highlighted when active) ── */}
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
        </div>
      )}
    </div>
  );
}
