// ListSearchBar.jsx — full fixed version

import { useState, useRef } from "react";
import { useList } from "../context/ListContext";
import { getInternalQuery } from "../hooks/useQueryTranslator";
import { parseQuery } from "../hooks/useQueryParser";

export function ListSearchBar() {
  const { query, setQuery, config } = useList();
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef(null);

  const { filters, text } = parseQuery(query);

  // ── Tab chip (is:open / is:closed) ──────────────────────────────────────
  const tabChip = filters.is
    ? { key: "is", value: filters.is, display: filters.is }
    : null;

  // ── Filter chips ─────────────────────────────────────────────────────────
  const filterChips = Object.entries(filters)
    .filter(([key]) => key !== "is")
    .flatMap(([key, value]) => {
      const filterDef = config.filters?.find((f) => f.key === key);
      const displayKey = filterDef?.view || key;

      const values = Array.isArray(value)
        ? value
        : String(value)
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean);

      return values
        .filter((v) => v !== "")
        .map((v) => {
          const option = filterDef?.options?.find(
            (o) => String(o.value) === String(v),
          );
          const displayLabel = option ? option.label : v;
          return { key, value: v, display: `${displayKey}: ${displayLabel}` };
        });
    });

  // Replace removeChip's setQuery call with:
  const removeChip = (chipKey, chipValue) => {
    const { filters: cur, text: curText } = parseQuery(query);

    const rebuilt = Object.entries(cur)
      .map(([k, v]) => {
        if (k !== chipKey) return `${k}:${Array.isArray(v) ? v.join(",") : v}`;
        const vals = Array.isArray(v)
          ? v
          : String(v)
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean);
        const remaining = vals.filter((x) => x !== chipValue);
        return remaining.length > 0 ? `${k}:${remaining.join(",")}` : null;
      })
      .filter(Boolean);

    setQuery([...rebuilt, curText].filter(Boolean).join(" ").trim());
    setInputValue(curText); // ✅ Keep input in sync with remaining free text
  };
  // ── Free text enter ───────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);

    // Rebuild query with new free text — keep all existing filters
    const { filters: cur } = parseQuery(query);
    const existingFilters = Object.entries(cur).map(
      ([k, v]) => `${k}:${Array.isArray(v) ? v.join(",") : v}`,
    );
    // ✅ Update text part live as user types
    setQuery([...existingFilters, val].filter(Boolean).join(" ").trim());
  };

  const handleInputKeyDown = (e) => {
    // Only keep Backspace to remove last chip — no more Enter needed
    if (e.key === "Backspace" && !inputValue && filterChips.length > 0) {
      const last = filterChips[filterChips.length - 1];
      removeChip(last.key, last.value);
    }
  };

  const handleClearAll = () => {
    // Clear all filters but KEEP is:open
    const tab = filters.is;
    setQuery(tab ? `is:${tab}` : "");
    setInputValue("");
  };

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 px-3 py-2 border-b border-gray-200 bg-white rounded-t-lg min-h-[44px] cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Tab chip — is:open / is:closed — NOT removable */}
      {tabChip && (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200 capitalize">
          {tabChip.display}
        </span>
      )}

      {/* Filter chips — removable */}
      {filterChips.map((chip, i) => (
        <span
          key={`${chip.key}-${chip.value}-${i}`}
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-gray-700 border border-gray-300 shadow-sm"
        >
          {chip.display}
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeChip(chip.key, chip.value);
            }}
            className="text-gray-400 hover:text-gray-700 transition-colors leading-none ml-0.5"
          >
            ✕
          </button>
        </span>
      ))}

      {/* Free text input */}
      <input
        ref={inputRef}
        value={inputValue}
        onChange={handleInputChange} // ✅ was missing live update
        onKeyDown={handleInputKeyDown}
        placeholder={
          filterChips.length === 0 && !tabChip ? "Find a ticket..." : ""
        }
        className="flex-1 min-w-[120px] bg-transparent text-sm text-gray-800 focus:outline-none py-0.5"
      />

      {/* Clear filters (keeps tab) */}
      {filterChips.length > 0 && (
        <button
          onClick={handleClearAll}
          className="ml-auto text-gray-400 hover:text-gray-600 transition-colors text-xs px-1"
          title="Clear all filters"
        >
          Clear ✕
        </button>
      )}
    </div>
  );
}
