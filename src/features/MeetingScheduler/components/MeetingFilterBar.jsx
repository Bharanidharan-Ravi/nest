// Search and filters above the scheduler. They narrow down the meetings already
// loaded (the dates and Host, in the sidebar, decide what is loaded). They live
// in the list query, so List, Day, Week and Month all show the same meetings.
import React, { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { useList } from "../../../packages/ui-List/context/ListContext";
import { parseQuery } from "../../../packages/ui-List/hooks/useQueryParser";
import { ListFilters } from "../../../packages/ui-List/components/ListFilters";
import { MEETING_FILTER_KEYS } from "../config/meetingFilters";
import { clearQueryFilters, setQueryText } from "../Helpers/common";

/** How many filters (and the search) are narrowing the meetings, and how to clear them. */
export function useMeetingFilters() {
  const { query, setQuery } = useList();
  const { filters, text } = parseQuery(query);
  const activeCount =
    MEETING_FILTER_KEYS.filter((key) => filters[key] != null && String(filters[key]) !== "").length + (text ? 1 : 0);
  const clearFilters = () => setQuery((current) => clearQueryFilters(current, MEETING_FILTER_KEYS));
  return { text, activeCount, clearFilters, setQuery };
}

export default function MeetingFilterBar({ resultLabel }) {
  const { text, activeCount, clearFilters, setQuery } = useMeetingFilters();
  const [search, setSearch] = useState(text);

  // Empty the box when the search is cleared from elsewhere (Clear filters).
  useEffect(() => {
    if (!text) setSearch("");
  }, [text]);

  const onSearch = (value) => {
    setSearch(value);
    setQuery((current) => setQueryText(current, value.trim()));
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 bg-white px-5 py-2">
      <label className="relative w-full sm:w-60">
        <span className="sr-only">Search meetings</span>
        <Search
          size={13}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
          aria-hidden="true"
        />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search title, project, ticket, host…"
          className="w-full rounded-md border border-gray-200 py-1.5 pl-8 pr-3 text-xs transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-amber-300"
        />
      </label>

      {/* Scrolls sideways on a phone instead of pushing the page wider. Host is in the sidebar calendar. */}
      <div className="max-w-full overflow-x-auto">
        <ListFilters only={MEETING_FILTER_KEYS} />
      </div>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={() => {
            setSearch("");
            clearFilters();
          }}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
        >
          <X size={12} aria-hidden="true" />
          Clear filters ({activeCount})
        </button>
      )}

      {resultLabel && <span className="ml-auto text-xs text-gray-400">{resultLabel}</span>}
    </div>
  );
}
