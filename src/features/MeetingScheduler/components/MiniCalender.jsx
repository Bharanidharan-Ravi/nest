



// import dayjs from "dayjs";
// import isBetween from "dayjs/plugin/isBetween";
// import { useRef, useEffect, useState, useCallback } from "react";

// dayjs.extend(isBetween);

// const CAL_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
// const CAL_MONTHS = [
//   "Jan", "Feb", "Mar", "Apr", "May", "Jun",
//   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
// ];

// const PRESETS = [
//   {
//     label: "This Week",
//     get: () => [dayjs().startOf("week"), dayjs().startOf("week").add(6, "day")],
//   },
//   {
//     label: "Last Week",
//     get: () => [
//       dayjs().startOf("week").subtract(7, "day"),
//       dayjs().startOf("week").subtract(1, "day"),
//     ],
//   },
//   {
//     label: "This Month",
//     get: () => [dayjs().startOf("month"), dayjs().endOf("month")],
//   },
//   { label: "Last 7d", get: () => [dayjs().subtract(6, "day"), dayjs()] },
//   { label: "Last 14d", get: () => [dayjs().subtract(13, "day"), dayjs()] },
//   { label: "Last 30d", get: () => [dayjs().subtract(29, "day"), dayjs()] },
// ];

// export function MiniCalendar({
//   datesWithMeetings = [],
//   filter,
//   currentValue,
//   updateQuery,
// }) {
//   const [calMode, setCalMode] = useState("day");
//   const [month, setMonth] = useState(dayjs());
//   const [yearPage, setYearPage] = useState(0);
//   const [dragStart, setDragStart] = useState(null);
//   const [hoverDay, setHoverDay] = useState(null);

//   const gridRef = useRef(null);
//   const dragStartRef = useRef(null);
//   const hoverDayRef = useRef(null);

//   const setHover = (d) => {
//     hoverDayRef.current = d;
//     setHoverDay(d);
//   };

//   const filterDefaultRange = filter?.defaultRange;

//   function resolveDefault(filterConfig) {
//     const dv = filterConfig?.defaultValue;
//     const range = filterConfig?.defaultRange;

//     if (!dv) {
//       if (range === "week") {
//         const s = dayjs().startOf("week");
//         return `${s.format("YYYY-MM-DD")}~${s.add(6, "day").format("YYYY-MM-DD")}`;
//       }
//       const today = dayjs().format("YYYY-MM-DD");
//       return `${today}~${today}`;
//     }

//     const fmt = filterConfig.apiDateFormat || "YYYY-MM-DD";
//     const date = dayjs(dv, fmt);
//     const iso = date.format("YYYY-MM-DD");

//     if (range === "week") {
//       const s = date.subtract(6, "day");
//       return `${s.format("YYYY-MM-DD")}~${iso}`;
//     }

//     return `${iso}~${iso}`;
//   }

//   useEffect(() => {
//     if (!currentValue) {
//       updateQuery(filter?.key, resolveDefault(filter));
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const raw = currentValue || resolveDefault(filter);
//   const [startStr, endStr] = raw.split("~");
//   const start = dayjs(startStr);
//   const end = dayjs(endStr || startStr);

//   useEffect(() => {
//     const onTouchMove = (e) => {
//       if (!dragStartRef.current) return;
//       e.preventDefault();
//       const touch = e.touches[0];
//       if (!touch) return;

//       const el = document.elementFromPoint(touch.clientX, touch.clientY);
//       if (!el) return;

//       const dateStr = el.closest("[data-date]")?.getAttribute("data-date");
//       if (dateStr) setHover(dayjs(dateStr));
//     };

//     const grid = gridRef.current;
//     if (!grid) return;

//     grid.addEventListener("touchmove", onTouchMove, { passive: false });
//     return () => grid.removeEventListener("touchmove", onTouchMove);
//   }, []);

//   const applyRange = useCallback(
//     (s, e) => {
//       updateQuery(filter?.key, `${s.format("YYYY-MM-DD")}~${e.format("YYYY-MM-DD")}`);
//       dragStartRef.current = null;
//       setDragStart(null);
//       setHover(null);
//     },
//     [filter?.key, updateQuery],
//   );

