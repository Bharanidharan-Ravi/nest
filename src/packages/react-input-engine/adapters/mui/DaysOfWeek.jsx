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

// Day ids follow the "days_of_week" bitmask: index 0 = Sunday ... 6 = Saturday.
const WEEKEND_IDS = ["0", "6"];
const PRESETS = [
  { label: "Weekdays", ids: ["1", "2", "3", "4", "5"] },
  { label: "Every day", ids: ["0", "1", "2", "3", "4", "5", "6"] },
];

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
  // No days picked -> "" so a required field reports it (all-zero would pass).
  if (set.size === 0) return "";
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

  const emit = (set) => {
    if (disabled) return;
    onChange?.(name, serialiseToBinary(set));
  };

  const toggle = (dayId) => {
    const id = String(dayId);
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    emit(next);
  };

  const isPresetActive = (ids) => ids.length === selected.size && ids.every((id) => selected.has(id));

  return (
    <div className={`flex flex-col gap-1 ${disabled ? "opacity-50" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        {label && (
          <span className={`text-[13px] font-medium leading-4 ${error ? "text-red-500" : "text-slate-600"}`}>
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </span>
        )}

        {!disabled && (
          <div className="flex items-center gap-1">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => emit(new Set(preset.ids))}
                className={`rounded-md px-1.5 text-[11px] font-medium leading-5 transition-colors
                  ${isPresetActive(preset.ids) ? "bg-amber-50 text-amber-700" : "text-slate-400 hover:bg-amber-50 hover:text-amber-700"}`}
              >
                {preset.label}
              </button>
            ))}
            {selected.size > 0 && (
              <button
                type="button"
                onClick={() => emit(new Set())}
                className="rounded-md px-1.5 text-[11px] font-medium leading-5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {options.map((day) => {
          const dayId = String(day.value.id);
          const isActive = selected.has(dayId);
          const isWeekend = WEEKEND_IDS.includes(dayId);

          return (
            <button
              key={dayId}
              type="button"
              disabled={disabled}
              title={day.value?.name ?? day.label}
              aria-label={day.value?.name ?? day.label}
              aria-pressed={isActive}
              onClick={() => toggle(dayId)}
              className={`flex h-10 flex-col items-center justify-center rounded-xl border text-xs font-semibold transition-all duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1
                ${
                  isActive
                    ? "border-amber-400 bg-amber-400 text-gray-900 shadow-md shadow-amber-200"
                    : `bg-white ${error ? "border-red-300" : "border-slate-200"} ${isWeekend ? "text-rose-500" : "text-slate-600"}
                       hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 hover:shadow-sm`
                }
                ${disabled ? "cursor-not-allowed" : "cursor-pointer active:scale-95"}`}
            >
              {day.label ?? day.value?.name}
              <span
                aria-hidden="true"
                className={`mt-0.5 h-1 w-1 rounded-full transition-colors ${isActive ? "bg-gray-900/60" : "bg-transparent"}`}
              />
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