

import React, { useState, useMemo, useRef, useLayoutEffect, useEffect, useCallback } from "react";
import dayjs from "dayjs";
import { useList } from "../context/ListContext";
import { parseQuery } from "../hooks/useQueryParser";
import { ROUTE_KEYS } from "../../../core/routing/paths";
import { tryBuildPath } from "../../../core/routing/routeRegistry";
import { User } from "lucide-react";
import { formatDate } from "../../../app/shared/utilities/utilities";

// const parseValue = (val) => {
//   if (typeof val === "string" && val.includes(":")) {
//     const parts = val.split(":");
//     return parts.length === 2 ? parseInt(parts[0], 10) + parseInt(parts[1], 10) / 60 : parseFloat(val) || 0;
//   }
//   return parseFloat(val) || 0;
// };

// const getHashColor = (str) => {
//   let hash = 0;
//   const safeStr = String(str || "unknown");

//   for (let i = 0; i < safeStr.length; i++) {
//     hash = safeStr.charCodeAt(i) + ((hash << 5) - hash);
//     hash = hash & hash;
//   }

//   const positiveHash = Math.abs(hash);
//   const hue = Math.floor((positiveHash * 137.5) % 360);
//   const saturation = 40 + (positiveHash % 15);
//   const lightness = 40 + (positiveHash % 15);

//   return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
// };

// const getSafeValue = (obj, key) => {
//   if (!obj || key === undefined || key === null) return undefined;
//   if (obj[key] !== undefined) return obj[key];

//   const keyStr = String(key);
//   const camel = keyStr.charAt(0).toLowerCase() + keyStr.slice(1);
//   if (obj[camel] !== undefined) return obj[camel];

//   const pascal = keyStr.charAt(0).toUpperCase() + keyStr.slice(1);
//   if (obj[pascal] !== undefined) return obj[pascal];

//   const cleanKey = keyStr.replace(/_/g, "").toLowerCase();

//   for (const k in obj) {
//     if (k.replace(/_/g, "").toLowerCase() === cleanKey) return obj[k];
//   }

//   return undefined;
// };

// const parseValueToMinutes = (val) => {
//   if (!val) return 0;

//   if (typeof val === "string" && val.includes(":")) {
//     const parts = val.split(":");
//     const hours = parseInt(parts[0] || "0", 10);
//     const minutes = parseInt(parts[1] || "0", 10);
//     return hours * 60 + minutes;
//   }

//   return Math.round(parseFloat(val) * 60) || 0;
// };

// const formatConsumeTime = (value) => {
//   if (!value) return "0h:00";

//   if (typeof value === "string" && value.includes(":")) {
//     const [h = "0", m = "0"] = value.split(":");
//     return `${(+h || 0).toString()}h:${(+m || 0).toString().padStart(2, "0")}`;
//   }

//   const num = Number(value);
//   if (Number.isNaN(num)) return String(value);

//   const h = Math.floor(num);
//   const m = Math.round((num - h) * 60);
//   return `${h}h:${m.toString().padStart(2, "0")}m`;
// };

// const buildTooltipData = ({ item, x, y, display, color, markerType }) => ({
//   rawItem: item,
//   x,
//   y,
//   color,
//   display,
//   markerType: markerType || null,
// });

// // ================================================================
// // TOOLTIP
// // ================================================================

// const ChartTooltip = ({ tooltip, graphConfig, setTooltip, setIsTooltipHovered }) => {
//   if (!tooltip) return null;

//   const raw = tooltip.rawItem;
//   const isReportView = ["report", "date", "reportView"].includes(graphConfig.reportMode);

//   const handleViewTicket = (event) => {
//     event.preventDefault();
//     event.stopPropagation();

//     const ticketId = raw.navId ?? raw.ticketId ?? raw.issueId ?? raw.Issue_Id;
//     if (!ticketId) return;

//     const url = tryBuildPath(ROUTE_KEYS.TICKET_DETAIL, { ticketId });
//     const newTab = window.open(url, "_blank");
//     if (newTab) newTab.opener = null;
//   };

//   const shortRepoName = (name) => {
//     if (!name) return "";

//     const words = name.trim().split(/\s+/);
//     if (words.length === 1) return name.replace(/\s+/g, "").slice(0, 2).toUpperCase();

//     return words.map((word) => word[0]).join("").toUpperCase();
//   };

//   return (
//     <div
//       className="fixed min-w-[240px] max-w-[320px] bg-white border border-gray-100 shadow-xl px-3 py-2.5 rounded-lg z-[9999]"
//       style={{ top: Math.max(12, tooltip.y - 80), left: tooltip.x + 16 }}
//       onMouseEnter={() => setIsTooltipHovered(true)}
//       onMouseLeave={() => {
//         setIsTooltipHovered(false);
//         setTooltip(null);
//       }}
//     >
//       <div className="flex items-start justify-between gap-2">
//         {isReportView && <div className="text-gray-500 text-[10px] font-semibold">Created: {formatDate(raw.createdAt)}</div>}
//         {tooltip.markerType && (
//           <span className="bg-gray-800 text-white text-[7px] px-1 py-0.5 rounded uppercase tracking-wider shrink-0">
//             {tooltip.markerType === "C" ? "Closed" : "Reopened"}
//           </span>
//         )}
//       </div>

//       <div className="text-gray-800 text-[12px] font-bold leading-tight mt-1">
//         <span className="cursor-help" title={raw.repoName}>[{shortRepoName(raw.repoName)}]</span>{" "}
//         - <span className="cursor-help" title={raw.projectName}>{raw.projectName}</span>
//       </div>

//       <div className="text-gray-700 text-[11px] font-semibold mt-0.5 leading-tight">
//         #{raw.ticketKey} - {raw.TicketName}
//       </div>

//       <div className="text-gray-500 font-medium text-[10px] mt-1.5 flex items-center gap-1">
//         <User className="w-2.5 h-2.5" />
//         {raw.employeeName}
//       </div>

//       <div className="flex items-center gap-1.5 mt-2">
//         <div className="text-gray-600 font-semibold text-[11px] bg-gray-50 px-1.5 py-1 rounded border border-gray-100">
//           {formatConsumeTime(raw.ConsumeTime)}
//         </div>

//         <button
//           type="button"
//           className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md border border-indigo-100"
//           onClick={handleViewTicket}
//         >
//           View →
//         </button>
//       </div>
//     </div>
//   );
// };

// // ================================================================
// // STACKED BAR GRAPH
// // ================================================================

// const StackedBarDesign = ({
//   data,
//   graphConfig,
//   setTooltip,
//   config,
//   isTooltipHovered,
//   setIsTooltipHovered,
// }) => {
//   console.log("data",data);

//   const scrollRef = useRef(null);
//   const measureRef = useRef(null);
//   const [containerW, setContainerW] = useState(0);

//   useLayoutEffect(() => {
//     if (!measureRef.current) return undefined;

//     const observer = new ResizeObserver((entries) => {
//       const width = entries[0]?.contentRect?.width || 0;
//       if (width > 0) setContainerW(width);
//     });

//     observer.observe(measureRef.current);
//     return () => observer.disconnect();
//   }, []);

//   const yAxisW = 60;
//   const xAxisH = graphConfig.reportMode === "report" ? 60 : 45;
//   const padTop = 40;
//   const maxVisibleY = graphConfig.reportMode === "report" ? 16 : 12;
//   const minVisibleY = graphConfig.minYValue ?? 0;
//   const step = graphConfig.yAxisStep || 2;

//   const isValidGraphRecord = useCallback((item) => {
//     const consumeTime = getSafeValue(item, "ConsumeTime");
//     const status = String(getSafeValue(item, "threadStatusName") || "").toLowerCase();
//     const isClosedOrReopened = status.includes("closed") || status.includes("reopened");

//     const isNullConsume =
//       consumeTime == null ||
//       consumeTime === "" ||
//       (typeof consumeTime === "string" && consumeTime.trim() === "");

//     return !isNullConsume || isClosedOrReopened;
//   }, []);

//   // ============================================================
//   // X AXIS
//   // ============================================================

//   const xaxis = useMemo(() => {
//     if (graphConfig.graphXAxis?.length > 0) {
//       return graphConfig.graphXAxis.filter((column) =>
//         data.some((item) => {
//           if (!isValidGraphRecord(item)) return false;

//           if (graphConfig.reportMode === "report") {
//             const employeeId = getSafeValue(item, "EmployeeID") ?? getSafeValue(item, "employeeId");
//             return employeeId !== undefined && String(employeeId) === String(column.key);
//           }

//           const rawDate = getSafeValue(item, graphConfig.graphXAxisKey);
//           const xKey = graphConfig.isDateAxis ? (rawDate ? String(rawDate).split("T")[0] : null) : rawDate;

//           return xKey != null && String(xKey) === String(column.key);
//         })
//       );
//     }

//     if (graphConfig.reportMode === "report") {
//       const employeeMap = new Map();

//       data.forEach((item) => {
//         if (!isValidGraphRecord(item)) return;

