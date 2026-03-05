import { useState } from "react";
import { useList } from "../context/ListContext";
import { parseQuery } from "../hooks/useQueryParser";
import { useRef } from "react";
import { useEffect } from "react";

export function ListFilters() {
  const { query, setQuery, config } = useList();
  // Track which specific filter dropdown is currently open
  const [searchQuery, setSearchQuery] = useState("");
  const [openDropdownKey, setOpenDropdownKey] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpenDropdownKey(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!config.filters) return null;

  const parsed = parseQuery(query);

  const updateQuery = (key, value) => {
    const otherFilters = Object.entries(parsed.filters)
      .filter(([k]) => k !== key)
      .map(([k, v]) => `${k}:${v}`);

    if (value) {
      otherFilters.push(`${key}:${value}`);
    }
    const newQuery = [...otherFilters, parsed.text].filter(Boolean).join(" ");
    setQuery(newQuery);
    setOpenDropdownKey(null); // Close after selection
  };

  const theme = config.theme || {};
  const buttonClasses =
    theme.filterButton ||
    "px-3 py-1.5 text-sm font-medium border border-ghBorder rounded-md bg-white text-ghText hover:border-gray-300 transition-colors flex items-center gap-1";

  return (
    <div className="flex gap-2 items-center" ref={ref}>
      {config.filters.map((filter) => {
        // Find the currently selected option for this filter
        const currentValue = parsed.filters[filter.key] || "";
        const activeOption =
          filter.options.find((opt) => opt.value == currentValue) ||
          filter.options[0];
        const isOpen = openDropdownKey === filter.key;

        return (
          <div key={filter.key} className="relative">
            <button
              onClick={() => setOpenDropdownKey(isOpen ? null : filter.key)}
              className={buttonClasses}
            >
              {activeOption.label} <span className="text-xs ml-1">▾</span>
            </button>

            {isOpen && (
              <div
                className="absolute left-0 mt-2 w-48 bg-white border border-ghBorder rounded-md shadow-lg z-50 py-1"
                style={{
                  maxHeight: "400px",
                  overflowY: "auto",
                }}
              >
                <div className = "px-4 py-2">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full p-1 border border-gray-300 rounded-md text-sm focus:outline-none"
                    onChange={(e)=> setSearchQuery(e.target.value)}
                  />
                </div>
                {filter.options
                .filter(opt=>opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((opt) => {
                  const isSelected = currentValue === opt.value  ;
  
                  return (
                    <div
                      key={opt.value}
                      onClick={() => updateQuery(filter.key, opt.value)}
                      className={`px-4 py-2 text-sm cursor-pointer flex items-center gap-2 transition-colors ${
                        isSelected
                          ? "font-semibold text-brand-yellow bg-brand-yhover"
                          : "text-ghText hover:bg-gray-50"
                      }`}
                    >
                      <span className="w-3 text-brand-yellow">
                        {isSelected ? "✓" : ""}
                      </span>
                      {opt.label}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// import { useList } from "../context/ListContext";

// export function ListFilters() {
//   const { filters, setFilters, config } = useList()

//   if (!config.filters) return null

//   return (
//     <div className="flex gap-3 p-3 border-b border-gray-700">
//       {config.filters.map(filter => (
//         <div key={filter.key}>
//           <select
//             value={filters[filter.key] || ""}
//             onChange={(e) =>
//               setFilters(prev => ({
//                 ...prev,
//                 [filter.key]: e.target.value
//               }))
//             }
//             className=" border border-gray-700 px-2 py-1 rounded"
//           >
//             {filter.options.map(opt => (
//               <option key={opt.value} value={opt.value}>
//                 {opt.label}
//               </option>
//             ))}
//           </select>
//         </div>
//       ))}
//     </div>
//   )
// }
