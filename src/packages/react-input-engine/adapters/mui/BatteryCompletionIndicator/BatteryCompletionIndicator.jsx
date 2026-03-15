import React from "react";
import "./BatteryCompletionIndicator.css";

const COLORS = [
  "#9ca3af", // 0%
  "#ef4444", // 10%
  "#f97316", // 25%
  "#eab308", // 50%
  "#3b82f6", // 75%
  "#22c55e", // 100%
];
const VALUES = [0, 10, 25, 50, 75, 100];

export default function BatteryCompletionIndicator({
  name,         // Passed by FormEngine
  value = 0,    // Passed by FormEngine (will be 0, 10, 25, etc.)
  onChange,     // Passed by FormEngine
  error,        // Passed by FormEngine
  showPercent = true,
  readOnly = false, // Use this when displaying in the widget!
}) {
  // Find the index of the current value. If it's a weird number, default to 0.
  const numericValue = Number(value) || 0;
  const filledIndex = VALUES.indexOf(numericValue) === -1 ? 0 : VALUES.indexOf(numericValue);

  const color = COLORS[filledIndex];

  function handleClick(i) {
    if (readOnly || !onChange) return;
    
    // Cycle logic: clicking the current level resets it to 0, otherwise go to clicked level
    const nextIndex = i + 1 === filledIndex ? 0 : i + 1;
    const nextValue = VALUES[nextIndex]; // This grabs 0, 10, 25, 50, 75, or 100
    
    // Fire the onChange exactly how useFormEngine expects it: (name, value)
    onChange(name, nextValue);
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="battery-wrapper flex items-center gap-2">
        <div className="battery-body" style={{ borderColor: color }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`battery-cell ${readOnly ? "cursor-default" : "cursor-pointer"}`}
              onClick={() => handleClick(i)}
              style={{ background: i < filledIndex ? color : "#e5e7eb" }}
            />
          ))}
        </div>

        <div className="battery-tip" style={{ background: color }} />
        
        {showPercent && (
          <span className="battery-label text-sm font-medium ml-2" style={{ color }}>
            {VALUES[filledIndex]}%
          </span>
        )}
      </div>
      
      {/* Show validation error if any from FormEngine */}
      {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
    </div>
  );
}