//         const employeeId = getSafeValue(item, "EmployeeID") ?? getSafeValue(item, "employeeId");
//         if (employeeId === undefined) return;

//         const employeeName = getSafeValue(item, "EmployeeName") ?? getSafeValue(item, "employeeName");
//         const key = String(employeeId);

//         if (!employeeMap.has(key)) {
//           employeeMap.set(key, { key, label: employeeName, employeeId, employeeName });
//         }
//       });

//       return Array.from(employeeMap.values()).sort((a, b) => {
//         const aName = a.employeeName?.trim() || "Unknown";
//         const bName = b.employeeName?.trim() || "Unknown";

//         if (aName === "Unknown") return 1;
//         if (bName === "Unknown") return -1;

//         return aName.localeCompare(bName, undefined, { sensitivity: "base" });
//       });
//     }

//     const keys = [
//       ...new Set(
//         data
//           .filter(isValidGraphRecord)
//           .map((item) => {
//             const rawDate = getSafeValue(item, graphConfig.graphXAxisKey);
//             return graphConfig.isDateAxis ? (rawDate ? String(rawDate).split("T")[0] : null) : rawDate;
//           })
//           .filter(Boolean)
//       ),
//     ].sort();

//     return keys.map((key) => ({
//       key,
//       label: graphConfig.isDateAxis ? dayjs(key).format("DD MMM") : key,
//     }));
//   }, [data, graphConfig, isValidGraphRecord]);

//   // ============================================================
//   // CHART DATA
//   // ============================================================

//   const chartData = useMemo(() => {
//     const grouped = {};

//     xaxis.forEach((column) => {
//       grouped[column.key] = {};
//     });

//     data.forEach((item) => {
//       let xKey;

//       if (graphConfig.reportMode === "report") {
//         const employeeId =
//           getSafeValue(item, "EmployeeID") ??
//           getSafeValue(item, "employeeId");

//         xKey = employeeId !== undefined ? String(employeeId) : null;
//       } else {
//         const rawDate = getSafeValue(item, graphConfig.graphXAxisKey);

//         xKey = graphConfig.isDateAxis
//           ? rawDate
//             ? String(rawDate).split("T")[0]
//             : null
//           : rawDate;
//       }

//       if (xKey == null || !grouped[xKey]) return;

//       const rawValue = getSafeValue(item, graphConfig.graphValueKey);

//       const status = String(
//         getSafeValue(item, "threadStatusName") || ""
//       ).toLowerCase();

//       const isClosed = status.includes("closed");
//       const isReopened = status.includes("reopened");
//       const isClosedOrReopened = isClosed || isReopened;

//       const isMarker =
//         rawValue === 0.1 ||
//         rawValue === "0.1";

//       const consumeTime = getSafeValue(item, "ConsumeTime");

//       const isNullConsume =
//         consumeTime == null ||
//         consumeTime === "" ||
//         (typeof consumeTime === "string" && consumeTime.trim() === "");

//       // Closed/Reopened records are allowed even when ConsumeTime is null.
//       if (
//         isNullConsume &&
//         !isClosedOrReopened &&
//         !isMarker
//       ) {
//         return;
//       }

//       const effectiveConsumeTime =
//         isNullConsume && isClosedOrReopened
//           ? "00:05"
//           : consumeTime;

//       const minutes = isMarker
//         ? 0
//         : parseValueToMinutes(effectiveConsumeTime);

//       if (minutes <= 0 && !isMarker) return;

//       const employeeId =
//         getSafeValue(item, "EmployeeID") ??
//         getSafeValue(item, "employeeId");

//       const employeeName =
//         getSafeValue(item, "EmployeeName") ??
//         getSafeValue(item, "employeeName");

//       const uniqueId =
//         getSafeValue(item, "navId") ??
//         getSafeValue(item, "ticketId") ??
//         getSafeValue(item, "issueId") ??
//         getSafeValue(item, "Issue_Id") ??
//         item.rawId ??
//         "unknown";

//       const ticketName =
//         getSafeValue(item, "TicketName") ??
//         getSafeValue(item, "ticketName") ??
//         getSafeValue(item, "title") ??
//         getSafeValue(item, "issueName") ??
//         "Unknown Ticket";

//       const configuredColor =
//         typeof graphConfig.graphColorKey === "function"
//           ? graphConfig.graphColorKey(item)
//           : getSafeValue(item, graphConfig.graphColorKey);

//       const finalColor =
//         configuredColor || getHashColor(uniqueId);

//       /*
//        * IMPORTANT:
//        *
//        * Closed/Reopened must be a separate segment for THIS xKey.
//        *
//        * Normal records can continue using the ticket ID as the key.
//        * Marker records get their own key so the marker cannot affect
//        * another date's aggregated ticket segment.
//        */
//       const segmentKey = isClosedOrReopened
//         ? `${uniqueId}__marker__${xKey}__${isClosed ? "C" : "R"}`
//         : uniqueId;

//       if (!grouped[xKey][segmentKey]) {
//         const rawLabel =
//           typeof graphConfig.graphLabelKey === "function"
//             ? graphConfig.graphLabelKey(item)
//             : getSafeValue(
//                 item,
//                 graphConfig.graphLabelKey
//               );

//         grouped[xKey][segmentKey] = {
//           rawItem: item,
//           history: [],
//           totalMins: 0,
//           value: 0,

//           label:
//             graphConfig.reportMode === "report"
//               ? ticketName
//               : rawLabel || "Unknown",

//           employeeId:
//             employeeId != null
//               ? String(employeeId)
//               : "",

//           employeeName:
//             employeeName || "Unknown Employee",

//           repoName:
//             getSafeValue(item, "repoKey") ??
//             getSafeValue(item, "RepoKey") ??
//             getSafeValue(item, "repoName") ??
//             getSafeValue(item, "RepoName") ??
//             "Unknown Repository",

//           projectName:
//             getSafeValue(item, "projectName") ??
//             getSafeValue(item, "ProjectName") ??
//             getSafeValue(item, "project") ??
//             "Unknown Project",

//           ticketKey:
//             getSafeValue(item, "ticketKey") ??
//             getSafeValue(item, "TicketKey") ??
//             "-",

//           ticketName,

//           createdAt:
//             getSafeValue(item, "createdAt") ??
//             getSafeValue(item, "CreatedAt"),

//           consumeTime:
//             effectiveConsumeTime ?? "0",

//           color: finalColor,

//           recordCount: 0,

//           noConsumeTime: false,

//           latestUpdatedAt:
//             getSafeValue(item, "updatedAt") ??
//             getSafeValue(item, "UpdatedAt"),

//           /*
//            * Marker belongs ONLY to this xKey.
//            */
//           markerType: isReopened
//             ? "R"
//             : isClosed
//               ? "C"
//               : null,
//         };
//       }

//       const segment = grouped[xKey][segmentKey];

//       segment.history.push(item);
//       segment.totalMins += minutes;
//       segment.value = segment.totalMins / 60;
//       segment.recordCount += 1;

//       const currentUpdatedAt =
//         getSafeValue(item, "updatedAt") ??
//         getSafeValue(item, "UpdatedAt");

//       const currentTime = new Date(
//         currentUpdatedAt || 0
//       );

//       const previousTime = new Date(
//         segment.latestUpdatedAt || 0
//       );

//       if (currentTime >= previousTime) {
//         segment.latestUpdatedAt = currentUpdatedAt;
//         segment.rawItem = item;

//         segment.repoName =
//           getSafeValue(item, "repoKey") ??
//           getSafeValue(item, "RepoKey") ??
//           getSafeValue(item, "repoName") ??
//           getSafeValue(item, "RepoName") ??
//           "Unknown Repository";

//         segment.projectName =
//           getSafeValue(item, "projectName") ??
//           getSafeValue(item, "ProjectName") ??
//           getSafeValue(item, "project") ??
//           "Unknown Project";

//         segment.ticketKey =
//           getSafeValue(item, "ticketKey") ??
//           getSafeValue(item, "TicketKey") ??
//           "-";

//         segment.ticketName =
//           getSafeValue(item, "TicketName") ??
//           getSafeValue(item, "ticketName") ??
//           getSafeValue(item, "title") ??
//           getSafeValue(item, "issueName") ??
//           "Unknown Ticket";

//         segment.employeeName =
//           getSafeValue(item, "EmployeeName") ??
//           getSafeValue(item, "employeeName") ??
//           "Unknown Employee";

//         segment.createdAt =
//           getSafeValue(item, "createdAt") ??
//           getSafeValue(item, "CreatedAt");

//         segment.consumeTime =
//           effectiveConsumeTime ?? "0";

//         /*
//          * Only update markerType for marker segments.
//          *
//          * Normal ticket segments never inherit C/R.
//          */
//         if (isReopened) {
//           segment.markerType = "R";
//         } else if (isClosed) {
//           segment.markerType = "C";
//         }
//       }
//     });


//     const finalGrouped = {};

