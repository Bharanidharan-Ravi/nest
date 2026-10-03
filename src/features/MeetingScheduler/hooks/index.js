// Hooks for the meeting scheduler.
import { useCallback, useEffect, useMemo, useState } from "react";
import { useApiQuery } from "../../../core/query/useApiQuery";
import { useList } from "../../../packages/ui-List/context/ListContext";
import { parseQuery } from "../../../packages/ui-List/hooks/useQueryParser";
import { parseRangeValue, toRangeValue } from "../Helpers/calendarRange";
import { setQueryFilter } from "../Helpers/common";

// The meetings themselves are loaded by the scheduler list's own API call
// (see the Host filter and the date range in MeetingDashboard).

/** Meetings that still have a day left, for the sidebar's "Upcoming Meetings". */
export const useUpcomingMeeting = () => {
  return useApiQuery({
    url: "/sync/v2",
    method: "POST",
    queryKey: ["UpcomingMeeting"],
    payload: {
      ConfigKeys: ["UpcomingMeeting"],
    },
    source: "UpcomingMeeting",
    options: {
      staleTime: 10 * 60 * 1000,
    },
  });
};

// The dates the scheduler loads meetings for. They live in the list query as
// "weekRange:yyyy-MM-dd~yyyy-MM-dd", which the list turns into FromDate / ToDate.
export const DATE_RANGE_KEY = "weekRange";

export function useDateRange() {
  const { query, setQuery } = useList();
  const value = parseQuery(query).filters?.[DATE_RANGE_KEY] || "";
  const range = useMemo(() => parseRangeValue(value), [value]);

  const setRange = useCallback(
    (next) => setQuery((current) => setQueryFilter(current, DATE_RANGE_KEY, toRangeValue(next))),
    [setQuery]
  );

  return { value, range, setRange };
}

const matches = (query) =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(query).matches
    : false;

/** True while the CSS media query matches, e.g. useMediaQuery("(max-width: 639px)"). */
export function useMediaQuery(query) {
  const [isMatch, setIsMatch] = useState(() => matches(query));

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;
    const list = window.matchMedia(query);
    const onChange = () => setIsMatch(list.matches);
    onChange();
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [query]);

  return isMatch;
}

/** Keeps the page behind a modal from scrolling while `active` is true. */
export function useBodyScrollLock(active = true) {
  useEffect(() => {
    if (!active) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}
