import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useList } from "../context/ListContext";
import { parseQuery } from "../hooks/useQueryParser";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import dayjs from "dayjs";
import { useSearchParams } from "react-router-dom";
import { WeekRangeFilter } from "./weeklyFilter";

export function ListFilters() {
  const { query, setQuery, config, filterCounts,userRole } = useList();
  const [searchQuery, setSearchQuery] = useState("");
  const [openDropdownKey, setOpenDropdownKey] = useState(null);
  const wrapperRef = useRef(null);
  const searchInputRef = useRef(null);
  const optionsRefs = useRef([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState({top:0, left:0, width:0});
  const triggerRefs = useRef({});

  if (!config?.filters) return null;
  const visibleFilters = config.filters.filter(
    (f) => !f.allowedRoles || f.allowedRoles.includes(userRole)
  );
  if (!visibleFilters.length) return null;
  const parsed = parseQuery(query);

  const updateQuery = (key, values, isMulti = false) => {
    const currentParsed = parseQuery(query);

    const otherFilters = Object.entries(currentParsed.filters)
      .filter(([k]) => k !== key)
      .map(([k, v]) => `${k}:${Array.isArray(v) ? v.join(",") : v}`);

    const normalizedValues = Array.isArray(values)
      ? values
      : values !== undefined && values !== null && values !== ""
        ? [String(values)]
        : [];

    if (normalizedValues.length > 0) {
      const joined = normalizedValues.join(",");
      const safe = joined.includes(" ") ? `"${joined}"` : joined;
      otherFilters.push(`${key}:${safe}`);
    }

    const newQuery = [...otherFilters, currentParsed.text]
      .filter(Boolean)
      .join(" ");
    setQuery(newQuery);
    setSearchQuery("");
    if (!isMulti) setOpenDropdownKey(null);
  };

  useEffect(() => {
    function handleClickOutside(e) {
      const portal = document.getElementById("list-filter-portal");
      if (wrapperRef.current && !wrapperRef.current.contains(e.target) && 
      (!portal || !portal.contains(e.target))
    ) {
        setOpenDropdownKey(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (openDropdownKey && searchInputRef.current) {
      searchInputRef.current.focus();
      setHighlightedIndex(0);
    }
  }, [openDropdownKey]);

  useEffect(() => {
    const el = optionsRefs.current[highlightedIndex];
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  const theme = config.theme || {};
  const buttonClasses =
    theme.filterButton ||
    "px-2 py-1.5 text-xs font-medium border border-gray-200 rounded-md bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-1";

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
          const selectedValue = String(options[currentIndex].dataset.value);
          const filter = config.filters.find((f) => f.key === openDropdownKey);
          const isMultiSelect = !!filter?.allowMultiple;

          const rawVal = parseQuery(query).filters[openDropdownKey];
          const updatedSelected = Array.isArray(rawVal)
            ? rawVal.map(String)
            : rawVal
              ? [String(rawVal)]
              : [];

          if (isMultiSelect) {
            const newSelection = updatedSelected.includes(selectedValue)
              ? updatedSelected.filter((val) => val !== selectedValue)
              : [...updatedSelected, selectedValue];
            updateQuery(openDropdownKey, newSelection, true);
          } else {
            updateQuery(openDropdownKey, [selectedValue]);
            setOpenDropdownKey(null);
          }
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

  const shiftDate = (filter, currentValue, days) => {
    const date = currentValue ? dayjs(currentValue) : dayjs();
    const updatedDate = date
      .add(days, "day")
      .startOf("day")
      .format("YYYY-MM-DD");
    updateQuery(filter.key, updatedDate);
  };

  const isAllOption = (val) => val === "" || val === null || (Array.isArray(val) && val.length === 0);
  return (
    <div className="flex gap-2 items-center" ref={wrapperRef}>
      {visibleFilters.map((filter, index) => {
        const rawParsedValue = parsed.filters[filter.key];
        const selectedValues = Array.isArray(rawParsedValue)
          ? rawParsedValue.map(String)
          : rawParsedValue !== undefined &&
            rawParsedValue !== null &&
            rawParsedValue !== ""
            ? [String(rawParsedValue)]
            : [];

        const isMultiSelect = !!filter.allowMultiple;
        const isOpen = openDropdownKey === filter.key;

        const filteredOptions = (filter?.options || [])
          .filter((opt) =>
            opt?.label?.toLowerCase().includes(searchQuery.toLowerCase()),
          )
          .sort((a, b) => {
            const aIsAll = isAllOption(a.value);
            const bIsAll = isAllOption(b.value);

            if (aIsAll && !bIsAll) return -1;
            if (!aIsAll && bIsAll) return 1;

            if (filter.showCounts) {
              const countA = filterCounts[filter.key]?.[a.value] ?? 0;
              const countB = filterCounts[filter.key]?.[b.value] ?? 0;

              const aHasCount = countA > 0;
              const bHasCount = countB > 0;

              if (aHasCount && !bHasCount) return -1;
              if (!aHasCount && bHasCount) return 1;
            }

            return String(a.label || "").localeCompare(String(b.label || ""), undefined, {
              sensitivity: "base",
            });
          });

        const activeOption = filter.options?.find((opt) =>
          selectedValues.includes(String(opt.value)),
        ) || filter.options?.[0] || { label: "No options", value: "" };
        const entityLabel = filter.options
          ?.find((opt) => /^all\s+/i.test(opt.label))
          ?.label?.replace(/^all\s+/i, "")
          .trim();
        const selectedLabel =
          isMultiSelect && selectedValues.length > 1
            ? `${selectedValues.length} ${entityLabel}`
            : activeOption?.label;

        const currentValue = parsed.filters[filter.key] || "";

        const isRightAligned = index >= config.filters.length - 2;

        if (filter.type === "date") {
          const dateValue = currentValue ? new Date(currentValue) : new Date();
          return (
            <div key={filter.key} className="relative py-2">
              <div className="flex item-center w-fit border border-gray-300 rounded-md bg-white overflow-hidden">
                <button
                  onClick={() => shiftDate(filter, currentValue, -1)}
                  className="px-1 hover:bg-gray-100 text-gray-500 transition-colors border-r border-gray-200"
                >
                  <span className="text-[10px]"> ◁ </span>
                </button>
                <div className="py-1">
                  <DatePicker
                    selected={dateValue}
                    onChange={(date) => {
                      const formatted = dayjs(date).format("YYYY-MM-DD");
                      updateQuery(filter.key, formatted);
                    }}
                    dateFormat="dd/MM/yyyy"
                    className="w-20 border px-1 py-0 border-gray-300 rounded-md text-sm focus:outline-none border-none bg-transparent"
                  />
                </div>
                <button
                  onClick={() => shiftDate(filter, currentValue, 1)}
                  className="px-1 hover:bg-gray-100 text-gray-500 transition-colors border-l border-gray-200"
                >
                  <span className="text-[10px]"> ▷ </span>
                </button>
              </div>
            </div>
          );
        }

        if (filter.type === "weekRange") {
          return (
            <WeekRangeFilter
              key={filter.key}
              filter={filter}
              currentValue={currentValue}
              updateQuery={updateQuery}
            />
          );
        }

        return (
          <div key={filter.key} className="relative">
            <button
              ref = {(el) => (triggerRefs.current[filter.key] = el)}
              onClick={()=>{
                if (isOpen){
                  setOpenDropdownKey(null);
                } else {
                  const rect = triggerRefs.current[filter.key]?.getBoundingClientRect();
                  if (rect) {
                    setDropdownPosition({
                      top:rect.bottom + 4,
                      left: isRightAligned ? rect.right - 224 : rect.left,
                    });
                  }
                  setOpenDropdownKey(filter.key);
                }
              }}
              className={buttonClasses}
              aria-haspopup="listbox"
              aria-expanded={isOpen}
            >
              {selectedLabel} <span className="text-xs ml-1">▾</span>
            </button>

            {isOpen && createPortal (
              <div
                id="list-filter-portal"
                role="listbox"
                tabIndex={0}
                className="bg-white border border-gray-200 rounded-lg shadow-2xl flex flex-col overflow-hidden"
                style={{ 
                  position:"fixed",
                  top:dropdownPosition.top,
                  left:dropdownPosition.left,
                  width:"224px",
                  maxHeight: "350px",
                  zIndex: 99999 
                }}
                onKeyDown={handleKeyDown}
                aria-activedescendant={filteredOptions[highlightedIndex]?.value}
              >
                {/* Search Header Wrapper (shrink-0 keeps it from collapsing) */}
                <div className="p-2 bg-gray-50 border-b border-gray-100 shrink-0">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search..."
                    className="w-full p-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setHighlightedIndex(0);
                    }}
                  />
                </div>

                {/* Scrollable List Wrapper */}
                <div className="overflow-y-auto flex-1 py-1 custom-scrollbar">
                  {filteredOptions.map((opt, index) => {
                    const isAll = isAllOption(opt.value);

                    const isSelected = isAll
                      ? selectedValues.length === 0
                      : selectedValues.includes(String(opt.value));

                    const isHighlighted = index === highlightedIndex;
                    const showCounts = !!filter.showCounts;
                    const count = showCounts
                      ? (filterCounts[filter.key]?.[opt.value] ?? 0)
                      : null;

                    return (
                      <div
                        key={opt.value}
                        role="option"
                        data-value={opt.value}
                        ref={(el) => (optionsRefs.current[index] = el)}
                        onClick={() => {
                          if (isAll) {
                            updateQuery(filter.key, [opt.value], false);
                            setOpenDropdownKey(null);
                            return;
                          }

                          const currentSelected = selectedValues.filter(
                            (v) => v !== "" && v !== null,
                          );

                          let newSelection;
                          if (isMultiSelect) {
                            const alreadySelected = currentSelected.includes(
                              String(opt.value),
                            );
                            newSelection = alreadySelected
                              ? currentSelected.filter(
                                (val) => val !== String(opt.value),
                              )
                              : [...currentSelected, String(opt.value)];
                          } else {
                            newSelection = [String(opt.value)];
                            setOpenDropdownKey(null);
                          }

                          updateQuery(
                            filter.key,
                            newSelection,
                            filter.allowMultiple,
                          );
                        }}
                        className={`px-2 py-2 mx-1 rounded-md text-xs cursor-pointer flex items-center gap-2 transition-colors ${isSelected
                          ? "font-semibold text-brand-yellow bg-brand-yhover"
                          : isHighlighted
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-700 hover:bg-gray-50"
                          }`}
                      >
                        <div className="flex items-center justify-between w-full transition">
                          <div className="flex items-center gap-2 truncate pr-2">
                            <span className="w-3 text-brand-yellow flex-shrink-0">
                              {isSelected ? "✓" : ""}
                            </span>
                            <span className="truncate">{opt.label}</span>
                          </div>
                          <div>
                            {showCounts && (
                              <span className="text-[10px] bg-white border border-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full font-medium shadow-sm">
                                {count}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>,
              document.body
            )}
          </div>
        );
      })}
    </div>
  );
}
// export function ListFilters() {
//   // 1. Removed selectedOptions and setSelectedOptions from context destruction
//   const { query, setQuery, config, filterCounts } = useList();
//   const [searchQuery, setSearchQuery] = useState("");
//   const [openDropdownKey, setOpenDropdownKey] = useState(null);
//   const wrapperRef = useRef(null);
//   const searchInputRef = useRef(null);
//   const optionsRefs = useRef([]);
//   const [highlightedIndex, setHighlightedIndex] = useState(0);

//   if (!config?.filters) return null;
//   const parsed = parseQuery(query);

//   const updateQuery = (key, values, isMulti = false) => {
//     const currentParsed = parseQuery(query);

//     const otherFilters = Object.entries(currentParsed.filters)
//       .filter(([k]) => k !== key)
//       .map(([k, v]) => `${k}:${Array.isArray(v) ? v.join(",") : v}`);

//     const normalizedValues = Array.isArray(values)
//       ? values
//       : values !== undefined && values !== null && values !== ""
//         ? [String(values)]
//         : [];

//     if (normalizedValues.length > 0) {
//       const joined = normalizedValues.join(",");
//       const safe = joined.includes(" ") ? `"${joined}"` : joined;
//       otherFilters.push(`${key}:${safe}`);
//     }

//     const newQuery = [...otherFilters, currentParsed.text]
//       .filter(Boolean)
//       .join(" ");
//     setQuery(newQuery);
//     setSearchQuery("");
//     if (!isMulti) setOpenDropdownKey(null);
//   };

//   useEffect(() => {
//     function handleClickOutside(e) {
//       if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
//         setOpenDropdownKey(null);
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   useEffect(() => {
//     if (openDropdownKey && searchInputRef.current) {
//       searchInputRef.current.focus();
//       setHighlightedIndex(0);
//     }
//   }, [openDropdownKey]);

//   useEffect(() => {
//     const el = optionsRefs.current[highlightedIndex];
//     if (el) el.scrollIntoView({ block: "nearest" });
//   }, [highlightedIndex]);

//   const theme = config.theme || {};
//   const buttonClasses =
//     theme.filterButton ||
//     "px-2 py-1.5 text-xs font-medium border border-ghBorder rounded-md bg-white text-ghText hover:border-gray-300 transition-colors flex items-center gap-1";

//   const handleKeyDown = (event) => {
//     const listbox = wrapperRef.current?.querySelector('[role="listbox"]');
//     if (!listbox) return;
//     const options = Array.from(listbox.querySelectorAll('[role="option"]'));
//     if (!options.length) return;
//     const currentIndex = highlightedIndex;

//     switch (event.key) {
//       case "ArrowDown":
//         event.preventDefault();
//         setHighlightedIndex((prev) =>
//           prev < options.length - 1 ? prev + 1 : 0,
//         );
//         break;
//       case "ArrowUp":
//         event.preventDefault();
//         setHighlightedIndex((prev) =>
//           prev > 0 ? prev - 1 : options.length - 1,
//         );
//         break;
//       case "Enter":
//         event.preventDefault();
//         if (currentIndex >= 0) {
//           const selectedValue = String(options[currentIndex].dataset.value);
//           const filter = config.filters.find((f) => f.key === openDropdownKey);
//           const isMultiSelect = !!filter?.allowMultiple;

//           // 2. Derive selection from parsed query on Enter key
//           const rawVal = parseQuery(query).filters[openDropdownKey];
//           const updatedSelected = Array.isArray(rawVal)
//             ? rawVal.map(String)
//             : rawVal
//               ? [String(rawVal)]
//               : [];

//           if (isMultiSelect) {
//             const newSelection = updatedSelected.includes(selectedValue)
//               ? updatedSelected.filter((val) => val !== selectedValue)
//               : [...updatedSelected, selectedValue];
//             updateQuery(openDropdownKey, newSelection, true);
//           } else {
//             updateQuery(openDropdownKey, [selectedValue]);
//             setOpenDropdownKey(null);
//           }
//         }
//         break;
//       case "Escape":
//       case "Tab":
//         setOpenDropdownKey(null);
//         break;
//       default:
//         break;
//     }
//   };

//   const shiftDate = (filter, currentValue, days) => {
//     const date = currentValue ? dayjs(currentValue) : dayjs();
//     const updatedDate = date
//       .add(days, "day")
//       .startOf("day")
//       .format("YYYY-MM-DD");
//     updateQuery(filter.key, updatedDate);
//   };

//   return (
//     <div className="flex gap-2 items-center" ref={wrapperRef}>
//       {config.filters.map((filter) => {
//         // 3. Single Source of Truth: Get selected values directly from the parsed query
//         const rawParsedValue = parsed.filters[filter.key];
//         const selectedValues = Array.isArray(rawParsedValue)
//           ? rawParsedValue.map(String)
//           : rawParsedValue !== undefined &&
//               rawParsedValue !== null &&
//               rawParsedValue !== ""
//             ? [String(rawParsedValue)]
//             : [];

//         const isMultiSelect = !!filter.allowMultiple;
//         const isOpen = openDropdownKey === filter.key;
//         // const filteredOptions = filter?.options?.filter((opt) =>
//         //   opt.label?.toLowerCase()?.includes(searchQuery.toLowerCase()),
//         // );
//         const filteredOptions = (filter?.options || [])
//           .filter((opt) =>
//             opt?.label?.toLowerCase().includes(searchQuery.toLowerCase()),
//           )
//           .sort((a, b) =>
//             a.label.localeCompare(b.label, undefined, {
//               sensitivity: "base",
//             }),
//           );

//         // Safely determine active option for single select fallback
//         const activeOption = filter.options?.find((opt) =>
//           selectedValues.includes(String(opt.value)),
//         ) ||
//           filter.options?.[0] || { label: "No options", value: "" };

//         const selectedLabel =
//           isMultiSelect && selectedValues.length > 0
//             ? `${selectedValues.length} selected`
//             : activeOption?.label;

//         const currentValue = parsed.filters[filter.key] || "";

//         if (filter.type === "date") {
//           const dateValue = currentValue ? new Date(currentValue) : new Date();
//           return (
//             <div key={filter.key} className="relative py-2">
//               <div className="flex item-center w-fit border border-gray-300 rounded-md bg-white overflow-hidden">
//                 <button
//                   onClick={() => shiftDate(filter, currentValue, -1)}
//                   className="px-1 hover:bg-gray-100 text-gray-500 transition-colors border-r border-gray-200"
//                 >
//                   <span className="text-[10px]"> ◁ </span>
//                 </button>
//                 <div className="py-1">
//                   <DatePicker
//                     selected={dateValue}
//                     onChange={(date) => {
//                       const formatted = dayjs(date).format("YYYY-MM-DD");
//                       updateQuery(filter.key, formatted);
//                     }}
//                     dateFormat="dd/MM/yyyy"
//                     className="w-20 border px-1 py-0 border-gray-300 rounded-md text-sm focus:outline-none border-none bg-transparent"
//                   />
//                 </div>
//                 <button
//                   onClick={() => shiftDate(filter, currentValue, 1)}
//                   className="px-1 hover:bg-gray-100 text-gray-500 transition-colors border-l border-gray-200"
//                 >
//                   <span className="text-[10px]"> ▷ </span>
//                 </button>
//               </div>
//             </div>
//           );
//         }
//         if (filter.type === "weekRange") {
//           return (
//             <WeekRangeFilter
//               key={filter.key}
//               filter={filter}
//               currentValue={currentValue}
//               updateQuery={updateQuery}
//             />
//           );
//         }
//         return (
//           <div key={filter.key} className="relative">
//             <button
//               onClick={() => setOpenDropdownKey(isOpen ? null : filter.key)}
//               className={buttonClasses}
//               aria-haspopup="listbox"
//               aria-expanded={isOpen}
//             >
//               {selectedLabel} <span className="text-xs ml-1">▾</span>
//             </button>

//             {isOpen && (
//               <div
//                 role="listbox"
//                 tabIndex={0}
//                 className="absolute left-0 mt-2 w-48 bg-white border border-ghBorder rounded-md shadow-lg z-60 py-1"
//                 style={{ maxHeight: "400px", overflowY: "auto" }}
//                 onKeyDown={handleKeyDown}
//                 aria-activedescendant={filteredOptions[highlightedIndex]?.value}
//               >
//                 <div className="px-2 py-2">
//                   <input
//                     ref={searchInputRef}
//                     type="text"
//                     placeholder="Search..."
//                     className="w-full p-1 border border-gray-300 rounded-md text-xs focus:outline-none"
//                     onChange={(e) => {
//                       setSearchQuery(e.target.value);
//                       setHighlightedIndex(0);
//                     }}
//                   />
//                 </div>
//                 {filteredOptions.map((opt, index) => {
//                   const isAllOption =
//                     opt.value === "" ||
//                     opt.value === null ||
//                     (Array.isArray(opt.value) && opt.value.length === 0);

//                   // 4. Determine selection strictly from selectedValues array
//                   const isSelected = isAllOption
//                     ? selectedValues.length === 0
//                     : selectedValues.includes(String(opt.value));

//                   const isHighlighted = index === highlightedIndex;
//                   const showCounts = !!filter.showCounts;
//                   const count = showCounts
//                     ? (filterCounts[filter.key]?.[opt.value] ?? 0)
//                     : null;

//                   return (
//                     <div
//                       key={opt.value}
//                       role="option"
//                       data-value={opt.value}
//                       ref={(el) => (optionsRefs.current[index] = el)}
//                       onClick={() => {
//                         if (isAllOption) {
//                           // "All" clicked — wipe all selections for this filter
//                           updateQuery(filter.key, [opt.value], false);
//                           setOpenDropdownKey(null);
//                           return;
//                         }

//                         // Remove "All" from selection if it was there
//                         const currentSelected = selectedValues.filter(
//                           (v) => v !== "" && v !== null,
//                         );

//                         let newSelection;
//                         if (isMultiSelect) {
//                           const alreadySelected = currentSelected.includes(
//                             String(opt.value),
//                           );
//                           newSelection = alreadySelected
//                             ? currentSelected.filter(
//                                 (val) => val !== String(opt.value),
//                               ) // deselect
//                             : [...currentSelected, String(opt.value)]; // select
//                         } else {
//                           newSelection = [String(opt.value)];
//                           setOpenDropdownKey(null);
//                         }

//                         updateQuery(
//                           filter.key,
//                           newSelection,
//                           filter.allowMultiple,
//                         );
//                       }}
//                       className={`px-2 py-2 text-xs cursor-pointer flex items-center gap-2 transition-colors ${
//                         isSelected
//                           ? "font-semibold text-brand-yellow bg-brand-yhover"
//                           : isHighlighted
//                             ? "bg-gray-100 text-ghText"
//                             : "text-ghText hover:bg-gray-50"
//                       }`}
//                     >
//                       <div className="flex items-center justify-between w-full rounded-md transition">
//                         <div className="flex items-center gap-2">
//                           <span className="w-3 text-brand-yellow">
//                             {isSelected ? "✓" : ""}
//                           </span>
//                           <span>{opt.label}</span>
//                         </div>
//                         <div>
//                           {showCounts && (
//                             <span className="text-[10px] bg-gray-100 border border-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full font-medium shadow-sm">
//                               {count}
//                             </span>
//                           )}
//                         </div>
//                       </div>
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
