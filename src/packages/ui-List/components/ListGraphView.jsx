import React, { useState, useMemo } from "react";
import dayjs from "dayjs";
import { useList } from "../context/ListContext";


const parseValue = (val) => {
    if (typeof val === "string" && val.includes(":")) {
        const parts = val.split(":");
        return parts.length === 2 ? parseInt(parts[0]) + parseInt(parts[1]) / 60 : parseFloat(val) || 0;
    }
    return parseFloat(val) || 0;
};

// --- STACKED BAR ---
const StackedBarDesign = ({ data, graphConfig, setTooltip }) => {
    const WIDTH = graphConfig.graphWidth || 680;
    const HEIGHT = graphConfig.graphHeight || 350;
    const padding = graphConfig.graphPadding || { top: 30, right: 20, bottom: 60, left: 50 };
    const innerW = WIDTH - padding.left - padding.right;
    const innerH = HEIGHT - padding.top - padding.bottom;
    // const xaxis = graphConfig.graphXAxis || [];
     const xaxis = useMemo(() => {
        if (graphConfig.graphXAxis?.length > 0) return graphConfig.graphXAxis;

        // Extract unique date keys from data and sort them
        const keys = [...new Set(
            data
                .map(item => {
                    const raw = item[graphConfig.graphXAxisKey];
                    return graphConfig.isDateAxis
                        ? (raw ? raw.split("T")[0] : null)
                        : raw;
                })
                .filter(Boolean)
        )].sort();

        return keys.map(k => ({
            key: k,
            label: dayjs(k).format("DD MMM"),  // auto-label
        }));
    }, [data, graphConfig]);

    const chartData = useMemo(() => {
        const grouped = {};
        // const xaxis = graphConfig.graphXAxis || [];
        const colorMap = {};

        const COLORS = [
            "#4A90E2", "#7F8C8D", "#2C3E50", "#27AE60", "#E67E22", 
            "#2980B9", "#8E44AD", "#16A085", "#D35400", "#F39C12", 
            "#34495E", "#9B59B6", "#1ABC9C", "#C0392B", "#BDC3C7"
          ];

          xaxis.forEach((col)=> (grouped[col.key] = []));
          
          data.forEach((item)=> {
            const rawDate = item[graphConfig.graphXAxisKey];
            const xKey = graphConfig.isDateAxis
             ? (rawDate ? rawDate.split("T")[0]:null)
             :rawDate;
           
            if (!grouped[xKey]) return;

            const val = parseValue(item[graphConfig.graphValueKey]);
            if (val > 0) {
                const groupId = item[graphConfig.graphGroupIdKey] || item.id;
                if (!colorMap[groupId]) {
                    colorMap[groupId] = COLORS[Object.keys(colorMap).length % COLORS.length];
                }

                grouped[xKey].push({
                    value: val,
                    label: item[graphConfig.graphLabelKey] || "Unknown",
                    color: colorMap[groupId],
                    display: graphConfig.valueFormatter ? graphConfig.valueFormatter(val) : val,
                });
            }
          });
          return grouped
    }, [data, graphConfig]);

    const maxVal = useMemo(() => {
        const totals = Object.values(chartData).map(s => s.reduce((sum, i) => sum + i.value, 0));
        return Math.max(...totals, graphConfig.yaxis?.max || 12);
    }, [chartData, graphConfig]);

    return (
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto">
            {(graphConfig.yaxis?.ticks || []).map((tick, idx) => {
                const y = padding.top + innerH - (tick.value / maxVal) * innerH;
                return (
                    <g key={idx}>
                        <line x1={padding.left} x2={WIDTH - padding.right} y1={y} y2={y} stroke="#f3f4f6" />
                        <text x={padding.left - 10} y={y + 4} textAnchor="end" fontSize="11" fill="#9ca3af">{tick.label}</text>
                    </g>
                );
            })}
            {xaxis.map((col, i) => {
                const barW = (innerW / xaxis.length) - (graphConfig.barGap || 15);
                const x = padding.left + i * (innerW / xaxis.length) + ((innerW / xaxis.length - barW) / 2);
                let currentH = 0;
                return (
                    <g key={col.key}>
                        {(chartData[col.key] || []).map((item, idx) => {
                            const h = (item.value / maxVal) * innerH;
                            const y = padding.top + innerH - ((currentH + item.value) / maxVal) * innerH;
                            currentH += item.value;
                            return (
                                <rect key={idx} x={x} y={y} width={barW} height={h} fill={item.color}
                                    onMouseEnter={(e) => setTooltip({ ...item, x: e.clientX, y: e.clientY })}
                                    onMouseLeave={() => setTooltip(null)}
                                    className="hover:opacity-80 cursor-pointer transition-opacity"
                                />
                            );
                        })}
                        <text x={x + barW / 2} y={padding.top + innerH + 25} textAnchor="middle" fontSize="11" fill="#6b7280">{col.label}</text>
                    </g>
                );
            })}
        </svg>
    );
};

// --- PIE CHART ---
const PieChartDesign = ({ data, graphConfig, setTooltip }) => {
    const SIZE = graphConfig.pieSize || 400;
    const RADIUS = SIZE / 2.8;
    const CENTER = SIZE / 2;

    const grouped = useMemo(() => {
        return data.reduce((acc, item) => {
            const key = item[graphConfig.graphCategoryKey] || "Other";
            const val = parseValue(item[graphConfig.graphValueKey]);
            if (!acc[key]) acc[key] = { value: 0, color: item[graphConfig.graphColorKey] || "#3b82f6" };
            acc[key].value += val;
            return acc;
        }, {});
    }, [data, graphConfig]);

    const total = Object.values(grouped).reduce((s, i) => s + i.value, 0);
    let cumulativeAngle = 0;

    return (
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full h-auto max-w-[400px]">
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
                    <path key={idx} d={pathData} fill={item.color} stroke="#fff" strokeWidth="2"
                        onMouseEnter={(e) => setTooltip({ label, display: graphConfig.valueFormatter ?
                             graphConfig.valueFormatter(item.value) :
                             item.value, x: e.clientX, y: e.clientY, color: item.color })}
                        onMouseLeave={() => setTooltip(null)}
                        clas    sName="hover:opacity-90 cursor-pointer transition-opacity"
                    />
                );
            })}
        </svg>
    );
};

// --- MAIN ---
export function ListGraphView() {
    const { data, config } = useList();
    console.log("data ",data);
    const [tooltip, setTooltip] = useState(null);
    const graphConfig = config?.graphConfig || config;
console.log("graphConfig :", graphConfig);


    if (!data || data.length === 0) return null;

    return (
        <div className="w-full flex justify-center items-center p-6 bg-white rounded-lg">
            <div style={{ maxWidth: '800px', width: '100%' }}>
                {graphConfig.graphType === "pie" ? (
                    <PieChartDesign data={data} graphConfig={graphConfig} setTooltip={setTooltip} />
                ) : (
                    <StackedBarDesign data={data} graphConfig={graphConfig} setTooltip={setTooltip} />
                )}
            </div>
            {tooltip && (
                <div
                    className="fixed pointer-events-none bg-white border-l-4 shadow-2xl p-3 rounded-md text-xs z-[9999]"
                    style={{
                        top: tooltip.y - 60,
                        left: tooltip.x + 20,
                        borderLeftColor: tooltip.color
                    }}
                >
                    <div className="font-bold text-gray-900 mb-0.5">{tooltip.label}</div>
                    <div className="text-gray-600 font-medium">{tooltip.display}</div>
                </div>
            )}
        </div>
    );
}