import { useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { parseQuery } from "./useQueryParser";
import { useApiQuery } from "../../../core/query/useApiQuery";
import { buildSyncPayload } from "../../../core/sync/buildSyncPayload";

export function useListState(config, rawData = []) {
    const [searchParams] = useSearchParams();
    const isUrlSyncEnabled = config.syncUrl !== false;

    /* --- INITIAL STATE (Run once) --- */
    const initialQuery = useMemo(() => {
        // If child list, ignore URL and load default config
        if (!isUrlSyncEnabled) {
            const defaultTab = config.tabConfig?.[0]?.key;
            return defaultTab ? `is:${defaultTab}` : "";
        }

        const urlQ = searchParams.get("q");
        if (urlQ) return urlQ;

        const urlTab = searchParams.get("tab") || config.tabConfig?.[0]?.key;
        return urlTab ? `is:${urlTab}` : "";
    }, [isUrlSyncEnabled, config.tabConfig, searchParams]);

    /* --- STATES --- */
    const [query, setQuery] = useState(initialQuery);
    const [sortField, setSortField] = useState(
        (isUrlSyncEnabled ? searchParams.get("sort") : null) || config.defaultSort?.field || "updatedAt"
    );
    const [sortOrder, setSortOrder] = useState(
        (isUrlSyncEnabled ? searchParams.get("order") : null) || config.defaultSort?.order || "desc"
    );
    const [filters, setFilters] = useState(config.defaultFilters || {});
    const [view, setView] = useState(config.defaultView || "table");
    const [visibleCount, setVisibleCount] = useState(config.pageSize || 20);

    /* --- QUERY PARSE & DERIVED STATE --- */
    const parsed = parseQuery(query);
    const queryFilters = parsed.filters;
    const text = parsed.text;

    // Derive statusTab directly from the query. No more 'useState' or 'useEffect' loops!
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

    /* --- API FILTER --- */
    const combinedFiltersForApi = { ...filters, ...queryFilters };

    const apiFilterEntries = useMemo(() => {
        if (!config.filters) return [];
        return Object.entries(combinedFiltersForApi).filter(
            ([key]) => config.filters.find((f) => f.key === key)?.filterType === "api"
        );
    }, [filters, queryFilters, config.filters]);

    const apiFilterConfig = apiFilterEntries.length > 0 
        ? config.filters.find((f) => f.key === apiFilterEntries[0][0]) 
        : null;

    const apiPayload = useMemo(() => {
        if (apiFilterEntries.length === 0) return undefined;
        
        return Object.fromEntries(
            apiFilterEntries.map(([key, value]) => {
                const filterConf = config.filters.find((f) => f.key === key);
                return [filterConf?.apiKey || key, value];
            })
        );
    }, [apiFilterEntries, config.filters]);

    const { data: apiFilteredData } = useApiQuery({
        queryKey: [apiFilterConfig?.api, apiPayload],
        url: apiFilterConfig?.api,
        method: apiFilterConfig?.method || "POST",
        payload: apiFilterConfig ? buildSyncPayload({
            configKey: apiFilterConfig.configKey,
            customParams: apiPayload,
        }) : undefined,
        source: apiFilterConfig?.source,
        options: {
            enabled: apiFilterEntries.length > 0 && !!apiFilterConfig?.api,
        },
    });

    /* --- PROCESS DATA (Local Filtering & Sorting) --- */
    const processed = useMemo(() => {
        let data = [];
        
        // Use API data if available, otherwise fallback to rawData
        if (apiFilterEntries.length > 0 && apiFilteredData) {
            const raw = Array.isArray(apiFilteredData) ? apiFilteredData : [];
            data = config.normalizer ? raw.map(config.normalizer) : raw;
        } else {
            data = [...rawData];
        }

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

            if (filterConfig?.filterType === "array") {
                data = data.filter((item) => 
                    Array.isArray(item[key]) && 
                    item[key].some((entry) => entry[filterConfig.filterKey] === value)
                );
            } else {
                data = data.filter((item) => item[key] === value);
            }
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
    }, [rawData, queryFilters, filters, sortField, sortOrder, text, config, apiFilterEntries, apiFilteredData]);

    const visibleData = processed.slice(0, visibleCount);

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