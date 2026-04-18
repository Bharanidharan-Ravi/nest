import React from "react";
import "./BatteryCompletionIndicator.css";

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
//   "#9ca3af", // 0%
//   "#ef4444", // 10%
//   "#f97316", // 25%
//   "#eab308", // 50%
//   "#3b82f6", // 75%
//   "#22c55e", // 100%
// ];
// const VALUES = [0, 10, 25, 50, 75, 100];

// export default function BatteryCompletionIndicator({
//   name,         // Passed by FormEngine
//   value = 0,    // Passed by FormEngine (will be 0, 10, 25, etc.)
//   onChange,     // Passed by FormEngine
//   error,        // Passed by FormEngine
//   showPercent = true,
//   readOnly = false, // Use this when displaying in the widget!
// }) {
//   // Find the index of the current value. If it's a weird number, default to 0.
//   const numericValue = Number(value) || 0;
//   const filledIndex = VALUES.indexOf(numericValue) === -1 ? 0 : VALUES.indexOf(numericValue);

//   const color = COLORS[filledIndex];

//   function handleClick(i) {
//     if (readOnly || !onChange) return;
    
//     // Cycle logic: clicking the current level resets it to 0, otherwise go to clicked level
//     const nextIndex = i + 1 === filledIndex ? 0 : i + 1;
//     const nextValue = VALUES[nextIndex]; // This grabs 0, 10, 25, 50, 75, or 100
    
//     // Fire the onChange exactly how useFormEngine expects it: (name, value)
//     onChange(name, nextValue);
//   }

//   return (
//     <div className="flex flex-col gap-1 w-full">
//       <div className="battery-wrapper flex items-center gap-2">
//         <div className="battery-body" style={{ borderColor: color }}>
//           {[0, 1, 2, 3, 4].map((i) => (
//             <div
//               key={i}
//               className={`battery-cell ${readOnly ? "cursor-default" : "cursor-pointer"}`}
//               onClick={() => handleClick(i)}
//               style={{ background: i < filledIndex ? color : "#e5e7eb" }}
//             />
//           ))}
//         </div>

//         <div className="battery-tip" style={{ background: color }} />
        
//         {showPercent && (
//           <span className="battery-label text-sm font-medium ml-2" style={{ color }}>
//             {VALUES[filledIndex]}%
//           </span>
//         )}
//       </div>
      
//       {/* Show validation error if any from FormEngine */}
//       {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
//     </div>
//   );
// }