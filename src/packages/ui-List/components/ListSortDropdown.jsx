import { useState, useRef, useEffect } from "react"
import { useList } from "../context/ListContext"

export function ListSortDropdown() {
  const { config, sortField, setSortField, sortOrder, setSortOrder } = useList();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fieldLabel = config.sortFields.find(f => f.key === sortField)?.label || "Sort";
  const orderLabel = config.sortOrders.find(o => o.key === sortOrder)?.label || "Newest";

  const theme = config.theme || {};
  const buttonClasses = theme.sortButton || "px-3 py-1.5 text-sm font-medium border border-ghBorder rounded-md bg-white text-ghText hover:border-gray-300 transition-colors flex items-center gap-1";
  
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(prev => !prev)} className={buttonClasses}>
        {fieldLabel} · {orderLabel} <span className="text-xs ml-1">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-ghBorder rounded-md shadow-lg z-50 py-1">
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-ghBorder">
            Sort by
          </div>
          {config.sortFields.map(option => (
            <div
              key={option.key}
              onClick={() => { setSortField(option.key); setOpen(false); }}
              className={`px-4 py-2 text-sm cursor-pointer flex items-center gap-2 transition-colors ${
                option.key === sortField ? "font-semibold text-brand-yellow bg-[#fff8e1]" : "text-ghText hover:bg-gray-50"
              }`}
            >
              <span className="w-3 text-brand-yellow">{option.key === sortField ? "✓" : ""}</span>
              {option.label}
            </div>
          ))}

          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-y border-ghBorder mt-1">
            Order
          </div>
          {config.sortOrders.map(option => (
            <div
              key={option.key}
              onClick={() => { setSortOrder(option.key); setOpen(false); }}
              className={`px-4 py-2 text-sm cursor-pointer flex items-center gap-2 transition-colors ${
                option.key === sortOrder ? "font-semibold text-brand-yellow bg-[#fff8e1]" : "text-ghText hover:bg-gray-50"
              }`}
            >
              <span className="w-3 text-brand-yellow">{option.key === sortOrder ? "✓" : ""}</span>
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}