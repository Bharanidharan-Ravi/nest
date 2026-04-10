import { useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { parseQuery } from "./useQueryParser";
import { useApiQuery } from "../../../core/query/useApiQuery";
import { buildSyncPayload } from "../../../core/sync/buildSyncPayload";

export function useListState(config, rawData = []) {
  const [searchParams] = useSearchParams();
  const isUrlSyncEnabled = config.syncUrl !== false;
  // 🔥 1. Get the prefix so we can read namespaced URLs correctly (e.g., "tickets_")
  const currentModule = searchParams.get("module") || "default";
  const prefix = isUrlSyncEnabled ? `${currentModule}_` : "";

  /* --- INITIAL STATE (Run once) --- */
  const initialQuery = useMemo(() => {
    // 🔥 HELPER: Builds the string from defaults
    // const buildDefaultString = (tabKey) => {
    //   let q = tabKey ? `is:${tabKey}` : "";
    //   if (config.filters) {
    //     config.filters.forEach((f) => {
    //       if (f.defaultValue) {
    //         const safeValue = f.defaultValue.includes(" ")
    //           ? `"${f.defaultValue}"`
    //           : f.defaultValue;
    //         q += ` ${f.key}:${safeValue}`;
    //       }
    //     });
    //   }
    //   return q.trim();
    // };
    const buildDefaultString = (tabKey) => {
      let q = tabKey ? `is:${tabKey}` : "";
      if (config.filters) {
        config.filters.forEach((f) => {
          // ✅ Only add default if it's a real value, not the "All" placeholder
          if (f.defaultValue && f.defaultValue !== "") {
            const safeValue = f.defaultValue.includes(" ")
              ? `"${f.defaultValue}"`
              : f.defaultValue;
            q += ` ${f.key}:${safeValue}`;
          }
        });
      }
      return q.trim();
    };
    // If child list, ignore URL and load default config
    if (!isUrlSyncEnabled) {
      return buildDefaultString(config.tabConfig?.[0]?.key);
    }

    // 🔥 If URL already has a query string, the URL wins!
    // (Note: Use your prefix here like searchParams.get("tickets_q") if you applied the namespaces)
    const urlQ = searchParams.get(`${prefix}q`);
    if (urlQ) return urlQ;

    // 🔥 3. Read from `${prefix}tab` instead of just "tab"
    const urlTab =
      searchParams.get(`${prefix}tab`) || config.tabConfig?.[0]?.key;
    return buildDefaultString(urlTab);
  }, [
    isUrlSyncEnabled,
    config.tabConfig,
    config.filters,
    searchParams,
    prefix,
  ]);

  //   const initialQuery = useMemo(() => {

  //     // If child list, ignore URL and load default config
  //     if (!isUrlSyncEnabled) {
  //       const defaultTab = config.tabConfig?.[0]?.key;
  //       return defaultTab ? `is:${defaultTab}` : "";
  //     }

  //     const urlQ = searchParams.get("q");
  //     if (urlQ) return urlQ;

  //     const urlTab = searchParams.get("tab") || config.tabConfig?.[0]?.key;
  //     return urlTab ? `is:${urlTab}` : "";
  //   }, [isUrlSyncEnabled, config.tabConfig, searchParams]);

  /* --- STATES --- */
  const [query, setQuery] = useState(initialQuery);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [sortField, setSortField] = useState(
    (isUrlSyncEnabled ? searchParams.get(`${prefix}sort`) : null) ||
      config.defaultSort?.field ||
      "updatedAt",
  );

  const [sortOrder, setSortOrder] = useState(
    (isUrlSyncEnabled ? searchParams.get(`${prefix}order`) : null) ||
      config.defaultSort?.order ||
      "desc",
  );
  const [filters, setFilters] = useState({});

  //  const [filters, setFilters] = useState(() => {
  //     // 1. Start with any root-level defaultFilters (if you still use them)
  //     const initial = { ...(config.defaultFilters || {}) };
  //     // 2. Loop through config.filters and grab any 'defaultValue' you defined
  //     if (config.filters) {
  //         config.filters.forEach((f) => {
  //             if (f.defaultValue !== undefined && initial[f.key] === undefined) {
  //                 initial[f.key] = f.defaultValue;
  //             }
  //         });
  //     }
  //     console.log("initial :", initial);

  //     return initial; // This will now contain { assignedTo: currentUserName }
  // });
  const [view, setView] = useState(config.defaultView || "table");
  const [visibleCount, setVisibleCount] = useState(config.pageSize || 20);

  /* --- QUERY PARSE & DERIVED STATE --- */
  const parsed = parseQuery(query);
  const queryFilters = parsed.filters;
  const text = parsed.text;

  // Derive statusTab directly from the query. No more 'useState' or 'useEffect' loops!
  const statusTab = queryFilters.is || config.tabConfig?.[0]?.key;

  const setStatusTab = useCallback(
    (tabKey) => {
      const currentParsed = parseQuery(query);
      const otherFilters = Object.entries(currentParsed.filters)
        .filter(([k]) => k !== "is")
        .map(([k, v]) => `${k}:${v}`);

      const newQuery = [`is:${tabKey}`, ...otherFilters, currentParsed.text]
        .filter(Boolean)
        .join(" ");

      setQuery(newQuery.trim() + " ");
    },
    [query],
  );

  /* --- API FILTER --- */
  const combinedFiltersForApi = { ...filters, ...queryFilters };

  const apiFilterEntries = useMemo(() => {
    if (!config.filters) return [];
    return Object.entries(combinedFiltersForApi).filter(
      ([key]) =>
        config.filters.find((f) => f.key === key)?.filterType === "api",
    );
  }, [filters, queryFilters, config.filters]);
  //  console.log("combinedFiltersForApi :", combinedFiltersForApi, apiFilterEntries);
  const apiFilterConfig =
    apiFilterEntries.length > 0
      ? config.filters.find((f) => f.key === apiFilterEntries[0][0])
      : null;

  const apiPayload = useMemo(() => {
    if (apiFilterEntries.length === 0) return undefined;

    return Object.fromEntries(
      apiFilterEntries.map(([key, value]) => {
        const filterConf = config.filters.find((f) => f.key === key);
        return [filterConf?.apiKey || config?.filters?.idKey, value];
      }),
    );
  }, [apiFilterEntries, config.filters]);

  const { data: apiFilteredData, dataUpdatedAt } = useApiQuery({
    queryKey: [apiFilterConfig?.configKey, apiPayload],
    url: apiFilterConfig?.api,
    method: apiFilterConfig?.method || "POST",
    payload: apiFilterConfig
      ? buildSyncPayload({
          configKey: apiFilterConfig.configKey,
          customParams: apiPayload,
        })
      : undefined,
    source: apiFilterConfig?.configKey,
    options: {
      enabled: apiFilterEntries.length > 0 && !!apiFilterConfig?.api,
    },
  });

  console.log("apiFilteredData :", apiFilteredData);

  /* --- PROCESS DATA (Local Filtering & Sorting) --- */
  const processed = useMemo(() => {
    let data = [];

    // Use API data if available, otherwise fallback to rawData
    if (apiFilterEntries.length > 0 && apiFilteredData) {
      const raw = Array.isArray(apiFilteredData) ? apiFilteredData : [];
      const activeNormalizer = apiFilterConfig?.normalizer || config.normalizer;

      data = activeNormalizer ? raw.map(activeNormalizer) : raw;
    } else {
      data = [...rawData];
    }
    console.log("Filtered Data:", data, rawData);
    const combinedFilters = { ...filters, ...queryFilters };

    Object.entries(combinedFilters).forEach(([key, value]) => {
      if (!value) return;

      // Handle "is" token (Tabs)
      if (key === "is" && config.tabConfig) {
        const mapping = config.tabConfig.find((t) => t.key === value);
        if (mapping) {
          data = data.filter((item) => {
            const itemValue = item[mapping.field];

            // 1. Exclude values
            if (mapping.excludeValues) {
              return !mapping.excludeValues.includes(itemValue);
            }
            // 2. Include multiple values
            if (Array.isArray(mapping.filterValue)) {
              return mapping.filterValue.includes(itemValue);
            }
            // 3. Exact match
            return itemValue === mapping.filterValue;
          });
        }
        return;
      }

      const filterConfig = config.filters?.find((f) => f.key === key);

      if (filterConfig?.filterType === "api") return; // Skip, handled by server
      // 🔥 NEW: Execute the custom filter function if it exists
      if (
        filterConfig?.filterType === "custom" &&
        typeof filterConfig.customFilter === "function"
      ) {
        data = data.filter((item) => filterConfig.customFilter(item, value));
      } else if (filterConfig?.filterType === "array") {
        // value could be "id1" (single) or "id1,id2" (multi) or ["id1","id2"] (array)
        const selectedValues = Array.isArray(value)
          ? value
          : String(value)
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean);

        data = data.filter(
          (item) =>
            Array.isArray(item[key]) &&
            // ✅ every = AND logic (item must have ALL selected labels)
            // ❌ some  = OR logic  (item just needs ONE matching label)
            selectedValues.every((selectedVal) =>
              item[key].some(
                (entry) =>
                  String(entry[filterConfig.filterKey]) === String(selectedVal),
              ),
            ),
        );
        // const selectedValues = Array.isArray(value)
        //   ? value
        //   : String(value)
        //       .split(",")
        //       .map((v) => v.trim())
        //       .filter(Boolean);

        // data = data.filter(
        //   (item) =>
        //     Array.isArray(item[key]) &&
        //     // item must match ANY of the selected values (OR logic)
        //     selectedValues.some((selectedVal) =>
        //       item[key].some(
        //         (entry) =>
        //           String(entry[filterConfig.filterKey]) === String(selectedVal),
        //       ),
        //     ),
        // );
      } else {
        data = data.filter((item) => item[key] == value);
      }
    });

    // Text search
    if (text) {
      const lower = text.toLowerCase();
      const fields = config.searchFields || ["title"]; // fallback to title only
      data = data.filter((item) =>
        fields.some((field) => item[field]?.toLowerCase().includes(lower)),
      );
    }

    // Sort
    data.sort((a, b) => {
      const aVal = a?.[sortField];
      const bVal = b?.[sortField];
      if (!aVal || !bVal) return 0;

      const aDate = new Date(aVal);
      const bDate = new Date(bVal);

      // Date sorting
      if (!isNaN(aDate) && !isNaN(bDate)) {
        return sortOrder === "asc"
          ? aDate.getTime() - bDate.getTime()
          : bDate.getTime() - aDate.getTime();
      }

      // String sorting
      return sortOrder === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

    return data;
  }, [
    rawData,
    queryFilters,
    filters,
    sortField,
    sortOrder,
    text,
    config,
    apiFilterEntries,
    apiFilteredData,
  ]);

  const visibleData = processed.slice(0, visibleCount);
  console.log("visibleData :", visibleData);

  const loadMore = useCallback(() => {
    setVisibleCount((v) => v + (config.pageSize || 20));
  }, [config.pageSize]);

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
    loadMore,
    dataUpdatedAt,
    selectedOptions,
    setSelectedOptions,
  };
}

// import { useState, useMemo, useCallback } from "react";
// import { useSearchParams } from "react-router-dom";
// import { parseQuery } from "./useQueryParser";
// import { useMasterData } from "../../../core/master/useMasterData";

// export function useListState(config, rawData = []) {
//   const [searchParams] = useSearchParams();
//   const isUrlSyncEnabled = config.syncUrl !== false;
//   /* --------------------------
//      INITIAL STATE (Run once)
//   -------------------------- */
//   const initialQuery = useMemo(() => {
//     // 🔥 NEW: If child list, ignore URL and load default config
//     if (!isUrlSyncEnabled) {
//       const defaultTab = config.tabConfig?.[0]?.key;
//       return defaultTab ? `is:${defaultTab} ` : "";
//     }

//     const urlQ = searchParams.get("q");
//     if (urlQ) return urlQ;

//     const urlTab = searchParams.get("tab") || config.tabConfig?.[0]?.key;
//     return urlTab ? `is:${urlTab} ` : "";
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [isUrlSyncEnabled]);

