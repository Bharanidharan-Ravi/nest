import React, { useState } from "react";

// ── Modern, Elegant Split Button Component ─────────────────────────────
const SplitButton = ({ action, formData, handleSubmit, isPending }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = action.options[selectedIndex];

  // Refined modern color palette using Slate, Emerald, and Indigo
  const getColorClasses = (intent) => {
    switch (intent) {
      case "danger":
        return "bg-red-700 hover:bg-red-600 text-white border-transparent";
      case "success":
        return "bg-emerald-700 hover:bg-emerald-600 text-white border-transparent";
      case "warning":
        return "bg-amber-800 hover:bg-amber-600 text-white border-transparent";
      case "primary":
        return "bg-indigo-800 hover:bg-indigo-700 text-white border-transparent";
      default:
        // A softer, more elegant dark slate instead of harsh gray-800
        return "bg-slate-700 hover:bg-slate-800 text-white border-transparent"; 
    }
  };

  const colorClasses = getColorClasses(selectedOption.intent);

  return (
    <div className="relative inline-flex shadow-sm rounded-lg z-10">
      {/* ── Main Action Button ── */}
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setIsOpen(false);
          selectedOption.onClick({ formData, submitForm: handleSubmit });
        }}
        // Smaller padding (px-3 py-1.5), softer font (font-medium), and text-[13px]
        className={`relative inline-flex items-center px-3 py-1.5 rounded-l-lg border text-[13px] font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 ${colorClasses}`}
      >
        {selectedOption.icon && (
          <span className="mr-2 pr-2 border-r border-white/20 flex items-center opacity-90 text-[13px]">
            {React.cloneElement(selectedOption.icon, { className: "text-white" })}
          </span>
        )}
        {isPending ? "Processing..." : selectedOption.label}
      </button>

      {/* ── Dropdown Arrow Button ── */}
      <button
        type="button"
        disabled={isPending}
        onClick={() => setIsOpen(!isOpen)}
        // Tighter padding on the arrow button to make it compact
        className={`relative inline-flex items-center px-1.5 py-1.5 rounded-r-lg border-l border-white/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 ${colorClasses}`}
      >
        {/* Smaller SVG arrow */}
        <svg className="h-3.5 w-3.5 opacity-80" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {/* ── Dropdown Menu ── */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          {/* Enhanced floating menu: rounded-xl, shadow-xl, with a subtle border */}
          <div className="origin-bottom-right absolute right-0 bottom-full mb-2 w-60 rounded-xl shadow-xl bg-white border border-gray-100 ring-1 ring-black/5 z-50 overflow-hidden transform opacity-100 scale-100 transition-all">
            <div className="py-1">
              {action.options.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedIndex(idx);
                    setIsOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-2.5 text-[13px] transition-colors duration-150 ${
                    selectedIndex === idx 
                      ? "bg-slate-50 text-slate-900 border-l-2 border-indigo-500" 
                      : "text-slate-600 hover:bg-slate-50 border-l-2 border-transparent hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-start">
                    {opt.icon && (
                      <span className="mt-0.5 mr-3 pr-3 border-r border-gray-100 flex items-center text-sm opacity-70">
                        {opt.icon}
                      </span>
                    )}
                    <div className="flex flex-col">
                      <span className={`font-medium ${selectedIndex === idx ? "text-indigo-600" : "text-slate-700"}`}>
                        {opt.label}
                      </span>
                      {opt.subtext && <span className="text-[11px] text-slate-400 font-normal mt-0.5 leading-tight">{opt.subtext}</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SplitButton;




// import React, { useState } from "react";

// // ── GitHub Style Split Button Component ─────────────────────────────
// const SplitButton = ({ action, formData, handleSubmit, isPending }) => {
//   const [selectedIndex, setSelectedIndex] = useState(0);
//   const [isOpen, setIsOpen] = useState(false);
//   const selectedOption = action.options[selectedIndex];

//   const getColorClasses = (intent) => {
//     switch (intent) {
//       case "danger":
//         return "bg-red-600 hover:bg-red-700 text-white border-red-700";
//       case "success":
//         return "bg-green-600 hover:bg-green-700 text-white border-green-700";
//       case "warning":
//         return "bg-orange-500 hover:bg-orange-600 text-white border-orange-600";
//       case "primary":
//         return "bg-blue-600 hover:bg-blue-700 text-white border-blue-700";
//       default:
//         return "bg-gray-800 hover:bg-gray-900 text-white border-gray-900"; // neutral
//     }
//   };

//   const colorClasses = getColorClasses(selectedOption.intent);

//   return (
//     <div className="relative inline-flex shadow-sm rounded-md z-10">
//       {/* ── Main Action Button ── */}
//       <button
//         type="button"
//         disabled={isPending}
//         onClick={() => {
//           setIsOpen(false);
//           selectedOption.onClick({ formData, submitForm: handleSubmit });
//         }}
//         className={`relative inline-flex items-center px-3 py-1.5 rounded-l-md border text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ${colorClasses}`}
//       >
//         {selectedOption.icon && (
//           // 🔥 ADDED: The elegant vertical separator (border-r border-white/30)
//           <span className="mr-2 pr-3 border-r border-white/30 flex items-center opacity-100 text-sm">
//             {React.cloneElement(selectedOption.icon, { className: "text-white" })}
//           </span>
//         )}
//         {isPending ? "Processing..." : selectedOption.label}
//       </button>

//       {/* ── Dropdown Arrow Button ── */}
//       <button
//         type="button"
//         disabled={isPending}
//         onClick={() => setIsOpen(!isOpen)}
//         className={`relative inline-flex items-center px-2 py-1.5 rounded-r-md border-y border-r border-l border-l-white/20 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ${colorClasses}`}
//       >
//         <svg className="h-4 w-4 opacity-90" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
//           <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
//         </svg>
//       </button>

//       {/* ── Dropdown Menu ── */}
//       {isOpen && (
//         <>
//           <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
//           <div className="origin-bottom-right absolute right-0 bottom-full mb-1.5 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 overflow-hidden">
//             <div className="py-1">
//               {action.options.map((opt, idx) => (
//                 <button
//                   key={idx}
//                   type="button"
//                   onClick={() => {
//                     setSelectedIndex(idx);
//                     setIsOpen(false);
//                   }}
//                   className={`block w-full text-left px-4 py-2.5 text-sm transition-colors ${
//                     selectedIndex === idx ? "bg-gray-50 text-gray-900 border-l-2 border-blue-500" : "text-gray-700 hover:bg-gray-50 border-l-2 border-transparent"
//                   }`}
//                 >
//                   <div className="flex items-start">
//                     {opt.icon && (
//                       // 🔥 ADDED: The elegant gray separator inside the dropdown menu
//                       <span className="mt-0.5 mr-3 pr-3 border-r border-gray-200 flex items-center text-lg opacity-80">
//                         {opt.icon}
//                       </span>
//                     )}
//                     <div className="flex flex-col">
//                       <span className={`font-medium ${selectedIndex === idx ? "text-blue-700" : "text-gray-800"}`}>
//                         {opt.label}
//                       </span>
//                       {opt.subtext && <span className="text-xs text-gray-500 font-normal mt-0.5">{opt.subtext}</span>}
//                     </div>
//                   </div>
//                 </button>
//               ))}
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

// export default SplitButton;