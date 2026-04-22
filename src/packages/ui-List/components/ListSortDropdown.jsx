import { useState, useRef, useEffect } from "react";
import { useList } from "../context/ListContext";

export function ListSortDropdown() {
  const { config, sortField, setSortField, sortOrder, setSortOrder } = useList();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!config.enableSort) return;

    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [config.enableSort]);

  if (!config.enableSort) return null;

  // 1. Find the currently active field config
  const activeFieldConfig = config.sortFields.find(f => f.key === sortField.key) || config.sortFields[0];
  
  // 2. Use field-specific orders if they exist, otherwise fallback to global
  const activeOrders = activeFieldConfig.orders || config.sortOrders;

  const fieldLabel = activeFieldConfig?.label || "Sort";
  const orderLabel = activeOrders.find(o => o.key === sortOrder.key)?.label || activeOrders[0]?.label;

  const theme = config.theme || {};
  const buttonClasses = theme.sortButton || "px-2 py-1.5 text-xs font-medium border border-ghBorder rounded-md bg-white text-ghText hover:border-gray-300 transition-colors flex items-center gap-1";
  
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(prev => !prev)} className={buttonClasses}>
        {fieldLabel} · {orderLabel} <span className="text-xs ml-1">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-ghBorder rounded-md shadow-lg z-50 py-1">
          <div className="px-4 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
            Sort by
          </div>
          {config.sortFields.map(option => (
            <div
              key={option.key}
              onClick={() => { 
                setSortField(option);
                // Auto-select the first valid order when changing fields so it doesn't break
                const targetOrders = option.orders || config.sortOrders;
                if (!targetOrders.find(o => o.key === sortOrder)) {
                  setSortOrder(targetOrders[0].key);
                }
                // Removed setOpen(false) here
              }}
              className={`px-4 py-2 text-xs cursor-pointer flex items-center gap-2 transition-colors ${
                option.key === sortField.key ? "font-semibold text-brand-yellow bg-brand-yhover" : "text-ghText hover:bg-gray-50"
              }`}
            >
              <span className="w-3 text-brand-yellow">{option.key === sortField.key ? "✓" : ""}</span>
              {option.label}
            </div>
          ))}

          <div className="px-4 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-y border-gray-100 mt-1">
            Order
          </div>
          
          {/* 🔥 NEW: Map over the activeOrders, not config.sortOrders */}
          {activeOrders.map(option => (
            <div
              key={option.key}
              onClick={() => { 
                setSortOrder(option.key); 
                // Removed setOpen(false) here
              }}
              className={`px-4 py-2 text-xs cursor-pointer flex items-center gap-2 transition-colors ${
                option.key === sortOrder ? "font-semibold text-brand-yellow bg-brand-yhover" : "text-ghText hover:bg-gray-50"
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