//   /* --------------------------
//      STATES
//   -------------------------- */
//   const [query, setQuery] = useState(initialQuery);
//   const [sortField, setSortField] = useState(
//     (isUrlSyncEnabled ? searchParams.get("sort") : null) ||
//       config.defaultSort?.field ||
//       "updatedAt",
//   );

//   const [sortOrder, setSortOrder] = useState(
//     (isUrlSyncEnabled ? searchParams.get("order") : null) ||
//       config.defaultSort?.order ||
//       "desc",
//   );

//   const [filters, setFilters] = useState({});
//   const [view, setView] = useState(config.defaultView || "table");
//   const [visibleCount, setVisibleCount] = useState(config.pageSize || 20);

//   /* --------------------------
//      QUERY PARSE & DERIVED STATE
//   -------------------------- */
//   const parsed = parseQuery(query);
//   const queryFilters = parsed.filters;
//   const text = parsed.text;

//   // 🔥 FIX 1: Derive statusTab directly from the query. No more `useState` or `useEffect` loops!
//   const statusTab = queryFilters.is || config.tabConfig?.[0]?.key;

//   const setStatusTab = useCallback(
//     (tabKey) => {
//       const currentParsed = parseQuery(query);
//       const otherFilters = Object.entries(currentParsed.filters)
//         .filter(([k]) => k !== "is")
//         .map(([k, v]) => `${k}:${v}`);

