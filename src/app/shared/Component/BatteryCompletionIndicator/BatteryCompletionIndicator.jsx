import { useState } from "react";
import "./BatteryCompletionIndicator.css";
import { useMemo } from "react";


const COLORS_BY_RANGE =(value)=>{
  if(value === 0) return "#9ca3af";
  if(value <= 20) return "#ef4444";
  if(value <= 40) return "#f97316";
  if(value <= 60) return "#eab308";
  if(value <= 80) return "#14b8a6";
  if(value < 100) return "#3b82f6";
  return "#22c55e"
}
 
// const VALUES = [0, 10, 25, 50, 75, 100];
export default function BatteryCompletionIndicator({
  name,
  value = 0,
  onChange,
  error,
  options, 
  showPercent = true,
  readOnly = false,
}) {
  const max = options?.max || 100;
  const step = options?.step || null;
  
  // 🔥 Extract dynamic styles, falling back to your CSS defaults
  const cellHeight = options?.height || "16px";
  const cellWidth = options?.width || "10px";
  const labelFontSize = options?.fontSize || "11px";

  let valuesList = [];
  if (options?.values && Array.isArray(options.values)) {
    valuesList = options.values;
  } else if (step) {
    for (let i = 0; i <= max; i += step) {
      valuesList.push(i);
    }
  } else {
    valuesList = [0, 10, 25, 50, 75, 100];
  }

  const numericValue = Number(value) || 0;
  const isValidValue = valuesList.includes(numericValue);
  const activeValue = isValidValue ? numericValue : 0;

  const getColor = (val) => {
    if (val <= 0) return "#9ca3af"; 
    const pct = (val / max) * 100;
    if (pct <= 20) return "#ef4444"; 
    if (pct <= 40) return "#f97316"; 
    if (pct <= 60) return "#eab308"; 
    if (pct <= 80) return "#3b82f6"; 
    return "#22c55e"; 
  };

  const currentColor = getColor(activeValue);
  const cellValues = valuesList.slice(1);

  function handleClick(clickedValue) {
    if (readOnly || !onChange) return;
    const nextValue = clickedValue === activeValue ? 0 : clickedValue;
    onChange(name, nextValue);
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="battery-wrapper">
        <div className="battery-body" style={{ borderColor: currentColor }}>
          {cellValues.map((cellVal) => {
            const isFilled = cellVal <= activeValue;
            return (
              <div
                key={cellVal}
                className={`battery-cell ${readOnly ? "cursor-default" : "cursor-pointer"}`}
                onClick={() => handleClick(cellVal)}
                style={{
                  background: isFilled ? currentColor : "#e5e7eb",
                  height: cellHeight, // 🔥 Apply dynamic height
                  width: cellWidth,   // 🔥 Apply dynamic width
                }}
              />
            );
          })}
        </div>

        {/* Tip scales dynamically based on height and width */}
        <div 
          className="battery-tip" 
          style={{ 
            background: currentColor,
            height: options?.height ? `calc(${cellHeight} * 0.5)` : "6px",
            width: options?.width ? `calc(${cellWidth} * 0.3)` : "3px"
          }} 
        />

        {showPercent && (
          <span 
            className="battery-label" 
            style={{ 
              color: currentColor, 
              fontSize: labelFontSize // 🔥 Apply dynamic font size
            }}
          >
            {activeValue}{max === 100 ? "%" : `/${max}`}
          </span>
        )}
      </div>

      {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
    </div>
  );
}

// const COLORS = [
//   "#9ca3af",
//   "#ef4444",
//   "#f97316",
//   "#eab308",
//   "#3b82f6",
//   "#22c55e",
// ];
// const VALUES = [0, 10, 25, 50, 75, 100];

// export default function BatteryCompletionIndicator({
//   defaultValue = 0,
//   showPercent = false,
// }) {
//   const [filled, setFilled] = useState(
//     VALUES.indexOf(defaultValue) === -1 ? 0 : VALUES.indexOf(defaultValue),
//   );

//   const color = COLORS[filled];

//   function handleClick(i) {
//     const next = i + 1 === filled ? 0 : i + 1;
//     setFilled(next);
//   }

//   return (
//     <div className="battery-wrapper">
//       <div className="battery-body" style={{ borderColor: color }}>
//         {[0, 1, 2, 3, 4].map((i) => (
//           <div
//             key={i}
//             className="battery-cell"
//             onClick={() => handleClick(i)}
//             style={{ background: i < filled ? color : "#e5e7eb" }}
//           />
//         ))}
//       </div>

//       <div className="battery-tip" style={{ background: color }} />
//       {showPercent && (
//         <span className="battery-label" style={{ color }}>
//           {VALUES[filled]}% completed
//         </span>
//       )}
//     </div>
//   );
// }
