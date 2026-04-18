import React, { useState, useEffect, useRef } from "react";
import { useList } from "../context/ListContext";
import { parseQuery } from "../hooks/useQueryParser";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import dayjs from "dayjs";
import { useSearchParams } from "react-router-dom";

export function ListFilters() {
  // 1. Removed selectedOptions and setSelectedOptions from context destruction
  const { query, setQuery, config, filterCounts } = useList();
  const [searchQuery, setSearchQuery] = useState("");
  const [openDropdownKey, setOpenDropdownKey] = useState(null);
  const wrapperRef = useRef(null);
  const searchInputRef = useRef(null);
  const optionsRefs = useRef([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  if (!config?.filters) return null;
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
    if (!isMulti) setOpenDropdownKey(null);
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
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
    "px-2 py-1.5 text-xs font-medium border border-ghBorder rounded-md bg-white text-ghText hover:border-gray-300 transition-colors flex items-center gap-1";

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

          // 2. Derive selection from parsed query on Enter key
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

  return (
    <div className="flex gap-2 items-center" ref={wrapperRef}>
      {config.filters.map((filter) => {
        // 3. Single Source of Truth: Get selected values directly from the parsed query
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
        // const filteredOptions = filter?.options?.filter((opt) =>
        //   opt.label?.toLowerCase()?.includes(searchQuery.toLowerCase()),
        // );
        const filteredOptions = (filter?.options || [])
        .filter((opt) => opt?.label?.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => a.label.localeCompare(b.label, undefined, {
                sensitivity: "base",
              }),
            );

        // Safely determine active option for single select fallback
        const activeOption = filter.options?.find((opt) =>
          selectedValues.includes(String(opt.value)),
        ) ||
          filter.options?.[0] || { label: "No options", value: "" };

        const selectedLabel =
          isMultiSelect && selectedValues.length > 0
            ? `${selectedValues.length} selected`
            : activeOption?.label;

        const currentValue = parsed.filters[filter.key] || "";

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

        return (
          <div key={filter.key} className="relative">
            <button
              onClick={() => setOpenDropdownKey(isOpen ? null : filter.key)}
              className={buttonClasses}
              aria-haspopup="listbox"
              aria-expanded={isOpen}
            >
              {selectedLabel} <span className="text-xs ml-1">▾</span>
            </button>

            {isOpen && (
              <div
                role="listbox"
                tabIndex={0}
                className="absolute left-0 mt-2 w-48 bg-white border border-ghBorder rounded-md shadow-lg z-50 py-1"
                style={{ maxHeight: "400px", overflowY: "auto" }}
                onKeyDown={handleKeyDown}
                aria-activedescendant={filteredOptions[highlightedIndex]?.value}
              >
                <div className="px-2 py-2">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search..."
                    className="w-full p-1 border border-gray-300 rounded-md text-xs focus:outline-none"
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setHighlightedIndex(0);
                    }}
                  />
                </div>
                {filteredOptions.map((opt, index) => {
                  const isAllOption =
                    opt.value === "" ||
                    opt.value === null ||
                    (Array.isArray(opt.value) && opt.value.length === 0);

                  // 4. Determine selection strictly from selectedValues array
                  const isSelected = isAllOption
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
                        if (isAllOption) {
                          // "All" clicked — wipe all selections for this filter
                          updateQuery(filter.key, [opt.value], false);
                          setOpenDropdownKey(null);
                          return;
                        }

                        // Remove "All" from selection if it was there
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
                              ) // deselect
                            : [...currentSelected, String(opt.value)]; // select
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
                      className={`px-2 py-2 text-xs cursor-pointer flex items-center gap-2 transition-colors ${
                        isSelected
                          ? "font-semibold text-brand-yellow bg-brand-yhover"
                          : isHighlighted
                            ? "bg-gray-100 text-ghText"
                            : "text-ghText hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full rounded-md transition">
                        <div className="flex items-center gap-2">
                          <span className="w-3 text-brand-yellow">
                            {isSelected ? "✓" : ""}
                          </span>
                          <span>{opt.label}</span>
                        </div>
                        <div>
                          {showCounts && (
                            <span className="text-[10px] bg-gray-100 border border-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full font-medium shadow-sm">
                              {count}
                            </span>
                          )}
                        </div>
                      </div>
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

// import React, { useState, useEffect, useRef } from "react";
// import { useList } from "../context/ListContext";
// import { parseQuery } from "../hooks/useQueryParser";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
// import dayjs from "dayjs";
// import { useSearchParams } from "react-router-dom";

// export function ListFilters() {
//   const {
//     query,
//     setQuery,
//     config,
//     selectedOptions,
//     setSelectedOptions,
//     filterCounts,
//   } = useList();
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

//     // ✅ Normalize — date/single filters pass a string, multi passes an array
//     const normalizedValues = Array.isArray(values)
//       ? values
//       : values !== undefined && values !== null && values !== ""
//         ? [String(values)]
//         : [];

//     if (normalizedValues.length > 0) {
//       const joined = normalizedValues.join(",");
//       // Wrap in quotes if value contains a space (e.g. date strings, names)
//       const safe = joined.includes(" ") ? `"${joined}"` : joined;
//       otherFilters.push(`${key}:${safe}`);
//     }

//     const newQuery = [...otherFilters, currentParsed.text]
//       .filter(Boolean)
//       .join(" ");
//     setQuery(newQuery);
//     if (!isMulti) setOpenDropdownKey(null);
//   };

//   // Close dropdown on click outside
//   useEffect(() => {
//     function handleClickOutside(e) {
//       if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
//         setOpenDropdownKey(null);
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // Focus search input when dropdown opens
//   useEffect(() => {
//     if (openDropdownKey && searchInputRef.current) {
//       searchInputRef.current.focus();
//       setHighlightedIndex(0);
//     }
//   }, [openDropdownKey]);

//   // Scroll highlighted option into view
//   useEffect(() => {
//     const el = optionsRefs.current[highlightedIndex];
//     if (el) el.scrollIntoView({ block: "nearest" });
//   }, [highlightedIndex]);

//   const theme = config.theme || {};
//   const buttonClasses =
//     theme.filterButton ||
//     "px-3 py-1.5 text-sm font-medium border border-ghBorder rounded-md bg-white text-ghText hover:border-gray-300 transition-colors flex items-center gap-1";

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
//           const selectedValue = options[currentIndex].dataset.value;
//           const filter = config.filters.find((f) => f.key === openDropdownKey);
//           const isMultiSelect = !!filter?.allowMultiple;
//           console.log("isMultiSelect :", isMultiSelect);

//           const updatedSelected = selectedOptions[openDropdownKey] || [];
//           if (isMultiSelect) {
//             const newSelection = updatedSelected.includes(selectedValue)
//               ? updatedSelected.filter((val) => val !== selectedValue)
//               : [...updatedSelected, selectedValue];
//             setSelectedOptions({
//               ...selectedOptions,
//               [openDropdownKey]: newSelection,
//             });
//             updateQuery(openDropdownKey, newSelection);
//           } else {
//             const newSelection = [selectedValue];
//             setSelectedOptions({
//               ...selectedOptions,
//               [openDropdownKey]: newSelection,
//             });
//             updateQuery(openDropdownKey, newSelection);
//             setOpenDropdownKey(null);
//           }
//           // updateQuery(openDropdownKey, selectedValue);
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
//         const currentValue = parsed.filters[filter.key] || "";
//         // Handle other filters (like Assignee, etc.)
//         const activeOption = (filter.options &&
//           filter.options.find((opt) => opt.value == currentValue)) ||
//           (filter.options && filter.options[0]) || {
//             label: "No options",
//             value: "",
//           };
//         const isOpen = openDropdownKey === filter.key;
//         const filteredOptions = filter?.options?.filter((opt) =>
//           opt.label?.toLowerCase()?.includes(searchQuery.toLowerCase()),
//         );
//         const isMultiSelect = !!filter.allowMultiple;
//         const selectedLabel =
//           isMultiSelect && selectedOptions[filter.key]?.length > 0
//             ? `${selectedOptions[filter.key].length} selected`
//             : activeOption?.label;
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

//         return (
//           <div key={filter.key} className="relative">
//             <button
//               onClick={() => setOpenDropdownKey(isOpen ? null : filter.key)}
//               className={buttonClasses}
//               aria-haspopup="listbox"
//               aria-expanded={isOpen}
//             >
//               {/* {activeOption.label} <span className="text-xs ml-1">▾</span> */}
//               {selectedLabel} <span className="text-xs ml-1">▾</span>
//             </button>

//             {isOpen && (
//               <div
//                 role="listbox"
//                 tabIndex={0}
//                 className="absolute left-0 mt-2 w-48 bg-white border border-ghBorder rounded-md shadow-lg z-50 py-1"
//                 style={{ maxHeight: "400px", overflowY: "auto" }}
//                 onKeyDown={handleKeyDown}
//                 aria-activedescendant={filteredOptions[highlightedIndex]?.value}
//               >
//                 <div className="px-4 py-2">
//                   <input
//                     ref={searchInputRef}
//                     type="text"
//                     placeholder="Search..."
//                     className="w-full p-1 border border-gray-300 rounded-md text-sm focus:outline-none"
//                     onChange={(e) => {
//                       setSearchQuery(e.target.value);
//                       setHighlightedIndex(0);
//                     }}
//                   />
//                 </div>
//                 {filteredOptions.map((opt, index) => {
//                   // const isSelected = currentValue == opt.value;
//                   // const isSelected =
//                   //   selectedOptions[filter.key]?.includes(opt.value) || false;
//                   const selectedValues = selectedOptions[filter.key] || [];

//                   const isAllOption =
//                     opt.value === "" || opt.value === null || opt.value === [];
//                   console.log(
//                     "isAllOption :",
//                     isAllOption,
//                     selectedValues,
//                     filter.key,
//                   );

//                   const isSelected = isAllOption
//                     ? selectedValues.length === 0
//                     : selectedValues.includes(opt.value);
//                   // const isSelected =
//                   //   opt.value === "" || opt.value === null
//                   //     ? (selectedOptions[filter.key] || []).filter(
//                   //         (v) => v !== "",
//                   //       ).length === 0 // "All" = nothing selected
//                   //     : (selectedOptions[filter.key] || []).includes(opt.value);
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
//                       // onClick={() => updateQuery(filter.key, opt.value)}
//                       onClick={() => {
//                         const isAllOption =
//                           opt.value === "" || opt.value === null;

//                         if (isAllOption) {
//                           // ✅ "All" clicked — wipe all selections for this filter
//                           setSelectedOptions({
//                             ...selectedOptions,
//                             [filter.key]: [],
//                           });
//                           updateQuery(filter.key, [opt.value], false);
//                           setOpenDropdownKey(null);
//                           return;
//                         }

//                         // ✅ Real value clicked — remove "All" from selection if it was there
//                         const currentSelected = (
//                           selectedOptions[filter.key] || []
//                         ).filter((v) => v !== "" && v !== null); // strip any lingering "All" value

//                         let newSelection;
//                         if (isMultiSelect) {
//                           const alreadySelected = currentSelected.includes(
//                             opt.value,
//                           );
//                           newSelection = alreadySelected
//                             ? currentSelected.filter((val) => val !== opt.value) // deselect
//                             : [...currentSelected, opt.value]; // select
//                         } else {
//                           newSelection = [opt.value];
//                           setOpenDropdownKey(null);
//                         }

//                         setSelectedOptions({
//                           ...selectedOptions,
//                           [filter.key]: newSelection,
//                         });
//                         updateQuery(
//                           filter.key,
//                           newSelection,
//                           filter.allowMultiple,
//                         );
//                       }}
//                       className={`px-4 py-2 text-sm cursor-pointer flex items-center gap-2 transition-colors ${
//                         isSelected
//                           ? "font-semibold text-brand-yellow bg-brand-yhover" // 1. Actual Selected Item
//                           : isHighlighted
//                             ? "bg-gray-100 text-ghText" // 2. Keyboard Highlighted (Not selected)
//                             : "text-ghText hover:bg-gray-50" // 3. Default state
//                       }`}
//                       // className={`px-4 py-2 text-sm cursor-pointer hover:bg-brand-yhover flex items-center gap-2 transition-colors ${
//                       //   isHighlighted
//                       //     ? "highlighted bg-brand-yhover text-brand-yellow font-semibold"
//                       //     : isSelected
//                       //       ? "font-semibold text-brand-yellow bg-brand-yhover"
//                       //       : "text-ghText hover:bg-gray-50"
//                       // }`}
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
//   // return (
//   //   <div className="flex gap-2 items-center" ref={wrapperRef}>
//   //     {config.filters.map((filter) => {
//   //       // ✅ NEW: Read value from URL first, fallback to parsed filters, then default
//   //       const currentValue =
//   //         searchParams.get(filter.key) ||
//   //         parsed.filters[filter.key] ||
//   //         filter.defaultValue ||
//   //         "";
//   //       const activeOption =
//   //         (filter.options &&
//   //           filter.options.find((opt) => opt.value === currentValue)) ||
//   //         (filter.options && filter.options[0]) || { label: "No options", value: "" };
//   //         console.log("activeOption :", activeOption , currentValue, filter);

//   //       const isOpen = openDropdownKey === filter.key;
//   //       const filteredOptions =
//   //         filter.options?.filter((opt) =>
//   //           opt.label?.toLowerCase().includes(searchQuery.toLowerCase())
//   //         ) || [];

//   //       if (filter.type === "date") {
//   //         const dateValue = currentValue ? new Date(currentValue) : new Date();
//   //         return (
//   //           <div key={filter.key} className="relative py-2">
//   //             <div className="flex item-center w-fit border border-gray-300 rounded-md bg-white overflow-hidden">
//   //               <button
//   //                 onClick={() => shiftDate(filter, currentValue, -1)}
//   //                 className="px-1 hover:bg-gray-100 text-gray-500 transition-colors border-r border-gray-200"
//   //               >
//   //                 <span className="text-[10px]"> ◁ </span>
//   //               </button>
//   //               <div className="py-1">
//   //                 <DatePicker
//   //                   selected={dateValue}
//   //                   onChange={(date) => {
//   //                     const formatted = date.toISOString().split("T")[0];
//   //                     updateQuery(filter.key, formatted);
//   //                   }}
//   //                   dateFormat="dd/MM/yyyy"
//   //                   className="w-20 border px-1 py-0 border-gray-300 rounded-md text-sm focus:outline-none border-none bg-transparent"
//   //                 />
//   //               </div>
//   //               <button
//   //                 onClick={() => shiftDate(filter, currentValue, 1)}
//   //                 className="px-1 hover:bg-gray-100 text-gray-500 transition-colors border-l border-gray-200"
//   //               >
//   //                 <span className="text-[10px]"> ▷ </span>
//   //               </button>
//   //             </div>
//   //           </div>
//   //         );
//   //       }

//   //       // Standard dropdown
//   //       return (
//   //         <div key={filter.key} className="relative">
//   //           <button
//   //             onClick={() => setOpenDropdownKey(isOpen ? null : filter.key)}
//   //             className={buttonClasses}
//   //             aria-haspopup="listbox"
//   //             aria-expanded={isOpen}
//   //           >
//   //             {activeOption.label} <span className="text-xs ml-1">▼</span>
//   //           </button>

//   //           {isOpen && (
//   //             <div
//   //               role="listbox"
//   //               tabIndex={0}
//   //               onKeyDown={handleKeyDown}
//   //               className="absolute left-0 mt-2 w-48 bg-white border border-ghBorder rounded-md shadow-lg z-50 py-1"
//   //               style={{ maxHeight: "400px", overflowY: "auto" }}
//   //             >
//   //               <div className="px-4 py-2">
//   //                 <input
//   //                   ref={searchInputRef}
//   //                   type="text"
//   //                   placeholder="Search..."
//   //                   className="w-full p-1 border border-gray-300 rounded-md text-sm focus:outline-none"
//   //                   onChange={(e) => {
//   //                     setSearchQuery(e.target.value);
//   //                     setHighlightedIndex(0);
//   //                   }}
//   //                 />
//   //               </div>
//   //               {filteredOptions.map((opt, index) => {
//   //                 const isSelected = currentValue === opt.value;
//   //                 const isHighlighted = index === highlightedIndex;

//   //                 return (
//   //                   <div
//   //                     key={opt.value}
//   //                     role="option"
//   //                     data-value={opt.value}
//   //                     ref={(el) => (optionsRefs.current[index] = el)}
//   //                     onClick={() => updateQuery(filter.key, opt.value)}
//   //                     className={`px-4 py-2 text-sm cursor-pointer flex items-center gap-2 transition-colors ${
//   //                       isHighlighted ? "bg-gray-100" : "hover:bg-gray-50"
//   //                     } ${
//   //                       isSelected
//   //                         ? "text-brand-yellow font-semibold"
//   //                         : "text-ghText"
//   //                     }`}
//   //                   >
//   //                     <span className="w-3 text-brand-yellow">
//   //                       {isSelected ? "✓" : ""}
//   //                     </span>
//   //                     {opt.label}
//   //                   </div>
//   //                 );
//   //               })}
//   //             </div>
//   //           )}
//   //         </div>
//   //       );
//   //     })}
//   //   </div>
//   // );
// }
