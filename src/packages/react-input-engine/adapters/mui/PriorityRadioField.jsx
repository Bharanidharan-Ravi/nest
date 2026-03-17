import React from "react";

// Custom SVG components to exactly match your image's grouped flags
const SingleFlag = ({ color }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className={color}>
    <path d="M4 2v20h2V8h14l-2.5-3 2.5-3H6V2H4z"/>
  </svg>
);

const DoubleFlag = ({ color }) => (
  <svg width="22" height="14" viewBox="0 0 32 24" fill="currentColor" className={color}>
    {/* First Flag (Background) */}
    <path d="M12 2v20h2V8h14l-2.5-3 2.5-3H14V2h-2z" opacity="0.6" />
    {/* Second Flag (Foreground) */}
    <path d="M4 2v20h2V8h14l-2.5-3 2.5-3H6V2H4z" />
  </svg>
);

const TripleFlag = ({ color }) => (
  <svg width="30" height="14" viewBox="0 0 44 24" fill="currentColor" className={color}>
    {/* First Flag (Deep Background) */}
    <path d="M20 2v20h2V8h14l-2.5-3 2.5-3H22V2h-2z" opacity="0.4" />
    {/* Second Flag (Middle Background) */}
    <path d="M12 2v20h2V8h14l-2.5-3 2.5-3H14V2h-2z" opacity="0.7" />
    {/* Third Flag (Foreground) */}
    <path d="M4 2v20h2V8h14l-2.5-3 2.5-3H6V2H4z" />
  </svg>
);

export default function PriorityRadioField({ name, value, onChange, error }) {
    
  const priorities = [
    { 
      label: "Low", 
      value: "Low", 
      icon: <SingleFlag color="text-green-500" />,
      selectedClass: "border-green-500 bg-green-50 text-green-700 ring-1 ring-green-500",
      unselectedClass: "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
    },
    { 
      label: "Medium", 
      value: "Medium", 
      icon: <DoubleFlag color="text-yellow-500" />,
      selectedClass: "border-yellow-500 bg-yellow-50 text-yellow-700 ring-1 ring-yellow-500",
      unselectedClass: "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
    },
    { 
      label: "High", 
      value: "High", 
      icon: <TripleFlag color="text-red-500" />,
      selectedClass: "border-red-500 bg-red-50 text-red-700 ring-1 ring-red-500",
      unselectedClass: "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
    },
  ];

  return (
    <div className="flex flex-col gap-1 w-full">
      {/* Optional Label (if your form engine doesn't inject it automatically) */}
      {/* <label className="text-sm font-medium text-gray-700">Priority</label> */}

      <div className="flex flex-wrap gap-3">
        {priorities.map((p) => {
          const isSelected = value === p.value;
          
          return (
            <label
              key={p.value}
              className={`flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer transition-all duration-200 select-none border ${
                isSelected ? p.selectedClass : p.unselectedClass
              }`}
            >
              {/* Native radio input - hidden visually but handles the data */}
              <input
                type="radio"
                name="priority"
                value={p.value}
                checked={isSelected}
                onChange={(e) => onChange(name, e.target.value)}
                className="hidden" 
              />
              
              {/* Render the custom grouped flag SVG */}
              <div className="flex items-center justify-center">
                {p.icon}
              </div>
              
              {/* Text Label */}
              <span className={`text-sm font-medium`}>
                {p.label}
              </span>
            </label>
          );
        })}
      </div>
      
      {/* Show validation error if any */}
      {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
    </div>
  );
}