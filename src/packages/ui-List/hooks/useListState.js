import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { parseQuery } from "./useQueryParser";
import { useEffect } from "react";

export function useListState(config, rawData = []) {
  const [searchParams] = useSearchParams();

  /* --------------------------
     INITIAL STATE FROM URL
  -------------------------- */

  const urlQ = searchParams.get("q");
  const urlTab = searchParams.get("tab");
  const urlSort = searchParams.get("sort");
  const urlOrder = searchParams.get("order");

  let derivedQuery = "";

  if (urlTab) {
    derivedQuery += `is:${urlTab} `;
  }

  const initialQuery = urlQ || derivedQuery.trim();

  const initialSortField = urlSort || config.defaultSort?.field || "updatedAt";

  const initialSortOrder = urlOrder || config.defaultSort?.order || "desc";

  const initialStatusTab = urlTab || config.tabConfig?.[0]?.key;

  /* --------------------------
     STATES
  -------------------------- */

  const [query, setQuery] = useState(initialQuery);
  const [sortField, setSortField] = useState(initialSortField);
  const [sortOrder, setSortOrder] = useState(initialSortOrder);
  const [statusTab, setStatusTab] = useState(initialStatusTab);
  const [filters, setFilters] = useState({});
  const [view, setView] = useState(config.defaultView || "table");

  const [visibleCount, setVisibleCount] = useState(config.pageSize || 20);

  /* --------------------------
     QUERY PARSE
  -------------------------- */

  const parsed = parseQuery(query);
  const queryFilters = parsed.filters;
  const text = parsed.text;

  /* --------------------------
     SYNC TAB FROM QUERY
  -------------------------- */
  queryMappings: {
    is: (value) => {
      const mapping = tabConfig.find((t) => t.key === value);
      return {
        field: mapping.field,
        value: mapping.filterValue,
      };
    };
  }

  useEffect(() => {
    if (queryFilters.is && queryFilters.is !== statusTab) {
      setStatusTab(queryFilters.is);
    }
  }, [query]);

  /* --------------------------
     SYNC QUERY FROM TAB
  -------------------------- */

  useEffect(() => {
    if (!statusTab) return;

    const parsed = parseQuery(query);
    const otherFilters = Object.entries(parsed.filters)
      .filter(([k]) => k !== "is")
      .map(([k, v]) => `${k}:${v}`);

    const newQuery = [`is:${statusTab}`, ...otherFilters, parsed.text]
      .filter(Boolean)
      .join(" ");

    if (newQuery !== query) {
      setQuery(newQuery.trim() + " ");
    }
  }, [statusTab]);

  /* --------------------------
     PROCESS DATA
  -------------------------- */

  const processed = useMemo(() => {
    let data = [...rawData];

    // Tabs mapping
    if (config.enableTabs && statusTab) {
      const selectedTab = config.tabConfig?.find((t) => t.key === statusTab);

      if (selectedTab) {
        data = data.filter((d) => d.status === selectedTab.filterValue);
      }
    }

    // Merge filters
    const combinedFilters = {
      ...filters,
      ...queryFilters,
    };

    Object.entries(combinedFilters).forEach(([key, value]) => {
      if (!value) return;

      // Handle "is" token
      if (key === "is" && config.tabConfig) {
        const mapping = config.tabConfig.find((t) => t.key === value);

        if (mapping) {
          data = data.filter(
            (item) => item[mapping.field] === mapping.filterValue,
          );
        }

        return; // stop here
      }

      // Default behavior
      data = data.filter((item) => item[key] === value);
    });

    console.log(
      "Data after tab filtering:",
      data,
      "combinedFilters is:",
      combinedFilters,
    );

    // Text search
    if (text) {
      data = data.filter((item) =>
        item.title?.toLowerCase().includes(text.toLowerCase()),
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
        return sortOrder === "asc" ? aDate - bDate : bDate - aDate;
      }

      return sortOrder === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

    return data;
  }, [rawData, query, filters, sortField, sortOrder, statusTab]);

  const visibleData = processed.slice(0, visibleCount);

  return {
    config,
    query,
    setQuery,
    sortField,
    setSortField,
    sortOrder,
    setSortOrder,
    statusTab,
    setStatusTab,
    filters,
    setFilters,
    view,
    setView,
    data: visibleData,
    total: processed.length,
    hasMore: visibleCount < processed.length,
    loadMore: () => setVisibleCount((v) => v + (config.pageSize || 20)),
  };
}
// import { useState, useMemo } from "react";
// import { parseQuery } from "./useQueryParser";
// import { useSearchParams } from "react-router-dom"

// export function useListState(config, rawData = []) {
//   const [query, setQuery] = useState("");
//   const [statusTab, setStatusTab] = useState("Active");
//   const [filters, setFilters] = useState({});
//   const [sortField, setSortField] = useState(
//     () => config.defaultSort?.field || "createdAt",
//   );

//   const [sortOrder, setSortOrder] = useState(
//     () => config.defaultSort?.order || "desc",
//   );
//   const [view, setView] = useState(config.defaultView || "table");
//   const [visibleCount, setVisibleCount] = useState(20);

//   // const { filters, text } = parseQuery(query);
//   const parsed = parseQuery(query);
//   const queryFilters = parsed.filters;
//   const text = parsed.text;
//   console.log("sortField in useListState:", sortField, sortOrder);

//   const processed = useMemo(() => {
//     let data = [...rawData];

//     // Tab
//     if (config.enableTabs && config.tabConfig) {
//       const selectedTab = config.tabConfig.find((t) => t.key === statusTab);

//       if (selectedTab) {
//         data = data.filter((d) => d.status === selectedTab.filterValue);
//       }
//     }
//     console.log(
//       "processed data after tab filtering:",
//       data,
//       "rawData:",
//       rawData,
//       "statusTab:",
//       statusTab,
//     );
//     const combinedFilters = {
//       ...filters,
//       ...queryFilters,
//     };

//     // Apply dynamic filters
//     Object.entries(combinedFilters).forEach(([key, value]) => {
//       if (value) {
//         data = data.filter((item) => item[key] === value);
//       }
//     });

//     // Text search
//     if (text) {
//       data = data.filter((item) =>
//         item.title?.toLowerCase().includes(text.toLowerCase()),
//       );
//     }
//     // // Query filters
//     // if (filters.author) data = data.filter((d) => d.author === filters.author);

//     // if (filters.status) data = data.filter((d) => d.status === filters.status);

//     // if (filters.label)
//     //   data = data.filter((d) => d.labels?.includes(filters.label));

//     // // Text search
//     // if (text)
//     //   data = data.filter((d) =>
//     //     d.title.toLowerCase().includes(text.toLowerCase()),
//     //   );

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
//   }, [rawData, query, statusTab, sortField, sortOrder]);

//   const visibleData = processed.slice(0, visibleCount);
//   // console.log("visibleData:", visibleData,
//   //   "processed:", processed,
//   //   "visibleCount:", visibleCount,
//   //   "rawData:", rawData
//   // );

//   return {
//     config,
//     query,
//     setQuery,
//     statusTab,
//     setStatusTab,
//     sortField,
//     setSortField,
//     sortOrder,
//     setSortOrder,
//     view,
//     setView,
//     data: visibleData,
//     hasMore: visibleCount < processed.length,
//     loadMore: () => setVisibleCount((v) => v + 20),
//   };
// }
