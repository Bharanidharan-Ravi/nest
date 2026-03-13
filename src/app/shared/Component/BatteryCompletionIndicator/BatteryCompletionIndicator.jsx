import { useState } from "react";
import "./BatteryCompletionIndicator.css";

const COLORS = [
  "#9ca3af",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#3b82f6",
  "#22c55e",
];
const VALUES = [0, 10, 25, 50, 75, 100];

export default function BatteryCompletionIndicator({
  defaultValue = 0,
  showPercent = false,
}) {
  const [filled, setFilled] = useState(
    VALUES.indexOf(defaultValue) === -1 ? 0 : VALUES.indexOf(defaultValue),
  );

  const color = COLORS[filled];

  function handleClick(i) {
    const next = i + 1 === filled ? 0 : i + 1;
    setFilled(next);
  }

  return (
    <div className="battery-wrapper">
      <div className="battery-body" style={{ borderColor: color }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="battery-cell"
            onClick={() => handleClick(i)}
            style={{ background: i < filled ? color : "#e5e7eb" }}
          />
        ))}
      </div>

      <div className="battery-tip" style={{ background: color }} />
      {showPercent && (
        <span className="battery-label" style={{ color }}>
          {VALUES[filled]}% completed
        </span>
      )}
    </div>
  );
}