//   const isDateWithMeeting = (d) =>
//     datesWithMeetings.some((item) =>
//       dayjs(item).isSame(d, "day")
//     );
//   const getDayClass = (d) => {
//     const isS = d.isSame(previewStart, "day");
//     const isE = d.isSame(previewEnd, "day");
//     const inR = d.isBetween(previewStart, previewEnd, "day", "()");
//     const isT = d.isSame(dayjs(), "day");
//     const hasMeeting = isDateWithMeeting(d);
//     return [
//       "relative h-8 w-full flex items-center justify-center text-xs cursor-pointer select-none transition-colors touch-none rounded-md",
//       isS || isE ? "bg-amber-500 text-white" : "",
//       inR ? "bg-amber-100 text-amber-800" : "",
//       !isS && !isE && !inR ? "hover:bg-gray-100 active:bg-gray-200 text-gray-700" : "",
//       isT && !isS && !isE ? "font-bold underline underline-offset-2" : "",
//       hasMeeting ? "ring-1 ring-amber-400 font-bold" : "",
//     ]
//       .filter(Boolean)
//       .join(" ");
//   };

//   const buildDayCells = () => {
//     const cells = [];
//     const offset = month.startOf("month").day();
//     for (let i = 0; i < offset; i++) cells.push(null);
//     for (let d = 1; d <= month.daysInMonth(); d++) cells.push(month.date(d));
//     return cells;
//   };

//   const previewStart =
//     dragStart && hoverDay
//       ? dragStart.isBefore(hoverDay, "day")
//         ? dragStart
//         : hoverDay
//       : start;

//   const previewEnd =
//     dragStart && hoverDay
//       ? dragStart.isBefore(hoverDay, "day")
//         ? hoverDay
//         : dragStart
//       : end;

//   const finishDrag = useCallback(
//     (ds, hd) => {
//       if (ds && hd) {
//         const s = ds.isBefore(hd, "day") ? ds : hd;
//         const e = ds.isBefore(hd, "day") ? hd : ds;
//         applyRange(s, e);
//       } else if (ds) {
//         applyRange(ds, ds);
//       }
//     },
//     [applyRange],
//   );

//   useEffect(() => {
//     const onMouseUp = () => {
//       if (!dragStartRef.current) return;
//       const ds = dragStartRef.current;
//       const hd = hoverDayRef.current;
//       const isDrag = ds && hd && !ds.isSame(hd, "day");

//       if (isDrag) {
//         const s = ds.isBefore(hd, "day") ? ds : hd;
//         const e = ds.isBefore(hd, "day") ? hd : ds;
//         applyRange(s, e);
//       } else if (ds) {
//         applyRange(ds, ds);
//       }
//     };

//     document.addEventListener("mouseup", onMouseUp);
//     return () => document.removeEventListener("mouseup", onMouseUp);
//   }, [applyRange]);

//   const yearBase = dayjs().year() - 4 + yearPage * 12;
//   const yearRange = Array.from({ length: 12 }, (_, i) => yearBase + i);

//   return (
//     <div className="w-full">
//       <div className="bg-white  p-4 w-full">
//         <div className="flex items-center justify-between mb-3">
//           <button
//             onClick={() => {
//               if (calMode === "year") setYearPage((p) => p - 1);
//               else if (calMode === "month") setMonth((m) => m.subtract(1, "year"));
//               else setMonth((m) => m.subtract(1, "month"));
//             }}
//             className="p-1.5 hover:bg-gray-100 active:bg-gray-200 rounded-md text-gray-500 text-xs"
//           >
//             ◁
//           </button>

//           <div className="flex items-center gap-1">
//             {calMode === "year" ? (
//               <span className="text-sm font-semibold text-gray-700">
//                 {yearRange[0]} – {yearRange[11]}
//               </span>
//             ) : (
//               <>
//                 <button
//                   onClick={() => setCalMode(calMode === "month" ? "day" : "month")}
//                   className={`text-sm font-semibold px-1.5 py-0.5 rounded transition-colors
//                     ${calMode === "month"
//                       ? "bg-amber-500 text-white"
//                       : "text-gray-700 hover:text-amber-600 hover:bg-gray-100"
//                     }`}
//                 >
//                   {month.format("MMMM")}
//                 </button>
//                 <button
//                   onClick={() => setCalMode(calMode === "year" ? "day" : "year")}
//                   className={`text-sm font-semibold px-1.5 py-0.5 rounded transition-colors
//                     ${calMode === "year"
//                       ? "bg-amber-500 text-white"
//                       : "text-gray-700 hover:text-amber-600 hover:bg-gray-100"
//                     }`}
//                 >
//                   {month.format("YYYY")}
//                 </button>
//               </>
//             )}
//           </div>

