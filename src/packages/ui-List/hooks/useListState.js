import { useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { parseQuery } from "./useQueryParser";

export function useListState(config, rawData = []) {
  const [searchParams] = useSearchParams();

  /* --------------------------
     INITIAL STATE (Run once)
  -------------------------- */
  const initialQuery = useMemo(() => {
    const urlQ = searchParams.get("q");
    if (urlQ) return urlQ;
    
    const urlTab = searchParams.get("tab") || config.tabConfig?.[0]?.key;
    return urlTab ? `is:${urlTab} ` : "";
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  /* --------------------------
     STATES
  -------------------------- */
  const [query, setQuery] = useState(initialQuery);
  const [sortField, setSortField] = useState(searchParams.get("sort") || config.defaultSort?.field || "updatedAt");
  const [sortOrder, setSortOrder] = useState(searchParams.get("order") || config.defaultSort?.order || "desc");
  const [filters, setFilters] = useState({});
  const [view, setView] = useState(config.defaultView || "table");
  const [visibleCount, setVisibleCount] = useState(config.pageSize || 20);

  /* --------------------------
     QUERY PARSE & DERIVED STATE
  -------------------------- */
  const parsed = parseQuery(query);
  const queryFilters = parsed.filters;
  const text = parsed.text;

  // 🔥 FIX 1: Derive statusTab directly from the query. No more `useState` or `useEffect` loops!
  const statusTab = queryFilters.is || config.tabConfig?.[0]?.key;

  const setStatusTab = useCallback((tabKey) => {
    const currentParsed = parseQuery(query);
    const otherFilters = Object.entries(currentParsed.filters)
      .filter(([k]) => k !== "is")
      .map(([k, v]) => `${k}:${v}`);

    const newQuery = [`is:${tabKey}`, ...otherFilters, currentParsed.text]
      .filter(Boolean)
      .join(" ");

    setQuery(newQuery.trim() + " ");
  }, [query]);

  /* --------------------------
     PROCESS DATA
  -------------------------- */
  const processed = useMemo(() => {
    let data = [...rawData];
    const combinedFilters = { ...filters, ...queryFilters };

    Object.entries(combinedFilters).forEach(([key, value]) => {
      if (!value) return;

      // Handle "is" token (Tabs)
      if (key === "is" && config.tabConfig) {
        const mapping = config.tabConfig.find((t) => t.key === value);
        if (mapping) {
          data = data.filter((item) => item[mapping.field] === mapping.filterValue);
        }
        return; 
      }

      data = data.filter((item) => item[key] === value);
    });

    // Text search
    if (text) {
      data = data.filter((item) =>
        item.title?.toLowerCase().includes(text.toLowerCase())
      );
    }

    // Sort
    data.sort((a, b) => {
      const aVal = a?.[sortField];
      const bVal = b?.[sortField];
      if (!aVal || !bVal) return 0;

      const aDate = new Date(aVal);
      const bDate = new Date(bVal);

      if (!isNaN(aDate) && !isNaN(bDate)) {
        return sortOrder === "asc" ? aDate.getTime() - bDate.getTime() : bDate.getTime() - aDate.getTime();
      }

      return sortOrder === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

    return data;
  }, [rawData, queryFilters, filters, sortField, sortOrder, text, config.tabConfig]);

  const visibleData = processed.slice(0, visibleCount);

  const loadMore = useCallback(() => {
    setVisibleCount((v) => v + (config.pageSize || 20));
  }, [config.pageSize]);

  return {
    config, query, setQuery, sortField, setSortField, sortOrder, setSortOrder,
    statusTab, setStatusTab, filters, setFilters, view, setView,
    data: visibleData, total: processed.length, hasMore: visibleCount < processed.length, loadMore, 
  };
}





// import { useState, useMemo, useEffect, useCallback } from "react";
// import { useSearchParams } from "react-router-dom";
// import { parseQuery } from "./useQueryParser";

// export function useListState(config, rawData = []) {
//   const [searchParams] = useSearchParams();

//   /* --------------------------
//      INITIAL STATE FROM URL
//   -------------------------- */
//   const urlQ = searchParams.get("q");
//   const urlTab = searchParams.get("tab");
//   const urlSort = searchParams.get("sort");
//   const urlOrder = searchParams.get("order");

//   let derivedQuery = "";

//   if (urlTab) {
//     derivedQuery += `is:${urlTab} `;
//   }

//   const initialQuery = urlQ || derivedQuery.trim();
//   const initialSortField = urlSort || config.defaultSort?.field || "updatedAt";
//   const initialSortOrder = urlOrder || config.defaultSort?.order || "desc";
//   const initialStatusTab = urlTab || config.tabConfig?.[0]?.key;

//   /* --------------------------
//      STATES
//   -------------------------- */
//   const [query, setQuery] = useState(initialQuery);
//   const [sortField, setSortField] = useState(initialSortField);
//   const [sortOrder, setSortOrder] = useState(initialSortOrder);
//   const [statusTab, setStatusTab] = useState(initialStatusTab);
//   const [filters, setFilters] = useState({});
//   const [view, setView] = useState(config.defaultView || "table");

//   // Initial count matches config pageSize 
//   const [visibleCount, setVisibleCount] = useState(config.pageSize || 20);

//   /* --------------------------
//      QUERY PARSE
//   -------------------------- */
//   const parsed = parseQuery(query);
//   const queryFilters = parsed.filters;
//   const text = parsed.text;

//   /* --------------------------
//      SYNC TAB FROM QUERY
//   -------------------------- */
//   useEffect(() => {
//     if (queryFilters.is && queryFilters.is !== statusTab) {
//       setStatusTab(queryFilters.is);
//     }
//   }, [query, queryFilters.is, statusTab]);

//   /* --------------------------
//      SYNC QUERY FROM TAB
//   -------------------------- */
//   useEffect(() => {
//     if (!statusTab) return;

//     const parsed = parseQuery(query);
//     const otherFilters = Object.entries(parsed.filters)
//       .filter(([k]) => k !== "is")
//       .map(([k, v]) => `${k}:${v}`);

//     const newQuery = [`is:${statusTab}`, ...otherFilters, parsed.text]
//       .filter(Boolean)
//       .join(" ");

//     if (newQuery !== query) {
//       setQuery(newQuery.trim() + " ");
//     }
//   }, [statusTab, query]);

//   /* --------------------------
//      PROCESS DATA
//   -------------------------- */
//   const processed = useMemo(() => {
//     let data = [...rawData];

//     // Tabs mapping
//     if (config.enableTabs && statusTab) {
//       const selectedTab = config.tabConfig?.find((t) => t.key === statusTab);

//       if (selectedTab) {
//         data = data.filter((d) => d.status === selectedTab.filterValue);
//       }
//     }

//     // Merge filters
//     const combinedFilters = {
//       ...filters,
//       ...queryFilters,
//     };

//     Object.entries(combinedFilters).forEach(([key, value]) => {
//       if (!value) return;

//       // Handle "is" token
//       if (key === "is" && config.tabConfig) {
//         const mapping = config.tabConfig.find((t) => t.key === value);

//         if (mapping) {
//           data = data.filter(
//             (item) => item[mapping.field] === mapping.filterValue,
//           );
//         }
//         return; 
//       }

//       // Default behavior
//       data = data.filter((item) => item[key] === value);
//     });

//     // Text search
//     if (text) {
//       data = data.filter((item) =>
//         item.title?.toLowerCase().includes(text.toLowerCase()),
//       );
//     }

//     // Sort
//     data.sort((a, b) => {
//       const aVal = a?.[sortField];
//       const bVal = b?.[sortField];

//       if (!aVal || !bVal) return 0;

//       const aDate = new Date(aVal);
//       const bDate = new Date(bVal);

//       if (!isNaN(aDate) && !isNaN(bDate)) {
//         return sortOrder === "asc" ? aDate - bDate : bDate - aDate;
//       }

//       return sortOrder === "asc"
//         ? String(aVal).localeCompare(String(bVal))
//         : String(bVal).localeCompare(String(aVal));
//     });

//     return data;
//   }, [rawData, query, filters, sortField, sortOrder, statusTab, config, queryFilters, text]);

//   const visibleData = processed.slice(0, visibleCount);

//   // Memoize the loadMore function to prevent endless event listener rebinding
//   const loadMore = useCallback(() => {
//     setVisibleCount((v) => v + (config.pageSize || 20));
//   }, [config.pageSize]);

//   return {
//     config,
//     query,
//     setQuery,
//     sortField,
//     setSortField,
//     sortOrder,
//     setSortOrder,
//     statusTab,
//     setStatusTab,
//     filters,
//     setFilters,
//     view,
//     setView,
//     data: visibleData,
//     total: processed.length,
//     hasMore: visibleCount < processed.length,
//     loadMore, 
//   };
// }