//       const newQuery = [`is:${tabKey}`, ...otherFilters, currentParsed.text]
//         .filter(Boolean)
//         .join(" ");

//       setQuery(newQuery.trim() + " ");
//     },
//     [query],
//   );

//   /* --------------------------
//      PROCESS DATA
//   -------------------------- */
//   const processed = useMemo(() => {
//     let data = [...rawData];
//     const combinedFilters = { ...filters, ...queryFilters };

//     Object.entries(combinedFilters).forEach(([key, value]) => {
//       if (!value) return;

//       // Handle "is" token (Tabs)
//       // if (key === "is" && config.tabConfig) {
//       //   const mapping = config.tabConfig.find((t) => t.key === value);
//       //   if (mapping) {
//       //     data = data.filter((item) => item[mapping.field] === mapping.filterValue);
//       //   }
//       //   return;
//       // }

//       if (key === "is" && config.tabConfig) {
//         const mapping = config.tabConfig.find((t) => t.key === value);
//         if (mapping) {
//           data = data.filter((item) => {
//             const itemValue = item[mapping.field];

//             // 1. If we provided an array of values to EXCLUDE
//             if (mapping.excludeValues) {
//               return !mapping.excludeValues.includes(itemValue);
//             }

//             // 2. If we provided an array of multiple values to INCLUDE
//             if (Array.isArray(mapping.filterValue)) {
//               return mapping.filterValue.includes(itemValue);
//             }