//     Object.keys(grouped).forEach((xKey) => {
//       const segments = Object.values(grouped[xKey]);
//       if (!segments.length) return;

//       finalGrouped[xKey] = segments;

//       segments.forEach((segment) => {
//         segment.markerType = segment.markerType || null;
//         segment.display = graphConfig.valueFormatter
//           ? graphConfig.valueFormatter(segment.value)
//           : formatConsumeTime(segment.consumeTime);
//       });
//     });

//     return finalGrouped;
//   }, [data, graphConfig, xaxis]);

//   // ============================================================
//   // Y AXIS
//   // ============================================================

//   const dataMaxY = useMemo(() => {
//     let max = 0;

//     Object.values(chartData).forEach((stack) => {
//       const total = stack.reduce((sum, item) => sum + (item.value || 0), 0);
//       if (total > max) max = total;
//     });

//     return max;
//   }, [chartData]);

//   const maxY = Math.max(minVisibleY, Math.ceil(dataMaxY / step) * step);
//   const baseInnerH = 250;
//   const unitH = baseInnerH / Math.min(Math.max(maxY, 1), maxVisibleY);
//   const innerH = maxY * unitH;

//   const minItemW = graphConfig.reportMode === "report" ? 110 :100;
//   const requiredInnerW = Math.max(xaxis.length, 1) * minItemW;
//   const availableInnerW = Math.max(0, containerW - yAxisW);
//   const innerW = Math.max(availableInnerW, requiredInnerW);
//   const totalW = yAxisW + innerW;
//   const scrollbarBuffer = totalW > containerW ? 12 : 0;
//   const viewportMaxH = baseInnerH + padTop + xAxisH + scrollbarBuffer;
//   const totalH = innerH + padTop + xAxisH;

//   const ticks = [];
//   for (let i = 0; i <= Math.max(maxY, maxVisibleY); i += step) ticks.push(i);

//   const getYPos = (value) => padTop + innerH - value * unitH;
//   const axisSignature = xaxis.map((x) => x.key).join("|");

//   useEffect(() => {
//     const snapPositions = () => {
//       if (!scrollRef.current) return;
//       scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
//       scrollRef.current.scrollLeft = 0;
//     };

//     snapPositions();

//     const timeout1 = setTimeout(snapPositions, 50);
//     const timeout2 = setTimeout(snapPositions, 200);

//     return () => {
//       clearTimeout(timeout1);
//       clearTimeout(timeout2);
//     };
//   }, [maxY, axisSignature, containerW]);

//   return (
//     <div className="w-full z-10 mx-auto rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col relative">
//       <div ref={measureRef} className="w-full h-0 pointer-events-none" />

//       <style>{`
//         @keyframes smoothDrop {
//           0% { transform: translateY(-600px); opacity: 0; }
//           5% { opacity: 1; }
//           100% { transform: translateY(0); opacity: 1; }
//         }

//         @keyframes fadeIn {
//           0% { opacity: 0; }
//           100% { opacity: 1; }
//         }

//         .animate-fade-in {
//           animation: fadeIn 0.8s ease-in 0.3s forwards;
//           opacity: 0;
//         }
//       `}</style>

//       <svg width="0" height="0" className="absolute pointer-events-none">
//         <defs>
//           <linearGradient id="cylinderShine" x1="0%" y1="0%" x2="100%" y2="0%">
//             <stop offset="0%" stopColor="#000" stopOpacity="0.12" />
//             <stop offset="30%" stopColor="#fff" stopOpacity="0.15" />
//             <stop offset="65%" stopColor="#000" stopOpacity="0" />
//             <stop offset="100%" stopColor="#000" stopOpacity="0.15" />
//           </linearGradient>

//           <linearGradient id="topShine" x1="0%" y1="0%" x2="0%" y2="100%">
//             <stop offset="0%" stopColor="#fff" stopOpacity="0.25" />
//             <stop offset="100%" stopColor="#fff" stopOpacity="0" />
//           </linearGradient>

//           <pattern id="diagonalStripes" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
//             <rect width="2.5" height="6" fill="#ffffff" fillOpacity="0.6" />
//           </pattern>

//           <marker id="arrowhead" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
//             <polygon points="0 0, 5 2.5, 0 5" fill="#1e293b" />
//           </marker>
//         </defs>
//       </svg>

//       {containerW > 0 && (
//         <div ref={scrollRef} className="overflow-auto custom-scrollbar relative" style={{ maxHeight: `${viewportMaxH}px` }}>
//           <div style={{ minWidth: `${totalW}px`, height: `${totalH}px` }} className="relative bg-white">
//             {/* Y AXIS */}

//             <div
//               className="sticky left-0 top-0 z-20 bg-white/95 backdrop-blur-sm border-r border-gray-100"
//               style={{ width: yAxisW, height: innerH + padTop, float: "left" }}
//             >
//               {ticks.map((value) => (
//                 <div
//                   key={`y-${value}`}
//                   className="absolute w-full text-right pr-3 text-[11px] font-bold text-gray-400"
//                   style={{ top: getYPos(value) - 7 }}
//                 >
//                   {value}h
//                 </div>
//               ))}
//             </div>

//             {/* GRAPH */}

//             <svg className="absolute top-0" style={{ left: yAxisW }} width={innerW} height={innerH + padTop}>
//               {ticks.map((value) => (
//                 <line
//                   key={`grid-${value}`}
//                   x1={0}
//                   x2={innerW}
//                   y1={getYPos(value)}
//                   y2={getYPos(value)}
//                   stroke="#f1f5f9"
//                   strokeWidth="1.5"
//                   strokeDasharray="4 4"
//                 />
//               ))}

//               {xaxis.map((column, index) => {
//                 const segmentW = innerW / Math.max(xaxis.length, 1);
//                 const barW = Math.min(50, segmentW - 20);
//                 const safeBarW = Math.max(barW, 4);
//                 const rx = safeBarW / 2;
//                 const ry = Math.min(10, safeBarW / 4);
//                 const x = index * segmentW + (segmentW - safeBarW) / 2;

//                 let currentY = padTop + innerH - ry;

//                 const dayTotalMins = (chartData[column.key] || []).reduce(
//                   (sum, item) => sum + (item.totalMins || 0),
//                   0
//                 );

//                 const dayTotalValue = dayTotalMins / 60;

//                 const dayTotalDisplay = graphConfig.valueFormatter
//                   ? graphConfig.valueFormatter(dayTotalValue)
//                   : formatConsumeTime(dayTotalValue);

//                 return (
//                   <g key={column.key}>
//                     {(chartData[column.key] || []).map((item, segmentIndex) => {
//                       const height = Math.max(6, item.value * unitH);
//                       const y = currentY - height;
//                       currentY = y;

//                       return (
//                         <g
//                           key={`${column.key}-${segmentIndex}`}
//                           style={{
//                             animation: `smoothDrop 0.6s cubic-bezier(0.25, 1, 0.5, 1) ${segmentIndex * 0.1}s forwards`,
//                             opacity: 0,
//                           }}
//                         >
//                           <g
//                             style={{ transformOrigin: `${x + safeBarW / 2}px ${y + height / 2}px` }}
//                             className="cursor-pointer transition-transform duration-300 hover:scale-[1.12]"
//                             onMouseEnter={(event) => {
//                               setTooltip(
//                                 buildTooltipData({
//                                   item: item.rawItem,
//                                   x: event.clientX,
//                                   y: event.clientY,
//                                   color: item.color,
//                                   markerType: item.markerType,
//                                   display: graphConfig.tooltipFormatter
//                                     ? graphConfig.tooltipFormatter(item.rawItem)
//                                     : formatConsumeTime(item.consumeTime),
//                                 })
//                               );
//                             }}
//                             onMouseLeave={() => {
//                               if (!isTooltipHovered) setTooltip(null);
//                             }}
//                             onClick={() => {
//                               if (config?.onItemClick) {
//                                 config.onItemClick({
//                                   ...item.rawItem,
//                                   history: item.history,
//                                 });
//                               }
//                             }}
//                           >
//                             <path
//                               d={`M ${x} ${y} L ${x} ${y + height} A ${rx} ${ry} 0 0 0 ${x + safeBarW} ${y + height} L ${x + safeBarW} ${y} Z`}
//                               fill={item.color}
//                               stroke="#ffffff"
//                               strokeWidth="1.5"
//                               strokeLinejoin="round"
//                             />

//                             <path
//                               d={`M ${x} ${y} L ${x} ${y + height} A ${rx} ${ry} 0 0 0 ${x + safeBarW} ${y + height} L ${x + safeBarW} ${y} Z`}
//                               fill="url(#cylinderShine)"
//                             />

//                             <ellipse
//                               cx={x + rx}
//                               cy={y}
//                               rx={rx}
//                               ry={ry}
//                               fill={item.color}
//                               stroke="#ffffff"
//                               strokeWidth="1.5"
//                             />

//                             <ellipse
//                               cx={x + rx}
//                               cy={y}
//                               rx={rx}
//                               ry={ry}
//                               fill="url(#topShine)"
//                             />

