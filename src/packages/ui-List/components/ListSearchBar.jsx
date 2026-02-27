import { useState, useEffect } from "react";
import { useList } from "../context/ListContext";
import { getDisplayQuery, getInternalQuery } from "../hooks/useQueryTranslator";

export function ListSearchBar() {
  const { query, setQuery, config } = useList();
  const [displayValue, setDisplayValue] = useState("");
  
  // 🔥 NEW: Track if the user's cursor is currently inside the input
  const [isFocused, setIsFocused] = useState(false); 

  useEffect(() => {
    if (!config.filters) return;
    
    // Calculate what the display text *should* look like right now
    const expectedDisplay = getDisplayQuery(query, config.filters);
    
    // 🔥 THE FIX: If the user is NOT typing, always force sync. 
    // This allows the Search Bar to instantly flip from GUIDs to Labels 
    // the moment `useMasterData()` finishes fetching on page reload.
    if (!isFocused && displayValue !== expectedDisplay) {
      setDisplayValue(expectedDisplay);
    } 
    // If they ARE typing, only intervene if things get out of sync under the hood
    else if (isFocused && getInternalQuery(displayValue, config.filters) !== query) {
      setDisplayValue(expectedDisplay);
    }
  }, [query, config.filters, displayValue, isFocused]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setDisplayValue(newValue); 
    
    const internalQuery = getInternalQuery(newValue, config.filters || []);
    setQuery(internalQuery);
  };

  const handleFocus = () => {
    setIsFocused(true); // Note that they clicked in
    if (displayValue && !displayValue.endsWith(" ")) {
      setDisplayValue(displayValue + " ");
    }
  };

  const handleBlur = () => {
    setIsFocused(false); // Note that they clicked out
  };

  const handleClear = () => {
    setDisplayValue("");
    setQuery("");
  };

  return (
    <div className="p-3 border-b border-gray-200 relative bg-white rounded-t-lg">
      <input
        value={displayValue}
        onFocus={handleFocus}
        onBlur={handleBlur} // 🔥 Add the blur handler here
        onChange={handleChange}
        placeholder="Find a project..."
        className="w-full border border-gray-300 bg-gray-50 focus:bg-white rounded-md px-4 py-2 text-sm text-brand-black focus:outline-none focus:ring-0 focus:border-gray-400 transition-all"
      />
      {displayValue && (
        <button
          onClick={handleClear}
          className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-black transition-colors"
        >
          ✕
        </button>
      )}
    </div>
  );
}