//           <button
//             onClick={() => {
//               if (calMode === "year") setYearPage((p) => p + 1);
//               else if (calMode === "month") setMonth((m) => m.add(1, "year"));
//               else setMonth((m) => m.add(1, "month"));
//             }}
//             className="p-1.5 hover:bg-gray-100 active:bg-gray-200 rounded-md text-gray-500 text-xs"
//           >
//             ▷
//           </button>
//         </div>

//         {calMode === "year" && (
//           <div className="grid grid-cols-4 gap-1">
//             {yearRange.map((y) => (
//               <button
//                 key={y}
//                 onClick={() => {
//                   setMonth((m) => m.year(y));
//                   setCalMode("month");
//                 }}
//                 className={`py-1.5 text-xs rounded-md transition-colors font-medium
//                   ${month.year() === y
//                     ? "bg-amber-500 text-white"
//                     : "hover:bg-gray-100 text-gray-700"
//                   }`}
//               >
//                 {y}
//               </button>
//             ))}
//           </div>
//         )}

//         {calMode === "month" && (
//           <div className="grid grid-cols-3 gap-1">
//             {CAL_MONTHS.map((m, i) => (
//               <button
//                 key={m}
//                 onClick={() => {
//                   setMonth((prev) => prev.month(i));
//                   setCalMode("day");
//                 }}
//                 className={`py-2 text-xs rounded-md transition-colors font-medium
//                   ${month.month() === i
//                     ? "bg-amber-500 text-white"
//                     : "hover:bg-gray-100 text-gray-700"
//                   }`}
//               >
//                 {m}
//               </button>
//             ))}
//           </div>
//         )}

//         {calMode === "day" && (
//           <>
//             <div className="grid grid-cols-7 mb-1">
//               {CAL_DAYS.map((d) => (
//                 <div
//                   key={d}
//                   className="text-center text-[10px] font-semibold text-gray-400"
//                 >
//                   {d}
//                 </div>
//               ))}
//             </div>

//             <div
//               ref={gridRef}
//               className="grid grid-cols-7 gap-1"
//               onTouchEnd={() => finishDrag(dragStartRef.current, hoverDay)}
//             >
//               {buildDayCells().map((date, i) =>
//                 !date ? (
//                   <div key={`e-${i}`} />
//                 ) : (
//                   <div
//                     key={date.format("YYYY-MM-DD")}
//                     data-date={date.format("YYYY-MM-DD")}
//                     className={getDayClass(date)}
//                     onMouseDown={() => {
//                       dragStartRef.current = date;
//                       setDragStart(date);
//                       setHover(date);
//                     }}
//                     onMouseEnter={() => dragStartRef.current && setHover(date)}
//                     onTouchStart={(e) => {
//                       e.preventDefault();
//                       dragStartRef.current = date;
//                       setDragStart(date);
//                       setHover(date);
//                     }}
//                   >
//                     {date.date()}
//                   </div>
//                 ),
//               )}
//             </div>
//           </>
//         )}

//         <div className="grid grid-cols-3 gap-1.5 mt-3 pt-3 border-t border-gray-100">
//           {PRESETS.map((p) => {
//             const [s, e] = p.get();
//             const active = start.isSame(s, "day") && end.isSame(e, "day");
//             return (
//               <button
//                 key={p.label}
//                 onClick={() => applyRange(s, e)}
//                 className={`text-[10px] py-1.5 border rounded-md font-medium transition-colors
//                   ${active
//                     ? "bg-amber-500 border-amber-500 text-white"
//                     : "border-gray-200 text-gray-600 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700"
//                   }`}
//               >
//                 {p.label}
//               </button>
//             );
//           })}
//         </div>
//       </div>
//     </div>
//   );
// }






import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { useRef, useEffect, useState, useCallback } from "react";
import { ListFilters } from "../../../packages/ui-List/components/ListFilters";

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