//             // 3. Fallback to the original exact match
//             return itemValue === mapping.filterValue;
//           });
//         }
//         return;
//       }
//       const filterConfig = config.filters?.find((f) => f.key === key);
//       if (filterConfig?.filterType === "array") {
//         data = data.filter(
//           (item) =>
//             Array.isArray(item[key]) &&
//             item[key].some((entry) => {
//               return entry[filterConfig.filterKey] == value;
//             }),
//         );
//       }
//       //  else if(filterConfig?.filterType === "api") {
//       //    const  data =  useApiQuery({
//       //        queryKey,
//       //        url:filterConfig.api,
//       //        method: filterConfig.method || 'GET',
//       //        payload,
//       //        source: "TicketsList")}
//       //  }
//       else {
//         data = data.filter((item) => item[key] === value);
//       }
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
//         return sortOrder === "asc"
//           ? aDate.getTime() - bDate.getTime()
//           : bDate.getTime() - aDate.getTime();
//       }

//       return sortOrder === "asc"
//         ? String(aVal).localeCompare(String(bVal))
//         : String(bVal).localeCompare(String(aVal));
//     });

//     return data;
//   }, [
//     rawData,
//     queryFilters,
//     filters,
//     sortField,
//     sortOrder,
//     text,
//     config.tabConfig,
//   ]);

//   const visibleData = processed.slice(0, visibleCount);

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
