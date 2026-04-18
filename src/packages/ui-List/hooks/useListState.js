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
console.log("sortField :", sortField);
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
      const activeNormalizer = config.normalizer;
      data = activeNormalizer ? rawData.map(activeNormalizer) : [...rawData];
    }

    const combinedFilters = { ...filters, ...queryFilters };

    // 🔥 1. Initialize a Score Tracker for multi-select matches
    const matchScores = new Map();

    Object.entries(combinedFilters).forEach(([key, value]) => {
      if (!value) return;

      // Handle "is" token (Tabs)
      if (key === "is" && config.tabConfig) {
        // ... (keep your existing mapping logic for tabs here)
        const mapping = config.tabConfig.find((t) => t.key === value);
        if (mapping) {
          data = data.filter((item) => {
            const itemValue = item[mapping.field];
            if (mapping.excludeValues)
              return !mapping.excludeValues.includes(itemValue);
            if (Array.isArray(mapping.filterValue))
              return mapping.filterValue.includes(itemValue);
            return itemValue === mapping.filterValue;
          });
        }
        return;
      }

      const filterConfig = config.filters?.find((f) => f.key === key);

      if (filterConfig?.filterType === "api") return;

      if (
        filterConfig?.filterType === "custom" &&
        typeof filterConfig.customFilter === "function"
      ) {
        data = data.filter((item) => filterConfig.customFilter(item, value));
      } else if (filterConfig?.filterType === "array") {
        // 🔥 2. Handle Multi-Select Comma Strings (e.g. "11,13")
        const targetValues = String(value).split(",");

        data = data.filter((item) => {
          if (!Array.isArray(item[key])) return false;

          // Count how many of the selected tags this ticket actually has
          const matchCount = targetValues.filter((tv) =>
            item[key].some(
              (entry) => String(entry[filterConfig.filterKey]) === String(tv),
            ),
          ).length;

          if (matchCount > 0) {
            // Add the score to the Map so we can use it during sorting!
            matchScores.set(item, (matchScores.get(item) || 0) + matchCount);
            return true; // Keep partial matches
          }
          return false;
        });
      } else {
        // 🔥 3. Standard Filter (Updated to also support multi-select commas!)
        const targetValues = String(value).split(",");
        data = data.filter((item) => {
          if (targetValues.includes(String(item[key]))) {
            // Add a score of 1 for standard matches
            matchScores.set(item, (matchScores.get(item) || 0) + 1);
            return true;
          }
          return false;
        });
      }
    });

    // Text search
    if (text) {
      data = data.filter((item) =>
        item.title?.toLowerCase().includes(text.toLowerCase()),
      );
    }

    // 🔥 4. Sort: Prioritize Match Score, then fallback to user's selection
    data.sort((a, b) => {
      const scoreA = matchScores.get(a) || 0;
      const scoreB = matchScores.get(b) || 0;

      // If one ticket has more matching tags than the other, put it at the top!
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }

      // If scores are tied (or 0), fallback to standard "Newest/Oldest" sorting
      const aVal = a?.[sortField.key || sortField];
      const bVal = b?.[sortField.key || sortField];
      if (!aVal || !bVal) return 0;
      // -------------------------------------------------------------
      // CUSTOM DUE DATE BUCKET SORTING
      // -------------------------------------------------------------
      if (sortField.type ===  "custom") {
        // Step 1: Helper to classify a date into a Bucket ID
        const getBucket = (dateStr) => {
          if (!dateStr) return 4; // Nulls/Empty always go to the bottom

          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const d = new Date(dateStr);
          d.setHours(0, 0, 0, 0);

          const diffDays = Math.ceil(
            (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
          );

          if (diffDays < 0) return 1; // Overdue
          if (diffDays === 0) return 2; // Today
          if (diffDays > 0) return 3; // Upcoming
        };

        const bucketA = getBucket(a[sortField.key]); // Match your actual data key here
        const bucketB = getBucket(b[sortField.key]);

        // Step 2: Convert Bucket ID to Priority Score based on what the user clicked
        const getPriority = (bucket) => {
          if (bucket === 4) return 99; // Nulls stay at bottom

          if (sortOrder === "today_first") {
            if (bucket === 2) return 1; // Today
            if (bucket === 1) return 2; // Overdue
            if (bucket === 3) return 3; // Upcoming
          }
          if (sortOrder === "overdue_first") {
            if (bucket === 1) return 1; // Overdue
            if (bucket === 2) return 2; // Today
            if (bucket === 3) return 3; // Upcoming
          }
          if (sortOrder === "upcoming_first") {
            if (bucket === 3) return 1; // Upcoming
            if (bucket === 2) return 2; // Today
            if (bucket === 1) return 3; // Overdue
          }
          return bucket; // Fallback
        };

        const prioA = getPriority(bucketA);
        const prioB = getPriority(bucketB);

        // Step 3: Sort by priority score first!
        if (prioA !== prioB) {
          return prioA - prioB;
        }

        // Step 4: If they are in the exact same bucket, sort them by actual date naturally
        const aTime = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const bTime = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return aTime - bTime;
      }
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
    // dataUpdatedAt // (Make sure this is here if we added it earlier!)
  ]);
  /* --- REUSABLE FILTER MATCH CHECKER --- */
  const checkItemMatchesFilters = useCallback(
    (item, appliedFilters) => {
      return Object.entries(appliedFilters).every(([key, value]) => {
        if (!value) return true;

        // 1. Handle Tab ("is") logic
        if (key === "is" && config.tabConfig) {
          const mapping = config.tabConfig.find((t) => t.key === value);
          if (!mapping) return true;
          const itemValue = item[mapping.field];
          if (mapping.excludeValues)
            return !mapping.excludeValues.includes(itemValue);
          if (Array.isArray(mapping.filterValue))
            return mapping.filterValue.includes(itemValue);
          return itemValue === mapping.filterValue;
        }

        // 2. Handle standard/custom/array filters
        const filterConfig = config.filters?.find((f) => f.key === key);
        if (!filterConfig) return true;

        if (
          filterConfig.filterType === "custom" &&
          typeof filterConfig.customFilter === "function"
        ) {
          return filterConfig.customFilter(item, value);
        } else if (filterConfig.filterType === "array") {
          const targetValues = String(value).split(",");
          return (
            Array.isArray(item[key]) &&
            targetValues.some((tv) =>
              item[key].some(
                (entry) => String(entry[filterConfig.filterKey]) === String(tv),
              ),
            )
          );
        } else if (filterConfig.filterType === "api") {
          return true; // Already filtered via API
        } else {
          const targetValues = String(value).split(",");
          return targetValues.includes(String(item[key]));
        }
      });
    },
    [config.filters, config.tabConfig],
  );

  const tabCounts = useMemo(() => {
    if (!config.tabConfig) return {};

    const counts = {};

    // Combine filters, except "is" which is the tab filter
    const baseFilters = { ...filters, ...queryFilters };
    delete baseFilters.is;

    // Use normalized API data or rawData
    let allData = Array.isArray(apiFilteredData) ? apiFilteredData : rawData;
    const activeNormalizer = apiFilterConfig?.normalizer || config.normalizer;
    if (activeNormalizer) {
      allData = allData.map(activeNormalizer);
    }

    // Precompute items that pass base filters (excluding tab "is")
    const filteredData = allData.filter((item) =>
      Object.entries(baseFilters).every(([key, value]) => {
        if (!value) return true;
        const filterConfig = config.filters?.find((f) => f.key === key);
        if (!filterConfig) return true;

        if (
          filterConfig.filterType === "custom" &&
          typeof filterConfig.customFilter === "function"
        ) {
          return filterConfig.customFilter(item, value);
        } else if (filterConfig.filterType === "array") {
          const targetValues = String(value).split(",");
          return (
            Array.isArray(item[key]) &&
            targetValues.some((tv) =>
              item[key].some(
                (entry) => String(entry[filterConfig.filterKey]) === String(tv),
              ),
            )
          );
        } else if (filterConfig.filterType === "api") {
          return true; // already filtered via API
        } else {
          const targetValues = String(value).split(",");
          return targetValues.includes(String(item[key]));
        }
      }),
    );

    // Count per tab efficiently
    config.tabConfig.forEach((tab) => {
      const { key, field, excludeValues, filterValue } = tab;
      counts[key] = filteredData.reduce((acc, item) => {
        const itemValue = item[field];

        if (excludeValues) {
          if (!excludeValues.includes(itemValue)) acc += 1;
        } else if (Array.isArray(filterValue)) {
          if (filterValue.includes(itemValue)) acc += 1;
        } else {
          if (itemValue === filterValue) acc += 1;
        }

        return acc;
      }, 0);
    });

    return counts;
  }, [
    rawData,
    apiFilteredData,
    apiFilterEntries,
    apiFilterConfig,
    config.tabConfig,
    config.filters,
    filters,
    queryFilters,
    config.normalizer,
  ]);

  /* --- FILTER COUNTS (NEW) --- */
  const filterCounts = useMemo(() => {
    const counts = {};
    // Only calculate if at least one filter has showCounts: true
    if (!config.filters || !config.filters.some((f) => f.showCounts))
      return counts;

    const baseFilters = { ...filters, ...queryFilters };
    let allData = Array.isArray(apiFilteredData) ? apiFilteredData : rawData;
    const activeNormalizer = apiFilterConfig?.normalizer || config.normalizer;
    if (activeNormalizer) {
      allData = allData.map(activeNormalizer);
    }

    config.filters.forEach((filter) => {
      if (!filter.showCounts || !filter.options) return;
      counts[filter.key] = {};

      // To get accurate faceted counts, we evaluate data against all OTHER filters (excluding this one)
      const filtersExceptCurrent = { ...baseFilters };
      delete filtersExceptCurrent[filter.key];

      const dataForThisFilter = allData.filter((item) =>
        checkItemMatchesFilters(item, filtersExceptCurrent),
      );

      filter.options.forEach((opt) => {
        const val = opt.value;
        if (val === "" || val === null) {
          // "All" option equals the total items available for this filter
          counts[filter.key][val] = dataForThisFilter.length;
        } else {
          // Count items that match THIS specific option
          counts[filter.key][val] = dataForThisFilter.filter((item) =>
            checkItemMatchesFilters(item, { [filter.key]: val }),
          ).length;
        }
      });
    });

    return counts;
  }, [
    rawData,
    apiFilteredData,
    apiFilterConfig,
    config.filters,
    filters,
    queryFilters,
    config.normalizer,
    checkItemMatchesFilters,
  ]);

  // const processed = useMemo(() => {
  //   let data = [];

  //   // Use API data if available, otherwise fallback to rawData
  //   if (apiFilterEntries.length > 0 && apiFilteredData) {
  //     const raw = Array.isArray(apiFilteredData) ? apiFilteredData : [];
  //     const activeNormalizer = apiFilterConfig?.normalizer || config.normalizer;

  //     data = activeNormalizer ? raw.map(activeNormalizer) : raw;
  //   } else {
  //     data = [...rawData];
  //   }
  //   console.log("Filtered Data:", data, rawData);
  //   const combinedFilters = { ...filters, ...queryFilters };

  //   Object.entries(combinedFilters).forEach(([key, value]) => {
  //     if (!value) return;

  //     // Handle "is" token (Tabs)
  //     if (key === "is" && config.tabConfig) {
  //       const mapping = config.tabConfig.find((t) => t.key === value);
  //       if (mapping) {
  //         data = data.filter((item) => {
  //           const itemValue = item[mapping.field];

  //           // 1. Exclude values
  //           if (mapping.excludeValues) {
  //             return !mapping.excludeValues.includes(itemValue);
  //           }
  //           // 2. Include multiple values
  //           if (Array.isArray(mapping.filterValue)) {
  //             return mapping.filterValue.includes(itemValue);
  //           }
  //           // 3. Exact match
  //           return itemValue === mapping.filterValue;
  //         });
  //       }
  //       return;
  //     }

  //     const filterConfig = config.filters?.find((f) => f.key === key);

  //     if (filterConfig?.filterType === "api") return; // Skip, handled by server
  //     // 🔥 NEW: Execute the custom filter function if it exists
  //     if (
  //       filterConfig?.filterType === "custom" &&
  //       typeof filterConfig.customFilter === "function"
  //     ) {
  //       data = data.filter((item) => filterConfig.customFilter(item, value));
  //     } else if (filterConfig?.filterType === "array") {
  //       // value could be "id1" (single) or "id1,id2" (multi) or ["id1","id2"] (array)
  //       const selectedValues = Array.isArray(value)
  //         ? value
  //         : String(value)
  //             .split(",")
  //             .map((v) => v.trim())
  //             .filter(Boolean);

  //       data = data.filter(
  //         (item) =>
  //           Array.isArray(item[key]) &&
  //           // ✅ every = AND logic (item must have ALL selected labels)
  //           // ❌ some  = OR logic  (item just needs ONE matching label)
  //           selectedValues.every((selectedVal) =>
  //             item[key].some(
  //               (entry) =>
  //                 String(entry[filterConfig.filterKey]) === String(selectedVal),
  //             ),
  //           ),
  //       );
  //     } else {
  //       data = data.filter((item) => item[key] == value);
  //     }
  //   });

  //   // Text search
  //   if (text) {
  //     const lower = text.toLowerCase();
  //     const fields = config.searchFields || ["title"]; // fallback to title only
  //     data = data.filter((item) =>
  //       fields.some((field) => item[field]?.toLowerCase().includes(lower)),
  //     );
  //   }

  //   // Sort
  //   data.sort((a, b) => {
  //     const aVal = a?.[sortField];
  //     const bVal = b?.[sortField];
  //     if (!aVal || !bVal) return 0;

  //     const aDate = new Date(aVal);
  //     const bDate = new Date(bVal);

  //     // Date sorting
  //     if (!isNaN(aDate) && !isNaN(bDate)) {
  //       return sortOrder === "asc"
  //         ? aDate.getTime() - bDate.getTime()
  //         : bDate.getTime() - aDate.getTime();
  //     }

  //     // String sorting
  //     return sortOrder === "asc"
  //       ? String(aVal).localeCompare(String(bVal))
  //       : String(bVal).localeCompare(String(aVal));
  //   });

  //   return data;
  // }, [
  //   rawData,
  //   queryFilters,
  //   filters,
  //   sortField,
  //   sortOrder,
  //   text,
  //   config,
  //   apiFilterEntries,
  //   apiFilteredData,
  // ]);

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
    tabCounts,
    filterCounts,
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