export function MiniCalendar({
  datesWithMeetings = [],
  filter,
  currentValue,
  updateQuery,
}) {
  console.log("filter", filter);

  const [calMode, setCalMode] = useState("day");
  const [month, setMonth] = useState(dayjs());
  const [yearPage, setYearPage] = useState(0);
  const [dragStart, setDragStart] = useState(null);
  const [hoverDay, setHoverDay] = useState(null);

  const gridRef = useRef(null);
  const dragStartRef = useRef(null);
  const hoverDayRef = useRef(null);

  const setHover = (d) => {
    hoverDayRef.current = d;
    setHoverDay(d);
  };

  const filterDefaultRange = filter?.defaultRange;

  function resolveDefault(filterConfig) {
    const dv = filterConfig?.defaultValue;
    const range = filterConfig?.defaultRange;

    if (!dv) {
      if (range === "week") {
        const s = dayjs().startOf("week");
        return `${s.format("YYYY-MM-DD")}~${s.add(6, "day").format("YYYY-MM-DD")}`;
      }
      const today = dayjs().format("YYYY-MM-DD");
      return `${today}~${today}`;
    }

    const fmt = filterConfig.apiDateFormat || "YYYY-MM-DD";
    const date = dayjs(dv, fmt);
    const iso = date.format("YYYY-MM-DD");

    if (range === "week") {
      const s = date.subtract(6, "day");
      return `${s.format("YYYY-MM-DD")}~${iso}`;
    }

    return `${iso}~${iso}`;
  }

  useEffect(() => {
    if (!currentValue) {
      updateQuery(filter?.key, resolveDefault(filter));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const raw = currentValue || resolveDefault(filter);
  const [startStr, endStr] = raw.split("~");
  const start = dayjs(startStr);
  const end = dayjs(endStr || startStr);

  useEffect(() => {
    const onTouchMove = (e) => {
      if (!dragStartRef.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      if (!touch) return;

      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      if (!el) return;

      const dateStr = el.closest("[data-date]")?.getAttribute("data-date");
      if (dateStr) setHover(dayjs(dateStr));
    };

    const grid = gridRef.current;
    if (!grid) return;

    grid.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => grid.removeEventListener("touchmove", onTouchMove);
  }, []);

  const applyRange = useCallback(
    (s, e) => {
      updateQuery(filter?.key, `${s.format("YYYY-MM-DD")}~${e.format("YYYY-MM-DD")}`);
      dragStartRef.current = null;
      setDragStart(null);
      setHover(null);
    },
    [filter?.key, updateQuery],
  );

  const isDateWithMeeting = (d) =>
    datesWithMeetings.some((item) =>
      dayjs(item).isSame(d, "day")
    );
  const getDayClass = (d) => {
    const isS = d.isSame(previewStart, "day");
    const isE = d.isSame(previewEnd, "day");
    const inR = d.isBetween(previewStart, previewEnd, "day", "()");
    const isT = d.isSame(dayjs(), "day");
    const hasMeeting = isDateWithMeeting(d);
    return [
      "relative h-8 w-full flex items-center justify-center text-xs cursor-pointer select-none transition-colors touch-none rounded-md",
      isS || isE ? "bg-amber-500 text-white" : "",
      inR ? "bg-amber-100 text-amber-800" : "",
      !isS && !isE && !inR ? "hover:bg-gray-100 active:bg-gray-200 text-gray-700" : "",
      isT && !isS && !isE ? "font-bold underline underline-offset-2" : "",
      hasMeeting ? "ring-1 ring-amber-400 font-bold" : "",
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

  const finishDrag = useCallback(
    (ds, hd) => {
      if (ds && hd) {
        const s = ds.isBefore(hd, "day") ? ds : hd;
        const e = ds.isBefore(hd, "day") ? hd : ds;
        applyRange(s, e);
      } else if (ds) {
        applyRange(ds, ds);
      }
    },
    [applyRange],
  );

  useEffect(() => {
    const onMouseUp = () => {
      if (!dragStartRef.current) return;
      const ds = dragStartRef.current;
      const hd = hoverDayRef.current;
      const isDrag = ds && hd && !ds.isSame(hd, "day");

      if (isDrag) {
        const s = ds.isBefore(hd, "day") ? ds : hd;
        const e = ds.isBefore(hd, "day") ? hd : ds;
        applyRange(s, e);
      } else if (ds) {
        applyRange(ds, ds);
      }
    };

    document.addEventListener("mouseup", onMouseUp);
    return () => document.removeEventListener("mouseup", onMouseUp);
  }, [applyRange]);

  const yearBase = dayjs().year() - 4 + yearPage * 12;
  const yearRange = Array.from({ length: 12 }, (_, i) => yearBase + i);

  return (
    <div className="w-full">
      <div className="bg-white  p-4 w-full">
        {/* <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => {
              if (calMode === "year") setYearPage((p) => p - 1);
              else if (calMode === "month") setMonth((m) => m.subtract(1, "year"));
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
                  onClick={() => setCalMode(calMode === "month" ? "day" : "month")}
                  className={`text-sm font-semibold px-1.5 py-0.5 rounded transition-colors
                    ${calMode === "month"
                      ? "bg-amber-500 text-white"
                      : "text-gray-700 hover:text-amber-600 hover:bg-gray-100"
                    }`}
                >
                  {month.format("MMMM")}
                </button>
                <button
                  onClick={() => setCalMode(calMode === "year" ? "day" : "year")}
                  className={`text-sm font-semibold px-1.5 py-0.5 rounded transition-colors
                    ${calMode === "year"
                      ? "bg-amber-500 text-white"
                      : "text-gray-700 hover:text-amber-600 hover:bg-gray-100"
                    }`}
                >
                  {month.format("YYYY")}
                </button>
              </>
            )}
          </div>
          <ListFilters />
          <button
            onClick={() => {
              if (calMode === "year") setYearPage((p) => p + 1);
              else if (calMode === "month") setMonth((m) => m.add(1, "year"));
              else setMonth((m) => m.add(1, "month"));
            }}
            className="p-1.5 hover:bg-gray-100 active:bg-gray-200 rounded-md text-gray-500 text-xs"
          >
            ▷
          </button>
        </div> */}
        <div className="flex items-center justify-between mb-3">
          {/* Previous button */}
          <button
            onClick={() => {
              if (calMode === "year") {
                setYearPage((p) => p - 1);
              } else if (calMode === "month") {
                setMonth((m) => m.subtract(1, "year"));
              } else {
                setMonth((m) => m.subtract(1, "month"));
              }
            }}
            className="p-1.5 hover:bg-gray-100 active:bg-gray-200 rounded-md text-gray-500 text-xs"
          >
            ◁
          </button>

          {/* Center section */}
          <div className="flex items-center gap-2 flex-1 justify-center">
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
              ${calMode === "month"
                        ? "bg-amber-500 text-white"
                        : "text-gray-700 hover:text-amber-600 hover:bg-gray-100"
                      }`}
                  >
                    {month.format("MMMM")}
                  </button>

                  <button
                    onClick={() =>
                      setCalMode(calMode === "year" ? "day" : "year")
                    }
                    className={`text-sm font-semibold px-1.5 py-0.5 rounded transition-colors
              ${calMode === "year"
                        ? "bg-amber-500 text-white"
                        : "text-gray-700 hover:text-amber-600 hover:bg-gray-100"
                      }`}
                  >
                    {month.format("YYYY")}
                  </button>
                </>
              )}
            </div>

            {/* List Filters */}
            <div
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="flex items-center"
            >
              <ListFilters />
            </div>
          </div>

          {/* Next button */}
          <button
            onClick={() => {
              if (calMode === "year") {
                setYearPage((p) => p + 1);
              } else if (calMode === "month") {
                setMonth((m) => m.add(1, "year"));
              } else {
                setMonth((m) => m.add(1, "month"));
              }
            }}
            className="p-1.5 hover:bg-gray-100 active:bg-gray-200 rounded-md text-gray-500 text-xs"
          >
            ▷
          </button>
        </div>
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
                  ${month.year() === y
                    ? "bg-amber-500 text-white"
                    : "hover:bg-gray-100 text-gray-700"
                  }`}
              >
                {y}
              </button>
            ))}
          </div>
        )}

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
                  ${month.month() === i
                    ? "bg-amber-500 text-white"
                    : "hover:bg-gray-100 text-gray-700"
                  }`}
              >
                {m}
              </button>
            ))}
          </div>
        )}

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
              ref={gridRef}
              className="grid grid-cols-7 gap-1"
              onTouchEnd={() => finishDrag(dragStartRef.current, hoverDay)}
            >
              {buildDayCells().map((date, i) =>
                !date ? (
                  <div key={`e-${i}`} />
                ) : (
                  <div
                    key={date.format("YYYY-MM-DD")}
                    data-date={date.format("YYYY-MM-DD")}
                    className={getDayClass(date)}
                    onMouseDown={() => {
                      dragStartRef.current = date;
                      setDragStart(date);
                      setHover(date);
                    }}
                    onMouseEnter={() => dragStartRef.current && setHover(date)}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      dragStartRef.current = date;
                      setDragStart(date);
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

        <div className="grid grid-cols-3 gap-1.5 mt-3 pt-3 border-t border-gray-100">
          {PRESETS.map((p) => {
            const [s, e] = p.get();
            const active = start.isSame(s, "day") && end.isSame(e, "day");
            return (
              <button
                key={p.label}
                onClick={() => applyRange(s, e)}
                className={`text-[10px] py-1.5 border rounded-md font-medium transition-colors
                  ${active
                    ? "bg-amber-500 border-amber-500 text-white"
                    : "border-gray-200 text-gray-600 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700"
                  }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}