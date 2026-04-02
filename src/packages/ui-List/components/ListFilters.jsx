import React, { useState, useEffect, useRef } from "react";
import { useList } from "../context/ListContext";
import { parseQuery } from "../hooks/useQueryParser";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export function ListFilters() {
  const { query, setQuery, config } = useList();
  const [searchQuery, setSearchQuery] = useState("");
  const [openDropdownKey, setOpenDropdownKey] = useState(null);

  const wrapperRef = useRef(null);
  const searchInputRef = useRef(null);
  const optionsRefs = useRef([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  if (!config?.filters) return null;
  const parsed = parseQuery(query);
  // --- Helper Functions ---

  const updateQuery = (key, value) => {
    const otherFilters = Object.entries(parsed.filters)
      .filter(([k]) => k !== key)
      .map(([k, v]) => `${k}:${v}`);

    if (value) {
      otherFilters.push(`${key}:${value}`);
    }

    const newQuery = [...otherFilters, parsed.text].filter(Boolean).join(" ");

    setQuery(newQuery);
    setOpenDropdownKey(null);
    setSearchQuery("");
  };

  const handleKeyDown = (event) => {
    const listbox = wrapperRef.current?.querySelector('[role="listbox"]');
    if (!listbox) return;

    const options = Array.from(listbox.querySelectorAll('[role="option"]'));
    if (!options.length) return;

    const currentIndex = highlightedIndex;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setHighlightedIndex((prev) =>
          prev < options.length - 1 ? prev + 1 : 0,
        );
        break;
      case "ArrowUp":
        event.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : options.length - 1,
        );
        break;
      case "Enter":
        event.preventDefault();
        if (currentIndex >= 0) {
          const selectedValue = options[currentIndex].dataset.value;
          updateQuery(openDropdownKey, selectedValue);
        }
        break;
      case "Escape":
      case "Tab":
        setOpenDropdownKey(null);
        break;
      default:
        break;
    }
  };

  // --- Effects ---

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpenDropdownKey(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (openDropdownKey && searchInputRef.current) {
      searchInputRef.current.focus();
      setHighlightedIndex(0);
    }
  }, [openDropdownKey]);

  // Scroll highlighted option into view
  useEffect(() => {
    const el = optionsRefs.current[highlightedIndex];
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  // --- Styling ---

  const theme = config.theme || {};
  const buttonClasses =
    theme.filterButton ||
    "px-3 py-1.5 text-sm font-medium border border-ghBorder rounded-md bg-white text-ghText hover:border-gray-300 transition-colors flex items-center gap-1";

  // --- Render ---

  return (
    <div className="flex gap-2 items-center" ref={wrapperRef}>
      {config.filters.map((filter) => {
        const currentValue = parsed.filters[filter.key] || "";

        const activeOption = (filter.options &&
          filter.options.find((opt) => opt.value === currentValue)) ||
          (filter.options && filter.options[0]) || {
            label: "No options",
            value: "",
          };

        const isOpen = openDropdownKey === filter.key;

        const filteredOptions =
          filter.options?.filter((opt) =>
            opt.label?.toLowerCase().includes(searchQuery.toLowerCase()),
          ) || [];

        // Date Picker Template
        if (filter.type === "date") {
          const dateValue = currentValue ? new Date(currentValue) : new Date();
          return (
            <div key={filter.key} className="relative">
              <div className="py-2">
                <DatePicker
                  selected={dateValue}
                  onChange={(date) => {
                    const formatted = date.toISOString().split("T")[0];
                    updateQuery(filter.key, formatted);
                  }}
                  dateFormat="dd/MM/yyyy"
                  className="w-24 p-1.5 border border-gray-300 rounded-md text-sm focus:outline-none"
                />
              </div>
            </div>
          );
        }

        // Standard Dropdown Template
        return (
          <div key={filter.key} className="relative">
            <button
              onClick={() => setOpenDropdownKey(isOpen ? null : filter.key)}
              className={buttonClasses}
              aria-haspopup="listbox"
              aria-expanded={isOpen}
            >
              {activeOption.label} <span className="text-xs ml-1">▼</span>
            </button>

            {isOpen && (
              <div
                role="listbox"
                tabIndex={0}
                onKeyDown={handleKeyDown}
                className="absolute left-0 mt-2 w-48 bg-white border border-ghBorder rounded-md shadow-lg z-50 py-1"
                style={{ maxHeight: "400px", overflowY: "auto" }}
              >
                <div className="px-4 py-2">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search..."
                    className="w-full p-1 border border-gray-300 rounded-md text-sm focus:outline-none"
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setHighlightedIndex(0);
                    }}
                  />
                </div>
                {filteredOptions.map((opt, index) => {
                  const isSelected = currentValue === opt.value;
                  const isHighlighted = index === highlightedIndex;

                  return (
                    <div
                      key={opt.value}
                      role="option"
                      data-value={opt.value}
                      ref={(el) => (optionsRefs.current[index] = el)}
                      onClick={() => updateQuery(filter.key, opt.value)}
                      className={`px-4 py-2 text-sm cursor-pointer flex items-center gap-2 transition-colors ${
                        isHighlighted ? "bg-gray-100" : "hover:bg-gray-50" // Keyboard focus gets gray background
                      } ${
                        isSelected
                          ? "text-brand-yellow font-semibold"
                          : "text-ghText" // Selected gets yellow text
                      }`}
                      // className={`px-4 py-2 text-sm cursor-pointer flex items-center gap-2 transition-colors ${
                      //     isHighlighted
                      //     ? "bg-brand-yhover text-brand-yellow font-semibold"
                      //     : isSelected
                      //     ? "font-semibold text-brand-yellow bg-brand-yhover"
                      //     : "text-ghText hover:bg-gray-50"
                      // }`}
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

// import { useState } from "react";
// import { useList } from "../context/ListContext";
// import { parseQuery } from "../hooks/useQueryParser";
// import { useRef } from "react";
// import { useEffect } from "react";

// export function ListFilters() {
//   const { query, setQuery, config } = useList();
//   // Track which specific filter dropdown is currently open
//   const [searchQuery, setSearchQuery] = useState("");
//   const [openDropdownKey, setOpenDropdownKey] = useState(null);
//   const ref = useRef(null);

//   useEffect(() => {
//     function handleClickOutside(e) {
//       if (ref.current && !ref.current.contains(e.target)) {
//         setOpenDropdownKey(null);
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   if (!config.filters) return null;

//   const parsed = parseQuery(query);

//   const updateQuery = (key, value) => {
//     const otherFilters = Object.entries(parsed.filters)
//       .filter(([k]) => k !== key)
//       .map(([k, v]) => `${k}:${v}`);

//     if (value) {
//       otherFilters.push(`${key}:${value}`);
//     }
//     const newQuery = [...otherFilters, parsed.text].filter(Boolean).join(" ");
//     setQuery(newQuery);
//     setOpenDropdownKey(null); // Close after selection
//   };

//   const theme = config.theme || {};
//   const buttonClasses =
//     theme.filterButton ||
//     "px-3 py-1.5 text-sm font-medium border border-ghBorder rounded-md bg-white text-ghText hover:border-gray-300 transition-colors flex items-center gap-1";

//   return (
//     <div className="flex gap-2 items-center" ref={ref}>
//       {config.filters.map((filter) => {
//         // Find the currently selected option for this filter
//         const currentValue = parsed.filters[filter.key] || "";
//         const activeOption =
//           filter.options.find((opt) => opt.value == currentValue) ||
//           filter.options[0];
//         const isOpen = openDropdownKey === filter.key;

//         return (
//           <div key={filter.key} className="relative">
//             <button
//               onClick={() => setOpenDropdownKey(isOpen ? null : filter.key)}
//               className={buttonClasses}
//             >
//               {activeOption.label} <span className="text-xs ml-1">▾</span>
//             </button>

//             {isOpen && (
//               <div
//                 className="absolute left-0 mt-2 w-48 bg-white border border-ghBorder rounded-md shadow-lg z-50 py-1"
//                 style={{
//                   maxHeight: "400px",
//                   overflowY: "auto",
//                 }}
//               >
//                 <div className = "px-4 py-2">
//                   <input
//                     type="text"
//                     placeholder="Search..."
//                     className="w-full p-1 border border-gray-300 rounded-md text-sm focus:outline-none"
//                     onChange={(e)=> setSearchQuery(e.target.value)}
//                   />
//                 </div>
//                 {filter.options
//                 .filter(opt=>opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
//                 .map((opt) => {
//                   const isSelected = currentValue === opt.value  ;

//                   return (
//                     <div
//                       key={opt.value}
//                       onClick={() => updateQuery(filter.key, opt.value)}
//                       className={`px-4 py-2 text-sm cursor-pointer flex items-center gap-2 transition-colors ${
//                         isSelected
//                           ? "font-semibold text-brand-yellow bg-brand-yhover"
//                           : "text-ghText hover:bg-gray-50"
//                       }`}
//                     >
//                       <span className="w-3 text-brand-yellow">
//                         {isSelected ? "✓" : ""}
//                       </span>
//                       {opt.label}
//                     </div>
//                   );
//                 })}
//               </div>
//             )}
//           </div>
//         );
//       })}
//     </div>
//   );
// }