//                             {item.markerType && (
//                               <g className="pointer-events-none">
//                                 <path
//                                   d={`M ${x} ${y} L ${x} ${y + height} A ${rx} ${ry} 0 0 0 ${x + safeBarW} ${y + height} L ${x + safeBarW} ${y} Z`}
//                                   fill="url(#diagonalStripes)"
//                                 />

//                                 <ellipse
//                                   cx={x + rx}
//                                   cy={y}
//                                   rx={rx}
//                                   ry={ry}
//                                   fill="url(#diagonalStripes)"
//                                 />

//                                 <line
//                                   x1={x + safeBarW + 13}
//                                   y1={y + height / 2}
//                                   x2={x + safeBarW + 3}
//                                   y2={y + height / 2}
//                                   stroke="#1e293b"
//                                   strokeWidth="1.5"
//                                   markerEnd="url(#arrowhead)"
//                                 />

//                                 <circle
//                                   cx={x + safeBarW + 18}
//                                   cy={y + height / 2}
//                                   r="5.5"
//                                   fill="#1e293b"
//                                   stroke="#ffffff"
//                                   strokeWidth="1"
//                                 />

//                                 <text
//                                   x={x + safeBarW + 18}
//                                   y={y + height / 2 + 2.5}
//                                   fill="#ffffff"
//                                   fontSize="7"
//                                   fontWeight="bold"
//                                   textAnchor="middle"
//                                 >
//                                   {item.markerType}
//                                 </text>
//                               </g>
//                             )}
//                           </g>
//                         </g>
//                       );
//                     })}

//                     {dayTotalValue > 0 && (
//                       <text
//                         x={x + rx}
//                         y={currentY - 10}
//                         textAnchor="middle"
//                         fontSize="11"
//                         fontWeight="700"
//                         fill="#64748b"
//                         className="animate-fade-in pointer-events-none"
//                       >
//                         {dayTotalDisplay}
//                       </text>
//                     )}
//                   </g>
//                 );
//               })}
//             </svg>

//             {/* X AXIS */}

//             <div
//               className="sticky bottom-0 z-30 flex bg-white border-t border-gray-100"
//               style={{ width: "100%", height: xAxisH, clear: "both" }}
//             >
//               <div
//                 className="sticky left-0 z-40 bg-white border-r border-gray-100"
//                 style={{ width: yAxisW, height: "100%" }}
//               />

//               <div className="relative" style={{ width: innerW }}>
//                 {xaxis.map((column, index) => {
//                   const segmentW = innerW / Math.max(xaxis.length, 1);

//                   return (
//                     <div
//                       key={column.key}
//                       className={`absolute text-[11px] font-bold text-gray-500 whitespace-nowrap transform -translate-x-1/2 ${
//                         graphConfig.reportMode === "report"
//                           ? "max-w-[110px] overflow-hidden text-ellipsis text-center"
//                           : ""
//                       }`}
//                       style={{
//                         left: index * segmentW + segmentW / 2,
//                         top: graphConfig.reportMode === "report" ? "10px" : "12px",
//                         width: graphConfig.reportMode === "report" ? "110px" : "auto",
//                       }}
//                       title={column.label}
//                     >
//                       {column.label}
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// // ================================================================
// // PIE CHART
// // ================================================================

// const PieChartDesign = ({
//   data,
//   graphConfig,
//   setTooltip,
//   config,
//   isTooltipHovered,
//   setIsTooltipHovered,
// }) => {
//   const SIZE = graphConfig.pieSize || 400;
//   const RADIUS = SIZE / 2.8;
//   const CENTER = SIZE / 2;

//   const grouped = useMemo(() => {
//     return data.reduce((accumulator, item) => {
//       const category = getSafeValue(item, graphConfig.graphCategoryKey) || "Other";
//       const value = parseValue(getSafeValue(item, graphConfig.graphValueKey));

//       if (!accumulator[category]) {
//         accumulator[category] = {
//           value: 0,
//           rawItem: item,
//           color:
//             getSafeValue(item, graphConfig.graphColorKey) ||
//             getHashColor(category),
//         };
//       }

//       accumulator[category].value += value;
//       return accumulator;
//     }, {});
//   }, [data, graphConfig]);

//   const total = Object.values(grouped).reduce((sum, item) => sum + item.value, 0);
//   let cumulativeAngle = 0;

//   return (
//     <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full h-auto max-w-[400px]">
//       {Object.entries(grouped).map(([label, item], index) => {
//         if (!total) return null;

//         const angle = (item.value / total) * 360;
//         const startRad = (Math.PI * (cumulativeAngle - 90)) / 180;
//         const endRad = (Math.PI * (cumulativeAngle + angle - 90)) / 180;

//         const x1 = CENTER + RADIUS * Math.cos(startRad);
//         const y1 = CENTER + RADIUS * Math.sin(startRad);
//         const x2 = CENTER + RADIUS * Math.cos(endRad);
//         const y2 = CENTER + RADIUS * Math.sin(endRad);

//         const pathData = `
//           M ${CENTER} ${CENTER}
//           L ${x1} ${y1}
//           A ${RADIUS} ${RADIUS} 0 ${angle > 180 ? 1 : 0} 1 ${x2} ${y2}
//           Z
//         `;

//         cumulativeAngle += angle;
//         const rawItem = item.rawItem;

//         return (
//           <path
//             key={index}
//             d={pathData}
//             fill={item.color}
//             stroke="#fff"
//             strokeWidth="3"
//             onMouseEnter={(event) => {
//               const consumeTime = getSafeValue(rawItem, "ConsumeTime");

//               setTooltip({
//                 ...buildTooltipData({
//                   item: rawItem,
//                   x: event.clientX,
//                   y: event.clientY,
//                   color: item.color,
//                   display: graphConfig.valueFormatter
//                     ? graphConfig.valueFormatter(item.value)
//                     : formatConsumeTime(consumeTime),
//                 }),
//                 label,
//               });
//             }}
//             onMouseLeave={() => {
//               if (!isTooltipHovered) setTooltip(null);
//             }}
//             onClick={() => {
//               if (config?.onItemClick) config.onItemClick(rawItem);
//             }}
//             className="hover:opacity-90 cursor-pointer transition-opacity"
//             style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.06))" }}
//           />
//         );
//       })}
//     </svg>
//   );
// };

// // ================================================================
// // MAIN WRAPPER
// // ================================================================

// export function ListGraphView() {
//   const { data, config, query } = useList();
//   const [tooltip, setTooltip] = useState(null);
//   const [isTooltipHovered, setIsTooltipHovered] = useState(false);

//   const graphConfig = useMemo(() => {
//     const baseConfig = config?.graphConfig || config;
//     const parsedFilters = query ? parseQuery(query) : {};

//     return typeof baseConfig === "function" ? baseConfig(parsedFilters) : baseConfig;
//   }, [config, query]);

//   if (!data || data.length === 0) return null;

//   return (
//     <div className="w-full h-full flex justify-center items-start p-6 bg-transparent">
//       {graphConfig.graphType === "pie" ? (
//         <PieChartDesign
//           data={data}
//           graphConfig={graphConfig}
//           setTooltip={setTooltip}
//           isTooltipHovered={isTooltipHovered}
//           setIsTooltipHovered={setIsTooltipHovered}
//           config={config}
//         />
//       ) : (
//         <StackedBarDesign
//           data={data}
//           graphConfig={graphConfig}
//           setTooltip={setTooltip}
//           isTooltipHovered={isTooltipHovered}
//           setIsTooltipHovered={setIsTooltipHovered}
//           config={config}
//         />
//       )}

//       <ChartTooltip
//         tooltip={tooltip}
//         graphConfig={graphConfig}
//         setTooltip={setTooltip}
//         isTooltipHovered={isTooltipHovered}
//         setIsTooltipHovered={setIsTooltipHovered}
//       />
//     </div>
//   );
// }

const parseValue = (val) => {
  if (typeof val === "string" && val.includes(":")) {
    const parts = val.split(":");
    return parts.length === 2
      ? parseInt(parts[0], 10) + parseInt(parts[1], 10) / 60
      : parseFloat(val) || 0;
  }
  return parseFloat(val) || 0;
};

