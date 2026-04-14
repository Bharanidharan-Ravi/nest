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
  defaultValue = 0,
  showPercent = true,
}) {
  
  const color =useMemo(() => COLORS_BY_RANGE(defaultValue), [defaultValue]) ;
  
  const filledCells = Math.ceil((defaultValue/100) * 5);
  // const [filled, setFilled] = useState(
  //   VALUES.indexOf(defaultValue) === -1 ? 0 : VALUES.indexOf(defaultValue),
  // );

  // const color = COLORS[filled];

  function handleClick(i) {
    const next = i + 1 === filled ? 0 : i + 1;
    setFilled(next);
  }

  return (
    <div className="battery-wrapper">
      <div className="battery-body" style={{ borderColor: color }}>
        {[0, 1, 2, 3, 4].map((i) => {
          const fraction = Math.min(Math.max(filledCells - i,0),1);
          const bg = fraction >= 1 ? color:fraction > 0 ? `linear-gradient(to right,${color}${fraction * 100} %,#e5e7eb${fraction * 100}%)` : "#e5e7eb"
        
        return(
          <div
          key={i}
          className="battery-cell"
          // onClick={() => handleClick(i)}
          style={{ background: bg}}
        />
        )
})}
      </div>

      <div className="battery-tip" style={{ background: color }} />
      {showPercent && (
        <span className="battery-label" style={{ color }}>
          {defaultValue}% 
        </span>
      )}
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
