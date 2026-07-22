// const ListCheckBox = ({
//   options = [],
//   value = [],
//   onChange,
// }) => {
//   const handleToggle = (item, checked) => {
//     if (checked) {
//       onChange?.([...value, item]);
//     } else {
//       onChange?.(value.filter((v) => v.id !== item.id));
//     }
//   };

//   return (
//     <div className="flex flex-col">
//       {options.map((opt) => {
//         const isChecked = Array.isArray(value) && value.some((v) => v.id === opt.value.id);

//         return (
//           <label
//             key={opt.value.id}
//             className="flex items-center gap-2"
//           >
//             <input
//               type="checkbox"
//               checked={isChecked}
//               onChange={(e) =>
//                 handleToggle(opt.value, e.target.checked)
//               }
//             />
//             {opt.label}
//           </label>
//         );
//       })}
//     </div>
//   );
// };

// export default ListCheckBox;
import { useEffect, useMemo, useRef, useState } from "react";

const ListCheckBox = ({
  name,
  options = [],
  value = [],
  onChange,
}) => {
  const [selected, setSelected] = useState(
    Array.isArray(value) ? value : []
  );

  const optionKey = useMemo(
    () => options.map((o) => String(o.value.id)).join(","),
    [options]
  );

  const prevOptionKey = useRef(optionKey);

  useEffect(() => {
    if (prevOptionKey.current !== optionKey) {
      setSelected(Array.isArray(value) ? value : []);
      prevOptionKey.current = optionKey;
    }
  }, [optionKey, value]);

  const selectedIds = useMemo(
    () => new Set(selected.map((v) => String(v.id))),
    [selected]
  );

  const allSelected =
    options.length > 0 &&
    options.every((opt) => selectedIds.has(String(opt.value.id)));

  const someSelected =
    selected.length > 0 && !allSelected;

  const handleToggle = (item, checked) => {
    setSelected((prev) => {
      const current = Array.isArray(prev) ? prev : [];
      let next;

      if (checked) {
        const exists = current.some(
          (v) => String(v.id) === String(item.id)
        );
        next = exists ? current : [...current, item];
      } else {
        next = current.filter(
          (v) => String(v.id) !== String(item.id)
        );
      }

      onChange(name, next);
      return next;
    });
  };

  const handleToggleAll = (checked) => {
    const next = checked ? options.map((opt) => opt.value) : [];
    setSelected(next);
    onChange(name, next);
  };

  if (options.length === 0) {
    return (
      <div className="text-sm text-gray-400 py-2">
        No attendees to show
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => {
              if (el) {
                el.indeterminate = someSelected;
              }
            }}
            onChange={(e) => handleToggleAll(e.target.checked)}
          />
          Select All
        </label>

        <span className="inline-flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5">
          {selected.length} / {options.length}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        {options.map((opt) => {
          const isChecked = selectedIds.has(
            String(opt.value.id)
          );

          return (
            <label
              key={opt.value.id}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition ${
                isChecked
                  ? "bg-emerald-50"
                  : "hover:bg-gray-50"
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) =>
                  handleToggle(opt.value, e.target.checked)
                }
              />

              <span
                className={`text-sm ${
                  isChecked
                    ? "text-emerald-800 font-medium"
                    : "text-gray-700"
                }`}
              >
                {opt.label}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default ListCheckBox;