const getHashColor = (str) => {
  let hash = 0;
  const safeStr = String(str || "unknown");

  for (let i = 0; i < safeStr.length; i++) {
    hash = safeStr.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }

  const positiveHash = Math.abs(hash);
  const hue = Math.floor((positiveHash * 137.5) % 360);
  const saturation = 40 + (positiveHash % 15);
  const lightness = 40 + (positiveHash % 15);

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const getSafeValue = (obj, key) => {
  if (!obj || key === undefined || key === null) return undefined;

  if (obj[key] !== undefined) return obj[key];

  const keyStr = String(key);
  const camel = keyStr.charAt(0).toLowerCase() + keyStr.slice(1);
  if (obj[camel] !== undefined) return obj[camel];

  const pascal = keyStr.charAt(0).toUpperCase() + keyStr.slice(1);
  if (obj[pascal] !== undefined) return obj[pascal];

  const cleanKey = keyStr.replace(/_/g, "").toLowerCase();

  for (const k in obj) {
    if (k.replace(/_/g, "").toLowerCase() === cleanKey) return obj[k];
  }

  return undefined;
};

const parseValueToMinutes = (val) => {
  if (!val) return 0;

  if (typeof val === "string" && val.includes(":")) {
    const parts = val.split(":");
    const hours = parseInt(parts[0] || "0", 10);
    const minutes = parseInt(parts[1] || "0", 10);
    return hours * 60 + minutes;
  }

  return Math.round(parseFloat(val) * 60) || 0;
};

const formatConsumeTime = (value) => {
  if (!value) return "0h:00";

  if (typeof value === "string" && value.includes(":")) {
    const [h = "0", m = "0"] = value.split(":");
    return `${(+h || 0).toString()}h:${(+m || 0).toString().padStart(2, "0")}`;
  }

  const num = Number(value);
  if (Number.isNaN(num)) return String(value);

  const h = Math.floor(num);
  const m = Math.round((num - h) * 60);

  return `${h}h:${m.toString().padStart(2, "0")}m`;
};

const buildTooltipData = ({ item, x, y, display, color, markerType }) => ({
  rawItem: item,
  x,
  y,
  color,
  display,
  markerType: markerType || null,
});

// ================================================================
// TOOLTIP
// ================================================================

const ChartTooltip = ({
  tooltip,
  graphConfig,
  setTooltip,
  setIsTooltipHovered,
}) => {
  if (!tooltip) return null;

  const raw = tooltip.rawItem;
  const isReportView = ["report"].includes(
    graphConfig.reportMode
  );
  console.log("isReportView", isReportView);

  const getConfiguredValue = (key) => {
    if (!key) return null;
    return getSafeValue(raw, key);
  };

  const formatTooltipValue = (key, formatter) => {
    const value = getConfiguredValue(key);

    if (
      value === undefined ||
      value === null ||
      value === "" ||
      value === "00:00" ||
      value === 0
    ) {
      return null;
    }

    if (typeof formatter === "function") {
      return formatter(value);
    }

    return formatConsumeTime(value);
  };

  const estimateHours = formatTooltipValue(
    graphConfig.tooltipEstimateKey,
    graphConfig.tooltipEstimateFormatter
  );

  const loggedHours = formatTooltipValue(
    graphConfig.tooltipTotalKey,
    graphConfig.tooltipTotalFormatter
  );

  /*
   * ConsumeTime represents the time logged by this record.
   * In report mode the chart groups records by employee, so this
   * gives the per-day/per-record logged duration available to the
   * tooltip.
   */
  const perDayHours = (() => {
    const value = getSafeValue(raw, "ConsumeTime");
    if (
      value === undefined || value === null || value === "" || value === 0 || value === 0.1 || value === "0.1"
    ) {
      return null;
    }
    if (typeof graphConfig.tooltipPerDayFormatter === "function") {
      return graphConfig.tooltipPerDayFormatter(value);
    }

    return formatConsumeTime(value);
  })();

  const handleViewTicket = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const ticketId = raw.navId ?? raw.ticketId ?? raw.issueId ?? raw.Issue_Id;

    if (!ticketId) return;

    const url = tryBuildPath(ROUTE_KEYS.TICKET_DETAIL, { ticketId });
    const newTab = window.open(url, "_blank");

    if (newTab) newTab.opener = null;
  };

  const shortRepoName = (name) => {
    if (!name) return "";

    const words = name.trim().split(/\s+/);

    if (words.length === 1) {
      return name.replace(/\s+/g, "").slice(0, 2).toUpperCase();
    }

    return words.map((word) => word[0]).join("").toUpperCase();
  };

  return (
    <div
      className="fixed min-w-[240px] max-w-[320px] bg-white border border-gray-100 shadow-xl px-3 py-2.5 rounded-lg z-[9999]"
      style={{
        top: Math.max(12, tooltip.y - 80),
        left: tooltip.x + 16,
      }}
      onMouseEnter={() => setIsTooltipHovered(true)}
      onMouseLeave={() => {
        setIsTooltipHovered(false);
        setTooltip(null);
      }}
    >
      <div className="flex items-start justify-between gap-2">
        {isReportView && (
          <div className="text-gray-500 text-[10px] font-semibold">
            {formatDate(raw.updatedAt)}
          </div>
        )}

        {tooltip.markerType && (
          <span className="bg-gray-800 text-white text-[7px] px-1 py-0.5 rounded uppercase tracking-wider shrink-0">
            {tooltip.markerType === "C" ? "Closed" : "Reopened"}
          </span>
        )}
      </div>

      <div className="text-gray-800 text-[12px] font-bold leading-tight mt-1">
        <span className="cursor-help" title={raw.repoName}>
          [{shortRepoName(raw.repoName)}]
        </span>{" "}
        -{" "}
        <span className="cursor-help" title={raw.projectName}>
          {raw.projectName}
        </span>
      </div>

      <div className="text-gray-700 text-[11px] font-semibold mt-0.5 leading-tight">
        #{raw.ticketKey} -{" "}
        {raw.TicketName || raw.ticketName || raw.title}
      </div>

      <div className="text-gray-500 font-medium text-[10px] mt-1.5 flex items-center gap-1">
        <User className="w-2.5 h-2.5" />
        {raw.employeeName || "Unknown Employee"}
      </div>

      {/* Compact Time Information */}
      <div className="flex items-stretch gap-1 mt-1">
        {estimateHours && (
          <div className="flex-1 min-w-0 bg-gray-50 border border-gray-100 rounded px-1.5 py-1 text-center">
            <div className="text-[7px] font-medium text-gray-400 uppercase leading-none">
              Estimate
            </div>
            <div className="text-[9px] font-bold text-gray-700 mt-0.5 whitespace-nowrap leading-none">
              {estimateHours}
            </div>
          </div>
        )}

        {loggedHours && (
          <div className="flex-1 min-w-0 bg-gray-50 border border-gray-100 rounded px-1.5 py-1 text-center">
            <div className="text-[7px] font-medium text-gray-400 uppercase leading-none">
              Logged
            </div>
            <div className="text-[9px] font-bold text-gray-700 mt-0.5 whitespace-nowrap leading-none">
              {loggedHours}
            </div>
          </div>
        )}

        {perDayHours && (
          <div className="flex-1 min-w-0 bg-gray-50 border border-gray-100 rounded px-1.5 py-1 text-center">
            <div className="text-[7px] font-medium text-gray-400 uppercase leading-none">
              Per Day
            </div>
            <div className="text-[9px] font-bold text-gray-700 mt-0.5 whitespace-nowrap leading-none">
              {perDayHours}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-end justify-end gap-1.5 mt-2">
        <button
          type="button"
          className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md border border-indigo-100"
          onClick={handleViewTicket}
        >
          View →
        </button>
      </div>
    </div>
  )
};

// ================================================================
// STACKED BAR GRAPH
// ================================================================

const StackedBarDesign = ({
  data,
  graphConfig,
  setTooltip,
  config,
  isTooltipHovered,
  setIsTooltipHovered,
}) => {
  const scrollRef = useRef(null);
  const measureRef = useRef(null);
  const [containerW, setContainerW] = useState(0);

  useLayoutEffect(() => {
    if (!measureRef.current) return undefined;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect?.width || 0;
      if (width > 0) setContainerW(width);
    });

    observer.observe(measureRef.current);
    return () => observer.disconnect();
  }, []);

  const yAxisW = 60;
  const xAxisH = graphConfig.reportMode === "report" ? 60 : 45;
  const padTop = 40;
  const maxVisibleY = graphConfig.reportMode === "report" ? 16 : 12;
  const minVisibleY = graphConfig.minYValue ?? 0;
  const step = graphConfig.yAxisStep || 2;

  const getStatus = useCallback((item) => {
    return String(getSafeValue(item, "threadStatusName") || "")
      .trim()
      .toLowerCase();
  }, []);

  const getUpdatedAt = useCallback((item) => {
    return getSafeValue(item, "updatedAt") ?? getSafeValue(item, "UpdatedAt");
  }, []);

  const getTicketId = useCallback((item) => {
    return (
      getSafeValue(item, "navId") ??
      getSafeValue(item, "ticketId") ??
      getSafeValue(item, "issueId") ??
      getSafeValue(item, "Issue_Id") ??
      item.rawId ??
      "unknown"
    );
  }, []);

  const getConsumeTime = useCallback((item) => {
    return getSafeValue(item, "ConsumeTime");
  }, []);

  const hasNoConsumeTime = useCallback(
    (item) => {
      const consumeTime = getConsumeTime(item);

      return (
        consumeTime == null ||
        consumeTime === "" ||
        (typeof consumeTime === "string" && consumeTime.trim() === "")
      );
    },
    [getConsumeTime]
  );

  const latestStatusMap = useMemo(() => {
    const map = new Map();

    data.forEach((item) => {
      const status = getStatus(item);
      const isClosed = status === "closed";
      const isReopened = status === "reopened";

      if (!isClosed && !isReopened) return;

      const ticketId = String(getTicketId(item));
      const updatedAt = getUpdatedAt(item);
      const currentTime = new Date(updatedAt || 0).getTime();
      const existing = map.get(ticketId);
      const existingTime = existing
        ? new Date(existing.updatedAt || 0).getTime()
        : -Infinity;

      if (!existing || currentTime >= existingTime) {
        map.set(ticketId, {
          item,
          updatedAt,
          markerType: isClosed ? "C" : "R",
        });
      }
    });

    return map;
  }, [data, getStatus, getTicketId, getUpdatedAt]);

  const originalColorMap = useMemo(() => {
    const map = new Map();

    data.forEach((item) => {
      const ticketId = String(getTicketId(item));
      const consumeTime = getConsumeTime(item);

      const isStatusOnly =
        hasNoConsumeTime(item) &&
        ["closed", "reopened"].includes(getStatus(item));

      if (isStatusOnly || map.has(ticketId)) return;

      const configuredColor =
        typeof graphConfig.graphColorKey === "function"
          ? graphConfig.graphColorKey(item)
          : getSafeValue(item, graphConfig.graphColorKey);

      map.set(ticketId, configuredColor || getHashColor(ticketId));
    });

    data.forEach((item) => {
      const ticketId = String(getTicketId(item));
      if (map.has(ticketId)) return;

      const configuredColor =
        typeof graphConfig.graphColorKey === "function"
          ? graphConfig.graphColorKey(item)
          : getSafeValue(item, graphConfig.graphColorKey);

      map.set(ticketId, configuredColor || getHashColor(ticketId));
    });

    return map;
  }, [data, graphConfig, getTicketId, getConsumeTime, hasNoConsumeTime, getStatus]);

  const getLatestMarkerType = useCallback(
    (item) => {
      const status = getStatus(item);
      const isClosed = status === "closed";
      const isReopened = status === "reopened";

      if (!isClosed && !isReopened) return null;

      const ticketId = String(getTicketId(item));
      const latest = latestStatusMap.get(ticketId);
      if (!latest) return null;

      const itemUpdatedAt = getUpdatedAt(item);

      if (String(itemUpdatedAt || "") !== String(latest.updatedAt || "")) {
        return null;
      }

      return latest.markerType;
    },
    [getStatus, getTicketId, getUpdatedAt, latestStatusMap]
  );

  const isValidGraphRecord = useCallback(
    (item) => {
      const consumeTime = getConsumeTime(item);
      const status = getStatus(item);
      const isClosed = status === "closed";
      const isReopened = status === "reopened";
      const isNullConsume = hasNoConsumeTime(item);
      const latestMarker = getLatestMarkerType(item);

      const isLatestStatusMarker =
        isNullConsume &&
        (isClosed || isReopened) &&
        latestMarker != null;

      return !isNullConsume || isLatestStatusMarker;
    },
    [getConsumeTime, getStatus, hasNoConsumeTime, getLatestMarkerType]
  );

  const xaxis = useMemo(() => {
    if (graphConfig.graphXAxis?.length > 0) {
      return graphConfig.graphXAxis.filter((column) =>
        data.some((item) => {
          if (!isValidGraphRecord(item)) return false;

          if (graphConfig.reportMode === "report") {
            const employeeId =
              getSafeValue(item, "EmployeeID") ??
              getSafeValue(item, "employeeId");

            return (
              employeeId !== undefined &&
              String(employeeId) === String(column.key)
            );
          }

          const markerType = getLatestMarkerType(item);
          const rawDate = markerType
            ? getUpdatedAt(item)
            : getSafeValue(item, graphConfig.graphXAxisKey);

          const xKey = graphConfig.isDateAxis
            ? rawDate
              ? String(rawDate).split("T")[0]
              : null
            : rawDate;

          return xKey != null && String(xKey) === String(column.key);
        })
      );
    }

    if (graphConfig.reportMode === "report") {
      const employeeMap = new Map();

      data.forEach((item) => {
        if (!isValidGraphRecord(item)) return;

        const employeeId =
          getSafeValue(item, "EmployeeID") ??
          getSafeValue(item, "employeeId");

        if (employeeId === undefined) return;

        const employeeName =
          getSafeValue(item, "EmployeeName") ??
          getSafeValue(item, "employeeName");

        const key = String(employeeId);

        if (!employeeMap.has(key)) {
          employeeMap.set(key, {
            key,
            label: employeeName,
            employeeId,
            employeeName,
          });
        }
      });

      return Array.from(employeeMap.values()).sort((a, b) => {
        const aName = a.employeeName?.trim() || "Unknown";
        const bName = b.employeeName?.trim() || "Unknown";

        if (aName === "Unknown") return 1;
        if (bName === "Unknown") return -1;

        return aName.localeCompare(bName, undefined, {
          sensitivity: "base",
        });
      });
    }

    const keys = [
      ...new Set(
        data
          .filter(isValidGraphRecord)
          .map((item) => {
            const markerType = getLatestMarkerType(item);
            const rawDate = markerType
              ? getUpdatedAt(item)
              : getSafeValue(item, graphConfig.graphXAxisKey);

            return graphConfig.isDateAxis
              ? rawDate
                ? String(rawDate).split("T")[0]
                : null
              : rawDate;
          })
          .filter(Boolean)
      ),
    ].sort();

    return keys.map((key) => ({
      key,
      label: graphConfig.isDateAxis ? dayjs(key).format("DD MMM") : key,
    }));
  }, [
    data,
    graphConfig,
    isValidGraphRecord,
    getLatestMarkerType,
    getUpdatedAt,
  ]);

  const chartData = useMemo(() => {
    const grouped = {};
    xaxis.forEach((column) => (grouped[column.key] = {}));

    data.forEach((item) => {
      const status = getStatus(item);
      const isClosed = status === "closed";
      const isReopened = status === "reopened";
      const consumeTime = getConsumeTime(item);
      const isNullConsume = hasNoConsumeTime(item);
      const markerType = getLatestMarkerType(item);

      const isStatusMarker =
        isNullConsume &&
        (isClosed || isReopened) &&
        markerType != null;

      if (isNullConsume && !isStatusMarker) return;

      let xKey;

      if (graphConfig.reportMode === "report") {
        const employeeId =
          getSafeValue(item, "EmployeeID") ??
          getSafeValue(item, "employeeId");

        xKey = employeeId !== undefined ? String(employeeId) : null;
      } else {
        const rawDate = isStatusMarker
          ? getUpdatedAt(item)
          : getSafeValue(item, graphConfig.graphXAxisKey);

        xKey = graphConfig.isDateAxis
          ? rawDate
            ? String(rawDate).split("T")[0]
            : null
          : rawDate;
      }

      if (xKey == null || !grouped[xKey]) return;

      const employeeId =
        getSafeValue(item, "EmployeeID") ??
        getSafeValue(item, "employeeId");

      const employeeName =
        getSafeValue(item, "EmployeeName") ??
        getSafeValue(item, "employeeName");

      const uniqueId = getTicketId(item);
      const ticketId = String(uniqueId);

      const ticketName =
        getSafeValue(item, "TicketName") ??
        getSafeValue(item, "ticketName") ??
        getSafeValue(item, "title") ??
        getSafeValue(item, "issueName") ??
        "Unknown Ticket";

      const finalColor =
        originalColorMap.get(ticketId) || getHashColor(ticketId);

      const effectiveConsumeTime = isStatusMarker ? "00:05" : consumeTime;
      const rawValue = getSafeValue(item, graphConfig.graphValueKey);
      const isMarker = rawValue === 0.1 || rawValue === "0.1";

      const minutes = isMarker
        ? 0
        : parseValueToMinutes(effectiveConsumeTime);

      if (minutes <= 0 && !isMarker) return;

      const segmentKey = isStatusMarker
        ? `${ticketId}__STATUS__${xKey}__${markerType}`
        : ticketId;

      if (!grouped[xKey][segmentKey]) {
        const rawLabel =
          typeof graphConfig.graphLabelKey === "function"
            ? graphConfig.graphLabelKey(item)
            : getSafeValue(item, graphConfig.graphLabelKey);

        grouped[xKey][segmentKey] = {
          rawItem: item,
          history: [item],
          totalMins: minutes,
          value: minutes / 60,
          label:
            graphConfig.reportMode === "report"
              ? ticketName
              : rawLabel || "Unknown",
          employeeId: employeeId != null ? String(employeeId) : "",
          employeeName: employeeName || "Unknown Employee",
          repoName:
            getSafeValue(item, "repoKey") ??
            getSafeValue(item, "RepoKey") ??
            getSafeValue(item, "repoName") ??
            getSafeValue(item, "RepoName") ??
            "Unknown Repository",
          projectName:
            getSafeValue(item, "projectName") ??
            getSafeValue(item, "ProjectName") ??
            getSafeValue(item, "project") ??
            "Unknown Project",
          ticketKey:
            getSafeValue(item, "ticketKey") ??
            getSafeValue(item, "TicketKey") ??
            "-",
          ticketName,
          createdAt:
            getSafeValue(item, "createdAt") ??
            getSafeValue(item, "CreatedAt"),
          consumeTime: effectiveConsumeTime ?? "0",
          color: finalColor,
          recordCount: 1,
          noConsumeTime: isNullConsume,
          latestUpdatedAt: getUpdatedAt(item),
          markerType: isStatusMarker ? markerType : null,
        };

        return;
      }

      const segment = grouped[xKey][segmentKey];
      segment.history.push(item);
      segment.totalMins += minutes;
      segment.value = segment.totalMins / 60;
      segment.recordCount += 1;

      const currentUpdatedAt = getUpdatedAt(item);
      const previousUpdatedAt = segment.latestUpdatedAt;
      const currentTime = new Date(currentUpdatedAt || 0).getTime();
      const previousTime = new Date(previousUpdatedAt || 0).getTime();

      if (currentTime >= previousTime) {
        segment.latestUpdatedAt = currentUpdatedAt;
        segment.rawItem = item;

        segment.repoName =
          getSafeValue(item, "repoKey") ??
          getSafeValue(item, "RepoKey") ??
          getSafeValue(item, "repoName") ??
          getSafeValue(item, "RepoName") ??
          "Unknown Repository";

        segment.projectName =
          getSafeValue(item, "projectName") ??
          getSafeValue(item, "ProjectName") ??
          getSafeValue(item, "project") ??
          "Unknown Project";

        segment.ticketKey =
          getSafeValue(item, "ticketKey") ??
          getSafeValue(item, "TicketKey") ??
          "-";

        segment.ticketName =
          getSafeValue(item, "TicketName") ??
          getSafeValue(item, "ticketName") ??
          getSafeValue(item, "title") ??
          getSafeValue(item, "issueName") ??
          "Unknown Ticket";

        segment.employeeName =
          getSafeValue(item, "EmployeeName") ??
          getSafeValue(item, "employeeName") ??
          "Unknown Employee";

        segment.createdAt =
          getSafeValue(item, "createdAt") ??
          getSafeValue(item, "CreatedAt");

        segment.consumeTime = effectiveConsumeTime ?? "0";
        segment.markerType = segment.markerType || null;
        segment.color = finalColor;
      }
    });

    const finalGrouped = {};

    Object.keys(grouped).forEach((xKey) => {
      const segments = Object.values(grouped[xKey]);
      if (!segments.length) return;

      finalGrouped[xKey] = segments;

      segments.forEach((segment) => {
        segment.markerType = segment.markerType || null;

        const ticketId = String(getTicketId(segment.rawItem));

        segment.color =
          originalColorMap.get(ticketId) ||
          segment.color ||
          getHashColor(ticketId);

        segment.display = graphConfig.valueFormatter
          ? graphConfig.valueFormatter(segment.value)
          : formatConsumeTime(segment.consumeTime);
      });
    });

    return finalGrouped;
  }, [
    data,
    graphConfig,
    xaxis,
    getStatus,
    getUpdatedAt,
    getTicketId,
    getConsumeTime,
    hasNoConsumeTime,
    getLatestMarkerType,
    originalColorMap,
  ]);

  const dataMaxY = useMemo(() => {
    let max = 0;

    Object.values(chartData).forEach((stack) => {
      const total = stack.reduce((sum, item) => sum + (item.value || 0), 0);
      if (total > max) max = total;
    });

    return max;
  }, [chartData]);

  const maxY = Math.max(minVisibleY, Math.ceil(dataMaxY / step) * step);
  const baseInnerH = 250;

  const unitH =
    baseInnerH / Math.min(Math.max(maxY, 1), maxVisibleY);

  const innerH = maxY * unitH;

  const minItemW = graphConfig.reportMode === "report" ? 110 : 100;

  const requiredInnerW = Math.max(xaxis.length, 1) * minItemW;
  const availableInnerW = Math.max(0, containerW - yAxisW);
  const innerW = Math.max(availableInnerW, requiredInnerW);

  const totalW = yAxisW + innerW;
  const scrollbarBuffer = totalW > containerW ? 12 : 0;

  const viewportMaxH =
    baseInnerH + padTop + xAxisH + scrollbarBuffer;

  const totalH = innerH + padTop + xAxisH;
  const ticks = [];

  for (let i = 0; i <= Math.max(maxY, maxVisibleY); i += step) {
    ticks.push(i);
  }

  const getYPos = (value) => padTop + innerH - value * unitH;
  const axisSignature = xaxis.map((x) => x.key).join("|");

  useEffect(() => {
    const snapPositions = () => {
      if (!scrollRef.current) return;

      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      scrollRef.current.scrollLeft = 0;
    };

    snapPositions();

    const timeout1 = setTimeout(snapPositions, 50);
    const timeout2 = setTimeout(snapPositions, 200);

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    };
  }, [maxY, axisSignature, containerW]);

  return (
    <div className="w-full z-10 mx-auto rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col relative">
      <div ref={measureRef} className="w-full h-0 pointer-events-none" />

      <style>{`
        @keyframes smoothDrop {
          0% {
            transform: translateY(-600px);
            opacity: 0;
          }
          5% { opacity: 1; }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        .animate-fade-in {
          animation: fadeIn 0.8s ease-in 0.3s forwards;
          opacity: 0;
        }
      `}</style>

      <svg width="0" height="0" className="absolute pointer-events-none">
        <defs>
          <linearGradient id="cylinderShine" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#000" stopOpacity="0.12" />
            <stop offset="30%" stopColor="#fff" stopOpacity="0.15" />
            <stop offset="65%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.15" />
          </linearGradient>

          <linearGradient id="topShine" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>

          <pattern
            id="diagonalStripes"
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="2.5" height="6" fill="#ffffff" fillOpacity="0.6" />
          </pattern>

          <marker id="arrowhead" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
            <polygon points="0 0, 5 2.5, 0 5" fill="#1e293b" />
          </marker>
        </defs>
      </svg>

      {containerW > 0 && (
        <div
          ref={scrollRef}
          className="overflow-auto custom-scrollbar relative"
          style={{ maxHeight: `${viewportMaxH}px` }}
        >
          <div
            style={{ minWidth: `${totalW}px`, height: `${totalH}px` }}
            className="relative bg-white"
          >
            <div
              className="sticky left-0 top-0 z-20 bg-white/95 backdrop-blur-sm border-r border-gray-100"
              style={{ width: yAxisW, height: innerH + padTop, float: "left" }}
            >
              {ticks.map((value) => (
                <div
                  key={`y-${value}`}
                  className="absolute w-full text-right pr-3 text-[11px] font-bold text-gray-400"
                  style={{ top: getYPos(value) - 7 }}
                >
                  {value}h
                </div>
              ))}
            </div>

            <svg
              className="absolute top-0"
              style={{ left: yAxisW }}
              width={innerW}
              height={innerH + padTop}
            >
              {ticks.map((value) => (
                <line
                  key={`grid-${value}`}
                  x1={0}
                  x2={innerW}
                  y1={getYPos(value)}
                  y2={getYPos(value)}
                  stroke="#f1f5f9"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
              ))}

              {xaxis.map((column, index) => {
                const segmentW = innerW / Math.max(xaxis.length, 1);
                const barW = Math.min(50, segmentW - 20);
                const safeBarW = Math.max(barW, 4);
                const rx = safeBarW / 2;
                const ry = Math.min(10, safeBarW / 4);
                const x = index * segmentW + (segmentW - safeBarW) / 2;

                let currentY = padTop + innerH - ry;

                const dayTotalMins = (chartData[column.key] || []).reduce(
                  (sum, item) => sum + (item.totalMins || 0),
                  0
                );

                const dayTotalValue = dayTotalMins / 60;

                const dayTotalDisplay = graphConfig.valueFormatter
                  ? graphConfig.valueFormatter(dayTotalValue)
                  : formatConsumeTime(dayTotalValue);

                return (
                  <g key={column.key}>
                    {(chartData[column.key] || []).map((item, segmentIndex) => {
                      const height = Math.max(6, item.value * unitH);
                      const y = currentY - height;
                      currentY = y;

                      return (
                        <g
                          key={`${column.key}-${segmentIndex}`}
                          style={{
                            animation: `smoothDrop 0.6s cubic-bezier(0.25, 1, 0.5, 1) ${segmentIndex * 0.1}s forwards`,
                            opacity: 0,
                          }}
                        >
                          <g
                            style={{
                              transformOrigin: `${x + safeBarW / 2}px ${y + height / 2}px`,
                            }}
                            className="cursor-pointer transition-transform duration-300 hover:scale-[1.12]"
                            onMouseEnter={(event) => {
                              setTooltip(
                                buildTooltipData({
                                  item: item.rawItem,
                                  x: event.clientX,
                                  y: event.clientY,
                                  color: item.color,
                                  markerType: item.markerType,
                                  display: graphConfig.tooltipFormatter
                                    ? graphConfig.tooltipFormatter(item.rawItem)
                                    : formatConsumeTime(item.consumeTime),
                                })
                              );
                            }}
                            onMouseLeave={() => {
                              if (!isTooltipHovered) setTooltip(null);
                            }}
                            onClick={() => {
                              if (config?.onItemClick) {
                                config.onItemClick({
                                  ...item.rawItem,
                                  history: item.history,
                                });
                              }
                            }}
                          >
                            <path
                              d={`
                                M ${x} ${y}
                                L ${x} ${y + height}
                                A ${rx} ${ry} 0 0 0 ${x + safeBarW} ${y + height}
                                L ${x + safeBarW} ${y}
                                Z
                              `}
                              fill={item.color}
                              stroke="#ffffff"
                              strokeWidth="1.5"
                              strokeLinejoin="round"
                            />

                            <path
                              d={`
                                M ${x} ${y}
                                L ${x} ${y + height}
                                A ${rx} ${ry} 0 0 0 ${x + safeBarW} ${y + height}
                                L ${x + safeBarW} ${y}
                                Z
                              `}
                              fill="url(#cylinderShine)"
                            />

                            <ellipse
                              cx={x + rx}
                              cy={y}
                              rx={rx}
                              ry={ry}
                              fill={item.color}
                              stroke="#ffffff"
                              strokeWidth="1.5"
                            />

                            <ellipse
                              cx={x + rx}
                              cy={y}
                              rx={rx}
                              ry={ry}
                              fill="url(#topShine)"
                            />

                            {item.markerType && (
                              <g className="pointer-events-none">
                                <path
                                  d={`
                                    M ${x} ${y}
                                    L ${x} ${y + height}
                                    A ${rx} ${ry} 0 0 0 ${x + safeBarW} ${y + height}
                                    L ${x + safeBarW} ${y}
                                    Z
                                  `}
                                  fill="url(#diagonalStripes)"
                                />

                                <ellipse
                                  cx={x + rx}
                                  cy={y}
                                  rx={rx}
                                  ry={ry}
                                  fill="url(#diagonalStripes)"
                                />

                                <line
                                  x1={x + safeBarW + 13}
                                  y1={y + height / 2}
                                  x2={x + safeBarW + 3}
                                  y2={y + height / 2}
                                  stroke="#1e293b"
                                  strokeWidth="1.5"
                                  markerEnd="url(#arrowhead)"
                                />

                                <circle
                                  cx={x + safeBarW + 18}
                                  cy={y + height / 2}
                                  r="5.5"
                                  fill="#1e293b"
                                  stroke="#ffffff"
                                  strokeWidth="1"
                                />

                                <text
                                  x={x + safeBarW + 18}
                                  y={y + height / 2 + 2.5}
                                  fill="#ffffff"
                                  fontSize="7"
                                  fontWeight="bold"
                                  textAnchor="middle"
                                >
                                  {item.markerType}
                                </text>
                              </g>
                            )}
                          </g>
                        </g>
                      );
                    })}

                    {dayTotalValue > 0 && (
                      <text
                        x={x + rx}
                        y={currentY - 10}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="700"
                        fill="#64748b"
                        className="animate-fade-in pointer-events-none"
                      >
                        {dayTotalDisplay}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            <div
              className="sticky bottom-0 z-30 flex bg-white border-t border-gray-100"
              style={{ width: "100%", height: xAxisH, clear: "both" }}
            >
              <div
                className="sticky left-0 z-40 bg-white border-r border-gray-100"
                style={{ width: yAxisW, height: "100%" }}
              />

              <div className="relative" style={{ width: innerW }}>
                {xaxis.map((column, index) => {
                  const segmentW = innerW / Math.max(xaxis.length, 1);

                  return (
                    <div
                      key={column.key}
                      className={`absolute text-[11px] font-bold text-gray-500 whitespace-nowrap transform -translate-x-1/2 ${graphConfig.reportMode === "report"
                        ? "max-w-[110px] overflow-hidden text-ellipsis text-center"
                        : ""
                        }`}
                      style={{
                        left: index * segmentW + segmentW / 2,
                        top:
                          graphConfig.reportMode === "report"
                            ? "10px"
                            : "12px",
                        width:
                          graphConfig.reportMode === "report"
                            ? "110px"
                            : "auto",
                      }}
                      title={column.label}
                    >
                      {column.label}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ================================================================
// PIE CHART
// ================================================================

const PieChartDesign = ({
  data,
  graphConfig,
  setTooltip,
  config,
  isTooltipHovered,
  setIsTooltipHovered,
}) => {
  const SIZE = graphConfig.pieSize || 400;
  const RADIUS = SIZE / 2.8;
  const CENTER = SIZE / 2;

  const grouped = useMemo(() => {
    return data.reduce((accumulator, item) => {
      const category =
        getSafeValue(item, graphConfig.graphCategoryKey) || "Other";

      const value = parseValue(
        getSafeValue(item, graphConfig.graphValueKey)
      );

      if (!accumulator[category]) {
        accumulator[category] = {
          value: 0,
          rawItem: item,
          color:
            getSafeValue(item, graphConfig.graphColorKey) ||
            getHashColor(category),
        };
      }

      accumulator[category].value += value;
      return accumulator;
    }, {});
  }, [data, graphConfig]);

  const total = Object.values(grouped).reduce(
    (sum, item) => sum + item.value,
    0
  );

  let cumulativeAngle = 0;

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full h-auto max-w-[400px]">
      {Object.entries(grouped).map(([label, item], index) => {
        if (!total) return null;

        const angle = (item.value / total) * 360;

        const startRad = (Math.PI * (cumulativeAngle - 90)) / 180;
        const endRad = (Math.PI * (cumulativeAngle + angle - 90)) / 180;

        const x1 = CENTER + RADIUS * Math.cos(startRad);
        const y1 = CENTER + RADIUS * Math.sin(startRad);
        const x2 = CENTER + RADIUS * Math.cos(endRad);
        const y2 = CENTER + RADIUS * Math.sin(endRad);

        const pathData = `
          M ${CENTER} ${CENTER}
          L ${x1} ${y1}
          A ${RADIUS} ${RADIUS}
            0
            ${angle > 180 ? 1 : 0}
            1
            ${x2} ${y2}
          Z
        `;

        cumulativeAngle += angle;

        const rawItem = item.rawItem;

        return (
          <path
            key={index}
            d={pathData}
            fill={item.color}
            stroke="#fff"
            strokeWidth="3"
            onMouseEnter={(event) => {
              const consumeTime = getSafeValue(rawItem, "ConsumeTime");

              setTooltip({
                ...buildTooltipData({
                  item: rawItem,
                  x: event.clientX,
                  y: event.clientY,
                  color: item.color,
                  display: graphConfig.valueFormatter
                    ? graphConfig.valueFormatter(item.value)
                    : formatConsumeTime(consumeTime),
                }),
                label,
              });
            }}
            onMouseLeave={() => {
              if (!isTooltipHovered) setTooltip(null);
            }}
            onClick={() => {
              if (config?.onItemClick) config.onItemClick(rawItem);
            }}
            className="hover:opacity-90 cursor-pointer transition-opacity"
            style={{
              filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.06))",
            }}
          />
        );
      })}
    </svg>
  );
};

// ================================================================
// MAIN WRAPPER
// ================================================================

export function ListGraphView() {
  const { data, config, query } = useList();

  const [tooltip, setTooltip] = useState(null);
  const [isTooltipHovered, setIsTooltipHovered] = useState(false);

  const graphConfig = useMemo(() => {
    const baseConfig = config?.graphConfig || config;
    const parsedFilters = query ? parseQuery(query) : {};


    return typeof baseConfig === "function"
      ? baseConfig(parsedFilters)
      : baseConfig;
  }, [config, query]);
  console.log("graphConfig", graphConfig);

  if (!data || data.length === 0) return null;

  return (
    <div className="w-full h-full flex justify-center items-start p-6 bg-transparent">
      {graphConfig.graphType === "pie" ? (
        <PieChartDesign
          data={data}
          graphConfig={graphConfig}
          setTooltip={setTooltip}
          isTooltipHovered={isTooltipHovered}
          setIsTooltipHovered={setIsTooltipHovered}
          config={config}
        />
      ) : (
        <StackedBarDesign
          data={data}
          graphConfig={graphConfig}
          setTooltip={setTooltip}
          isTooltipHovered={isTooltipHovered}
          setIsTooltipHovered={setIsTooltipHovered}
          config={config}
        />
      )}

      <ChartTooltip
        tooltip={tooltip}
        graphConfig={graphConfig}
        setTooltip={setTooltip}
        isTooltipHovered={isTooltipHovered}
        setIsTooltipHovered={setIsTooltipHovered}
      />
    </div>
  );
}
