// import React from "react";

// // Custom SVG components to exactly match your image's grouped flags
// const SingleFlag = ({ color }) => (
//   <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className={color}>
//     <path d="M4 2v20h2V8h14l-2.5-3 2.5-3H6V2H4z"/>
//   </svg>
// );

// const DoubleFlag = ({ color }) => (
//   <svg width="22" height="14" viewBox="0 0 32 24" fill="currentColor" className={color}>
//     {/* First Flag (Background) */}
//     <path d="M12 2v20h2V8h14l-2.5-3 2.5-3H14V2h-2z" opacity="0.6" />
//     {/* Second Flag (Foreground) */}
//     <path d="M4 2v20h2V8h14l-2.5-3 2.5-3H6V2H4z" />
//   </svg>
// );

// const TripleFlag = ({ color }) => (
//   <svg width="30" height="14" viewBox="0 0 44 24" fill="currentColor" className={color}>
//     {/* First Flag (Deep Background) */}
//     <path d="M20 2v20h2V8h14l-2.5-3 2.5-3H22V2h-2z" opacity="0.4" />
//     {/* Second Flag (Middle Background) */}
//     <path d="M12 2v20h2V8h14l-2.5-3 2.5-3H14V2h-2z" opacity="0.7" />
//     {/* Third Flag (Foreground) */}
//     <path d="M4 2v20h2V8h14l-2.5-3 2.5-3H6V2H4z" />
//   </svg>
// );

// export default function PriorityRadioField({ name, value, onChange, error }) {
    
//   const priorities = [
//     { 
//       label: "Low", 
//       value: "Low", 
//       icon: <SingleFlag color="text-green-500" />,
//       selectedClass: "border-green-500 bg-green-50 text-green-700 ring-1 ring-green-500",
//       unselectedClass: "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
//     },
//     { 
//       label: "Medium", 
//       value: "Medium", 
//       icon: <DoubleFlag color="text-yellow-500" />,
//       selectedClass: "border-yellow-500 bg-yellow-50 text-yellow-700 ring-1 ring-yellow-500",
//       unselectedClass: "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
//     },
//     { 
//       label: "High", 
//       value: "High", 
//       icon: <TripleFlag color="text-red-500" />,
//       selectedClass: "border-red-500 bg-red-50 text-red-700 ring-1 ring-red-500",
//       unselectedClass: "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
//     },
//   ];

//   return (
//     <div className="flex flex-col gap-1 w-full">
//       {/* Optional Label (if your form engine doesn't inject it automatically) */}
//       {/* <label className="text-sm font-medium text-gray-700">Priority</label> */}

//       <div className="flex flex-wrap gap-3">
//         {priorities.map((p) => {
//           const isSelected = value === p.value;
          
//           return (
//             <label
//               key={p.value}
//               className={`flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer transition-all duration-200 select-none border ${
//                 isSelected ? p.selectedClass : p.unselectedClass
//               }`}
//             >
//               {/* Native radio input - hidden visually but handles the data */}
//               <input
//                 type="radio"
//                 name="priority"
//                 value={p.value}
//                 checked={isSelected}
//                 onChange={(e) => onChange(name, e.target.value)}
//                 className="hidden" 
//               />
              
//               {/* Render the custom grouped flag SVG */}
//               <div className="flex items-center justify-center">
//                 {p.icon}
//               </div>
              
//               {/* Text Label */}
//               <span className={`text-sm font-medium`}>
//                 {p.label}
//               </span>
//             </label>
//           );
//         })}
//       </div>
      
//       {/* Show validation error if any */}
//       {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
//     </div>
//   );
// }




import React from "react";

const SingleFlag = ({ color }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className={color}>
    <path d="M4 2v20h2V8h14l-2.5-3 2.5-3H6V2H4z" />
  </svg>
);

const DoubleFlag = ({ color }) => (
  <svg width="22" height="14" viewBox="0 0 32 24" fill="currentColor" className={color}>
    <path d="M12 2v20h2V8h14l-2.5-3 2.5-3H14V2h-2z" opacity="0.6" />
    <path d="M4 2v20h2V8h14l-2.5-3 2.5-3H6V2h-2z" />
  </svg>
);

const TripleFlag = ({ color }) => (
  <svg width="30" height="14" viewBox="0 0 44 24" fill="currentColor" className={color}>
    <path d="M20 2v20h2V8h14l-2.5-3 2.5-3H22V2h-2z" opacity="0.4" />
    <path d="M12 2v20h2V8h14l-2.5-3 2.5-3H14V2h-2z" opacity="0.7" />
    <path d="M4 2v20h2V8h14l-2.5-3 2.5-3H6V2h-2z" />
  </svg>
);
// Internal Icon (shield style)
const InternalIcon = ({ color }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className={color}>
    <path d="M12 2L3 6v6c0 5.25 3.75 9.75 9 11 5.25-1.25 9-5.75 9-11V6l-9-4z" />
  </svg>
);

// Client Icon (user style)
const ClientIcon = ({ color }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className={color}>
    <path d="M12 12c2.67 0 8 1.34 8 4v2H4v-2c0-2.66 5.33-4 8-4zm0-2a4 4 0 100-8 4 4 0 000 8z" />
  </svg>
);
/**
 * Custom Radio Field
 * Props:
 * - label: string (field label, e.g., "Raise ticket to")
 * - name: string (form field name)
 * - value: current selected value
 * - onChange: function(name, value) → called when user changes selection
 * - error: string (optional error message)
 * - type: "priority" | "raiseTo" (decides which options to render)
 */
export default function PriorityRadioField({ label, name, value, onChange, error,disabled}) {
  // Decide options dynamically
  
  const options = label === "Priority"
    ? [
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
      ]
    : [
        {
          value:false,
          label: "Internal",
          icon: <InternalIcon color="text-gray-500" />,
          selectedClass: "border-purple-500 bg-purple-50 text-purple-700 ring-1 ring-purple-500",
          unselectedClass: "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
        },
        {
          value: true,
          label: "Client",
          icon: <ClientIcon color="text-blue-500" />,
          selectedClass: "border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500",
          unselectedClass: "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
        }
      ];
      const isSelected = (currentValue, optionValue) => 
        String(currentValue) === String(optionValue);
    
  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Field label */}
      <label className="text-sm font-medium text-gray-700">{label}</label>

      {/* Radio options */}
      <div className="flex flex-wrap gap-3">
        {options.map((opt) => {
     const selected = isSelected(value, opt.value);
          return (
            <label
              key={opt.value}
              className={`flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer transition-all duration-200 select-none border ${
                selected ? opt.selectedClass : opt.unselectedClass
              }`}
            >
              {/* Hidden native input */}
              <input
                type="radio"
                name={name}
                value={opt.value}
                // checked={isSelected}
                checked={isSelected(value, opt.value)}
                onChange={(e) => {
                  // 🔑 Convert back to BOOLEAN for Client/Internal
                  const newValue = label === "Priority" 
                    ? e.target.value 
                    : (e.target.value === "true");
                  onChange(name, newValue); // ✅ Passes BOOLEAN to parent
                }}
                className="hidden"
                 disabled={disabled} 
              />

              {/* Icon (optional for priority) */}
              <div className="flex items-center justify-center w-5 h-5">
                {opt.icon || null}
              </div>

              {/* Text Label */}
              <span className="text-sm font-medium">{opt.label}</span>
            </label>
          );
        })}
      </div>

      {/* Validation error */}
      {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
    </div>
  );
}