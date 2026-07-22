// import React, { useMemo } from "react";

// function normaliseToSet(value) {
//   if (!value) return new Set();
//   if (Array.isArray(value)) return new Set(value.map((v) => v.id));
//   return new Set();
// }

// function serialise(set, options) {
//   return [...set]
//     .sort((a, b) => a - b)
//     .map((id) => {
//       const opt = options.find((d) => d.value.id === id);
//       return { id, name: opt?.value?.name ?? String(id) };
//     });
// }

// export default function DaysOfWeekPicker({
//   name,
//   label,
//   value,
//   error,
//   onChange,
//   options = [],
//   required,
//   disabled = false,
// }) {
//   const selected = useMemo(() => normaliseToSet(value), [value]);
//   const toggle = (dayId) => {
//     if (disabled) return;
//     const next = new Set(selected);
//     if (next.has(dayId)) next.delete(dayId);
//     else next.add(dayId);
//     onChange?.(name,serialise(next, options));
//   };

//   return (
//     <div className="flex flex-col gap-1.5">
//       {label && (
//         <>
//           <span className="text-sm font-normal text-gray-600">
//             {label}
//             {required && <span className="text-red-600 ml-0.5">*</span>}
//           </span>

//           <div className="flex flex-wrap gap-1.5">
//             {options.map((day) => {
//               const dayId = day.value.id;
//               const isActive = selected.has(dayId);
//               return (
//                 <button
//                   key={dayId}
//                   type="button"
//                   disabled={disabled}
//                   title={day.value.name}
//                   aria-label={day.value.name}
//                   aria-pressed={isActive}
//                   onClick={() => toggle(dayId)}
//                   className={`w-10 h-10 rounded-full text-xs font-${
//                     isActive ? "medium" : "normal"
//                   } flex items-center justify-center transition-colors 
//                   border ${
//                     isActive
//                       ? "border-blue-700 bg-blue-700 text-white"
//                       : "border-gray-300 text-gray-900 bg-transparent"
//                   } cursor-${disabled ? "not-allowed" : "pointer"} ${
//                     disabled ? "opacity-50" : "opacity-100"
//                   }`}
//                 >
//                   {day.label}
//                 </button>
//               );
//             })}
//           </div>
//         </>
//       )}

//       {error && <span className="text-xs text-red-600 mt-0.5">{error}</span>}
//     </div>
//   );
// }



// import React, { useMemo } from "react";

// function normaliseToSet(value) {
//   if (!value) return new Set();

//   if (Array.isArray(value)) {
//     return new Set(value.map((v) => String(v.id)));
//   }

//   return new Set();
// }

// function serialise(set, options) {
//   return [...set]
//     .sort((a, b) => Number(a) - Number(b))
//     .map((id) => {
//       const opt = options.find((d) => String(d.value.id) === String(id));
//       return {
//         id,
//         name: opt?.value?.name ?? opt?.label ?? String(id),
//       };
//     });
// }

// export default function DaysOfWeekPicker({
//   name,
//   label,
//   value,
//   error,
//   onChange,
//   options = [],
//   required,
//   disabled = false,
// }) {
//   const selected = useMemo(() => normaliseToSet(value), [value]);
// console.log("error",error);

//   const toggle = (dayId) => {
//     if (disabled) return;

//     const id = String(dayId);
//     const next = new Set(selected);

//     if (next.has(id)) next.delete(id);
//     else next.add(id);

//     onChange?.(name, serialise(next, options));
//   };

//   return (
//     <div className="flex flex-col gap-1.5">
//       {label && (
//         <span className="text-sm font-normal text-gray-600">
//           {label}
//           {required && <span className="text-red-600 ml-0.5">*</span>}
//         </span>
//       )}

//       <div className="flex flex-wrap gap-1.5">
//         {options.map((day) => {
//           const dayId = String(day.value.id);
//           const isActive = selected.has(dayId);

//           return (
//             <button
//               key={dayId}
//               type="button"
//               disabled={disabled}
//               title={day.label ?? day.value?.name}
//               aria-label={day.label ?? day.value?.name}
//               aria-pressed={isActive}
//               onClick={() => toggle(dayId)}
//               className={`w-16 h-8 rounded-full text-xs flex items-center justify-center transition-all border
//                 ${
//                   isActive
//                     ? "bg-blue-600 text-white border-blue-600 shadow-md"
//                     : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
//                 }
//                 ${
//                   disabled
//                     ? "opacity-50 cursor-not-allowed"
//                     : "cursor-pointer"
//                 }
//               `}
//             >
//               {day.label ?? day.value?.name}
//             </button>
//           );
//         })}
//       </div>

//       {error && (
//         <span className="text-xs text-red-600 mt-0.5">{error}</span>
//       )}
//     </div>
//   );
// }



import React, { useMemo } from "react";

function binaryToSet(binary) {
  const set = new Set();

  if (!binary || typeof binary !== "string") {
    return set;
  }

  binary.split("").forEach((bit, index) => {
    if (bit === "1") {
      set.add(String(index));
    }
  });

  return set;
}

function normaliseToSet(value) {
  if (!value) return new Set();

  // API value: "1010101"
  if (typeof value === "string") {
    return binaryToSet(value);
  }

  // Fallback for array format
  if (Array.isArray(value)) {
    return new Set(value.map((v) => String(v.id)));
  }

  return new Set();
}

function serialiseToBinary(set) {
  const binary = Array(7).fill("0");
  [...set].forEach((id) => {
    const index = Number(id);
    if (index >= 0 && index <= 6) {
      binary[index] = "1";
    }
  });

  return binary.join("");
}

export default function DaysOfWeekPicker({
  name,
  label,
  value,
  error,
  onChange,
  options = [],
  required,
  disabled = false,
}) {
  const selected = useMemo(() => normaliseToSet(value), [value]);

  const toggle = (dayId) => {
    if (disabled) return;

    const id = String(dayId);
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    const binaryValue = serialiseToBinary(next);
    onChange?.(name, binaryValue);
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="text-sm font-normal text-gray-600">
          {label}
          {required && <span className="text-red-600 ml-0.5">*</span>}
        </span>
      )}

      <div className="flex flex-wrap gap-1.5">
        {options.map((day) => {
          const dayId = String(day.value.id);
          const isActive = selected.has(dayId);

          return (
            <button
              key={dayId}
              type="button"
              disabled={disabled}
              title={day.label ?? day.value?.name}
              aria-label={day.label ?? day.value?.name}
              aria-pressed={isActive}
              onClick={() => toggle(dayId)}
              className={`w-16 h-8 rounded-full text-xs flex items-center justify-center transition-all border
                ${
                  isActive
                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                }
                ${
                  disabled
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }
              `}
            >
              {day.label ?? day.value?.name}
            </button>
          );
        })}
      </div>

      {error && (
        <span className="text-xs text-red-600 mt-0.5">
          {typeof error === "string" ? error : error.message}
        </span>
      )}
    </div>
  );
}