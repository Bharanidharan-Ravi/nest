import React, {
  useState,
  useMemo,
  useRef,
  useLayoutEffect,
  useEffect,
} from "react";
import dayjs from "dayjs";
import { useList } from "../context/ListContext";
import { parseQuery } from "../hooks/useQueryParser";

const parseValue = (val) => {
  if (typeof val === "string" && val.includes(":")) {
    const parts = val.split(":");
    return parts.length === 2
      ? parseInt(parts[0]) + parseInt(parts[1]) / 60
      : parseFloat(val) || 0;
  }
  return parseFloat(val) || 0;
};

// Mild, Soft SaaS Color Palette
const MILD_COLORS = [
  "#818CF8",
  "#34D399",
  "#FBBF24",
  "#F472B6",
  "#38BDF8",
  "#A78BFA",
  "#2DD4BF",
  "#FB7185",
  "#A3E635",
  "#FACC15",
  "#60A5FA",
  "#4ADE80",
  "#F87171",
  "#818CF8",
  "#C084FC",
];

// String Hash Engine for permanent colors
// const getHashColor = (str) => {
//     let hash = 0;
//     const safeStr = String(str || "unknown");
//     for (let i = 0; i < safeStr.length; i++) {
//         hash = safeStr.charCodeAt(i) + ((hash << 5) - hash);
//     }
//     return MILD_COLORS[Math.abs(hash) % MILD_COLORS.length];
// };
// String Hash Engine for permanent, non-overlapping colors
// String Hash Engine for permanent, soft SaaS colors
// String Hash Engine for permanent, clean SaaS colors
const getHashColor = (str) => {
  let hash = 0;
  const safeStr = String(str || "unknown");

  // 1. Better Hash Algorithm (Standard 32-bit String Hash)
  // Using bitwise math instead of basic multiplication spreads the data perfectly.
  for (let i = 0; i < safeStr.length; i++) {
    hash = safeStr.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32-bit integer
  }

  const positiveHash = Math.abs(hash);

  // 2. HUE (0-360): The Golden Angle (137.5) ensures that sequential hashes
  // never land near each other on the color wheel. No more green clumping!
  const hue = Math.floor((positiveHash * 137.5) % 360);

  // 3. SATURATION & LIGHTNESS: Using your updated ranges for that deep, rich look.
  const saturation = 40 + (positiveHash % 15); // 45-60%
  const lightness = 40 + (positiveHash % 15); // 40-55%

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};
// 🚀 ENHANCED: Strips underscores and ignores case so 'issueId' easily finds 'Issue_Id'
const getSafeValue = (obj, key) => {
  if (!obj || key === undefined || key === null) return undefined;
  if (obj[key] !== undefined) return obj[key];

  const keyStr = String(key);
  const camel = keyStr.charAt(0).toLowerCase() + keyStr.slice(1);
  if (obj[camel] !== undefined) return obj[camel];

  const pascal = keyStr.charAt(0).toUpperCase() + keyStr.slice(1);
  if (obj[pascal] !== undefined) return obj[pascal];

  // Fallback: Strip underscores and check case-insensitively
  const cleanKey = keyStr.replace(/_/g, "").toLowerCase();
  for (const k in obj) {
    if (k.replace(/_/g, "").toLowerCase() === cleanKey) {
      return obj[k];
    }
  }
  return undefined;
};
const parseValueToMinutes = (val) => {
  if (!val) return 0;
  if (typeof val === "string" && val.includes(":")) {
    const parts = val.split(":");
    // Force Base-10 to prevent "08" and "09" minutes from becoming 0
    return parseInt(parts[0] || "0", 10) * 60 + parseInt(parts[1] || "0", 10);
  }
  return Math.round(parseFloat(val) * 60) || 0;
};
// --- MODERN 3D CYLINDER GRAPH ---
const StackedBarDesign = ({ data, graphConfig, setTooltip, config }) => {
  const scrollRef = useRef(null);
  const measureRef = useRef(null);
  const [containerW, setContainerW] = useState(0);
  useLayoutEffect(() => {
    if (!measureRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      if (width > 0) setContainerW(width);
    });
    observer.observe(measureRef.current);
    return () => observer.disconnect();
  }, []);

  const yAxisW = 60;
  const xAxisH = 45;
  const padTop = 40;

  const maxVisibleY = 12;
  const minVisibleY = graphConfig.minYValue || 8;
  const step = graphConfig.yAxisStep || 2;

  const xaxis = useMemo(() => {
    if (graphConfig.graphXAxis?.length > 0) return graphConfig.graphXAxis;

    const keys = [
      ...new Set(
        data
          .map((item) => {
            const rawDate = getSafeValue(item, graphConfig.graphXAxisKey);

            return graphConfig.isDateAxis
              ? rawDate
                ? rawDate.split("T")[0]
                : null
              : rawDate;
          })
          .filter(Boolean),
      ),
    ].sort();

    return keys.map((k) => ({
      key: k,
      label: dayjs(k).format("DD MMM"),
    }));
  }, [data, graphConfig]);

  const chartData = useMemo(() => {
    const grouped = {};
    xaxis.forEach((col) => (grouped[col.key] = {}));
console.log("data :", data);

    data.forEach((item) => {
      const rawDate = getSafeValue(item, graphConfig.graphXAxisKey);
      const xKey = graphConfig.isDateAxis
        ? rawDate
          ? rawDate.split("T")[0]
          : null
        : rawDate;

      if (!grouped[xKey]) return;

      const rawVal = getSafeValue(item, graphConfig.graphValueKey);
      const isMarker = rawVal === 0.1 || rawVal === "0.1";

      let mins = 0;
      if (!isMarker) {
        mins = parseValueToMinutes(rawVal);
      }

      // Accept actual values > 0 OR the fake 0.1 marker
      if (mins > 0 || isMarker) {
        const rawGroupId =
          typeof graphConfig.graphGroupIdKey === "function"
            ? graphConfig.graphGroupIdKey(item)
            : getSafeValue(item, graphConfig.graphGroupIdKey);

        const uniqueId = rawGroupId || item.rawId || "unknown";

        const configuredColor =
          typeof graphConfig.graphColorKey === "function"
            ? graphConfig.graphColorKey(item)
            : getSafeValue(item, graphConfig.graphColorKey);

        const finalColor = configuredColor || getHashColor(uniqueId);

        if (!grouped[xKey][uniqueId]) {
          const rawLabel =
            typeof graphConfig.graphLabelKey === "function"
              ? graphConfig.graphLabelKey(item)
              : getSafeValue(item, graphConfig.graphLabelKey);

          grouped[xKey][uniqueId] = {
            rawItem: item,
            totalMins: 0, // NEW: Track exact minutes
            value: 0,
            label: rawLabel || "Unknown",
            color: finalColor,
            recordCount: 0,
          };
        }

        // 🚀 FIX: Sum pure minutes to stop float degradation, then convert to hours safely
        grouped[xKey][uniqueId].totalMins += mins;
        grouped[xKey][uniqueId].value = isMarker
          ? 0
          : grouped[xKey][uniqueId].totalMins / 60;
        grouped[xKey][uniqueId].recordCount += 1;

        // ... Marker assignments ...
        const rawStatus = getSafeValue(item, graphConfig.terminalStatusKey);
        if (Number(rawStatus) === 15 || Number(rawStatus) === 16) {
          grouped[xKey][uniqueId].markerType = "C";
        }

        if (
          String(item.threadStatusName || "")
            .toLowerCase()
            .includes("reopened")
        ) {
          grouped[xKey][uniqueId].markerType = "R";
        }
      }
    });

    const finalGrouped = {};
    Object.keys(grouped).forEach((xKey) => {
      finalGrouped[xKey] = Object.values(grouped[xKey]);
      finalGrouped[xKey].forEach((seg) => {
        // seg.isTerminal =
        //   seg.terminalCount > 0 && seg.terminalCount === seg.recordCount;
        seg.markerType = seg.markerType || null;
        seg.display = graphConfig.valueFormatter
          ? graphConfig.valueFormatter(seg.value)
          : seg.value;
      });
    });

    return finalGrouped;
  }, [data, graphConfig, xaxis]);

  const dataMaxY = useMemo(() => {
    let max = 0;
    Object.values(chartData).forEach((stack) => {
      const total = stack.reduce((sum, item) => sum + item.value, 0);
      if (total > max) max = total;
    });
    return max;
  }, [chartData]);

  const maxY = Math.max(minVisibleY, Math.ceil(dataMaxY / step) * step);
  const baseInnerH = 250;
  const unitH = baseInnerH / Math.min(maxY, maxVisibleY);
  const innerH = maxY * unitH;

  const minItemW = 75;
  const requiredInnerW = xaxis.length * minItemW;
  const availableInnerW = Math.max(0, containerW - yAxisW);
  const innerW = Math.max(availableInnerW, requiredInnerW);
  const totalW = yAxisW + innerW;

  const scrollbarBuffer = totalW > containerW ? 12 : 0;
  const viewportMaxH = baseInnerH + padTop + xAxisH + scrollbarBuffer;
  const totalH = innerH + padTop + xAxisH;

  const ticks = [];
  for (let i = 0; i <= Math.max(maxY, maxVisibleY); i += step) ticks.push(i);
  const getYPos = (val) => padTop + innerH - val * unitH;

  const axisSignature = xaxis.map((x) => x.key).join("|");

  useEffect(() => {
    const snapPositions = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        scrollRef.current.scrollLeft = 0;
      }
    };
    snapPositions();
    const t1 = setTimeout(snapPositions, 50);
    const t2 = setTimeout(snapPositions, 200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [maxY, axisSignature, containerW]);

  return (
    <div className="w-full z-10 mx-auto rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col relative">
      <div ref={measureRef} className="w-full h-0 pointer-events-none" />

      <style>{`
                @keyframes smoothDrop {
                    0% { transform: translateY(-600px); opacity: 0; }
                    5% { opacity: 1; }
                    100% { transform: translateY(0); opacity: 1; }
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
            <stop offset="65%" stopColor="#000" stopOpacity="0.0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id="topShine" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0.0" />
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
          <marker
            id="arrowhead"
            markerWidth="5"
            markerHeight="5"
            refX="4"
            refY="2.5"
            orient="auto"
          >
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
              {ticks.map((val) => (
                <div
                  key={`y-${val}`}
                  className="absolute w-full text-right pr-3 text-[11px] font-bold text-gray-400"
                  style={{ top: getYPos(val) - 7 }}
                >
                  {val}h
                </div>
              ))}
            </div>

            <svg
              className="absolute top-0"
              style={{ left: yAxisW }}
              width={innerW}
              height={innerH + padTop}
            >
              {ticks.map((val) => (
                <line
                  key={`grid-${val}`}
                  x1={0}
                  x2={innerW}
                  y1={getYPos(val)}
                  y2={getYPos(val)}
                  stroke="#f1f5f9"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
              ))}

              {xaxis.map((col, i) => {
                const segmentW = innerW / xaxis.length;
                const barW = Math.min(46, segmentW - 16);
                const rx = barW / 2;
                const ry = Math.min(10, barW / 4);
                const x = i * segmentW + (segmentW - barW) / 2;

                let currentY = padTop + innerH - ry;

                // Safely sum exact minutes to prevent floating-point decimal drift
                const dayTotalMins = (chartData[col.key] || []).reduce(
                  (sum, item) => sum + (item.totalMins || 0),
                  0
                );
                
                // Convert back to float purely for Y-axis scaling
                const dayTotalValue = dayTotalMins / 60;

                const dayTotalDisplay = graphConfig.valueFormatter
                  ? graphConfig.valueFormatter(dayTotalValue)
                  : `${dayTotalValue.toFixed(2)}h`;

                return (
                  <g key={col.key}>
                    {(chartData[col.key] || []).map((item, idx) => {
                      const h = Math.max(6, item.value * unitH);
                      const y = currentY - h;
                      currentY = y;

                      return (
                        <g
                          key={idx}
                          style={{
                            animation: `smoothDrop 0.6s cubic-bezier(0.25, 1, 0.5, 1) ${idx * 0.1}s forwards`,
                            opacity: 0,
                          }}
                        >
                          <g
                            style={{
                              transformOrigin: `${x + barW / 2}px ${y + h / 2}px`,
                            }}
                            className="cursor-pointer transition-transform duration-300 hover:scale-[1.12]"
                            onMouseEnter={(e) =>
                              setTooltip({
                                ...item,
                                x: e.clientX,
                                y: e.clientY,
                              })
                            }
                            onMouseLeave={() => setTooltip(null)}
                            onClick={() =>
                              config.onItemClick &&
                              config.onItemClick(item.rawItem)
                            }
                          >
                            <path
                              d={`M ${x} ${y} L ${x} ${y + h} A ${rx} ${ry} 0 0 0 ${x + barW} ${y + h} L ${x + barW} ${y} Z`}
                              fill={item.color}
                              stroke="#ffffff"
                              strokeWidth="1.5"
                              strokeLinejoin="round"
                            />
                            <path
                              d={`M ${x} ${y} L ${x} ${y + h} A ${rx} ${ry} 0 0 0 ${x + barW} ${y + h} L ${x + barW} ${y} Z`}
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

                            {/* {item.isTerminal && ( */}
                            {item.markerType && (
                              <g className="pointer-events-none">
                                <path
                                  d={`M ${x} ${y} L ${x} ${y + h} A ${rx} ${ry} 0 0 0 ${x + barW} ${y + h} L ${x + barW} ${y} Z`}
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
                                  x1={x + barW + 13}
                                  y1={y + h / 2}
                                  x2={x + barW + 3}
                                  y2={y + h / 2}
                                  stroke="#1e293b"
                                  strokeWidth="1.5"
                                  markerEnd="url(#arrowhead)"
                                />
                                <circle
                                  cx={x + barW + 18}
                                  cy={y + h / 2}
                                  r="5.5"
                                  fill="#1e293b"
                                  stroke="#ffffff"
                                  strokeWidth="1"
                                />
                                {/* <text
                                  x={x + barW + 18}
                                  y={y + h / 2 + 2.5}
                                  fill="#ffffff"
                                  fontSize="7"
                                  fontWeight="bold"
                                  textAnchor="middle"
                                >
                                  C
                                </text> */}
                                <text
                                  x={x + barW + 18}
                                  y={y + h / 2 + 2.5}
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
              ></div>
              <div className="relative" style={{ width: innerW }}>
                {xaxis.map((col, i) => {
                  const segmentW = innerW / xaxis.length;
                  return (
                    <div
                      key={col.key}
                      className="absolute text-[11px] font-bold text-gray-500 whitespace-nowrap transform -translate-x-1/2"
                      style={{ left: i * segmentW + segmentW / 2, top: "12px" }}
                    >
                      {col.label}
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

// --- PIE CHART ---
const PieChartDesign = ({ data, graphConfig, setTooltip, config }) => {
  const SIZE = graphConfig.pieSize || 400;
  const RADIUS = SIZE / 2.8;
  const CENTER = SIZE / 2;

  const grouped = useMemo(() => {
    return data.reduce((acc, item) => {
      const key = getSafeValue(item, graphConfig.graphCategoryKey) || "Other";
      const val = parseValue(getSafeValue(item, graphConfig.graphValueKey));

      if (!acc[key])
        acc[key] = {
          value: 0,
          rawItem: item,
          color:
            getSafeValue(item, graphConfig.graphColorKey) || getHashColor(key),
        };
      acc[key].value += val;
      return acc;
    }, {});
  }, [data, graphConfig]);

  const total = Object.values(grouped).reduce((s, i) => s + i.value, 0);
  let cumulativeAngle = 0;

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="w-full h-auto max-w-[400px]"
    >
      {Object.entries(grouped).map(([label, item], idx) => {
        const angle = (item.value / total) * 360;
        const startRad = (Math.PI * (cumulativeAngle - 90)) / 180;
        const endRad = (Math.PI * (cumulativeAngle + angle - 90)) / 180;
        const x1 = CENTER + RADIUS * Math.cos(startRad);
        const y1 = CENTER + RADIUS * Math.sin(startRad);
        const x2 = CENTER + RADIUS * Math.cos(endRad);
        const y2 = CENTER + RADIUS * Math.sin(endRad);
        const pathData = `M ${CENTER} ${CENTER} L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${angle > 180 ? 1 : 0} 1 ${x2} ${y2} Z`;
        cumulativeAngle += angle;

        return (
          <path
            key={idx}
            d={pathData}
            fill={item.color}
            stroke="#fff"
            strokeWidth="3"
            onMouseEnter={(e) =>
              setTooltip({
                label,
                display: graphConfig.valueFormatter
                  ? graphConfig.valueFormatter(item.value)
                  : item.value,
                x: e.clientX,
                y: e.clientY,
                color: item.color,
              })
            }
            onMouseLeave={() => setTooltip(null)}
            onClick={() =>
              config.onItemClick && config.onItemClick(item.rawItem)
            }
            className="hover:opacity-90 cursor-pointer transition-opacity"
            style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.06))" }}
          />
        );
      })}
    </svg>
  );
};

// --- MAIN WRAPPER ---
export function ListGraphView() {
  const { data, config, filters, query } = useList();
  const [tooltip, setTooltip] = useState(null);

  // 🚀 DYNAMIC CONFIG RESOLUTION:
  // If Dashboard passed a function, we execute it with current filters.
  // If it's a standard object, we just use it directly!
  const graphConfig = useMemo(() => {
    const baseConfig = config?.graphConfig || config;

    // 👇 3. Parse the query string into a usable object
    // "weekRange:2026-04-01~2026-04-30 assignedTo: " becomes { weekRange: "...", assignedTo: "" }
    const parsedFilters = query ? parseQuery(query) : {};
    // 👇 4. Pass the parsed object to your Dashboard function
    return typeof baseConfig === "function"
      ? baseConfig(parsedFilters)
      : baseConfig;
  }, [config, query]);

  if (!data || data.length === 0) return null;

  // 🚀 Dynamic Tooltip Extraction based on Dashboard instructions
  const tooltipSecondaryVal =
    tooltip && graphConfig.tooltipSecondaryLabelKey
      ? getSafeValue(tooltip.rawItem, graphConfig.tooltipSecondaryLabelKey)
      : null;

  return (
    <div className="w-full h-full flex justify-center items-start p-6 bg-transparent">
      {graphConfig.graphType === "pie" ? (
        <PieChartDesign
          data={data}
          graphConfig={graphConfig}
          setTooltip={setTooltip}
          config={config}
        />
      ) : (
        <StackedBarDesign
          data={data}
          graphConfig={graphConfig}
          setTooltip={setTooltip}
          config={config}
        />
      )}

      {tooltip && (
        <div
          className="fixed pointer-events-none bg-white border border-gray-100 shadow-xl px-4 py-3 rounded-lg z-[9999] transition-all duration-75 ease-out"
          style={{ top: tooltip.y - 75, left: tooltip.x + 20 }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: tooltip.color }}
            ></div>
            <div className="font-bold text-gray-800 text-[13px] flex items-center gap-2">
              {tooltip.label}
              {tooltip.isTerminal && (
                <span className="bg-gray-800 text-white text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider">
                  Closed
                </span>
              )}
            </div>
          </div>

          {/* Dynamically render secondary info ONLY if the Dashboard requested it */}
          {tooltipSecondaryVal && (
            <div className="text-gray-500 font-medium text-[11px] mb-2 flex items-center gap-1.5">
              <span className="text-gray-400">👤</span> {tooltipSecondaryVal}
            </div>
          )}

          <div className="text-gray-600 font-semibold text-[12px] bg-gray-50 px-2 py-1 rounded inline-block border border-gray-100 mt-1">
            {tooltip.display}
          </div>
        </div>
      )}
    </div>
  );
}
