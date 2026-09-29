// core/filterEngine.js
//
// Pure, hook-free filter engine shared by useListState and any other consumer
// (editor mentions, pickers, dashboards). Knows nothing about any entity —
// behaviour is driven entirely by the list config:
//
//   config.itemVisibilityFilter → (item) => boolean, applied first
//   config.tabConfig            → used by the "is" filter key
//   config.enableTabs           → false disables the "is" filter
//   config.filters              → [{ key, filterType, filterKey, customFilter }]
//   config.searchFields         → fields matched against free text
//   config.searchMode           → "allTokens": every word must match (any order);
//                                 default: whole text as one substring
//
// Returns { data, matchScores } — matchScores (Map item → score) lets callers
// rank multi-select matches when sorting.

export function applyListFilters(rawData = [], { config = {}, filters = {}, text = "" } = {}) {
  let data = Array.isArray(rawData) ? [...rawData] : [];

  if (typeof config.itemVisibilityFilter === "function") {
    data = data.filter((item) => config.itemVisibilityFilter(item));
  }

  // 🔥 1. Initialize a Score Tracker for multi-select matches
  const matchScores = new Map();

  Object.entries(filters).forEach(([key, value]) => {
    if (!value) return;

    // 🚀 THE FIX: Check if this filter key actually exists in the current config
    const filterConfig = config?.filters?.find((f) => f.key === key);
    if (!filterConfig && key !== "is" && key !== "text") {
      return;
    }
    if (key === "is") {
      // 🚀 THE FIX: If tabs are disabled in config, completely ignore the "is" filter!
      if (config.enableTabs === false) return;
      if (config.tabConfig) {
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
      }
      return; // ALWAYS return here so 'is' queries never accidentally wipe out data!
    }

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

  if (text) {
    const searchText = text.toLowerCase().replace(/^#/, "").trim();

    if (config.searchMode === "allTokens") {
      // Every word must appear in at least one search field (any order)
      const tokens = searchText.split(/\s+/).filter(Boolean);
      data = data.filter((item) => {
        const haystack = (config.searchFields || [])
          .map((field) => item[field])
          .filter((v) => v !== null && v !== undefined)
          .join(" ")
          .toLowerCase();
        return tokens.every((token) => haystack.includes(token));
      });
    } else {
      data = data.filter((item) =>
        config.searchFields?.some((field) => {
          const value = item[field];

          if (value === null || value === undefined) return false;

          return String(value).toLowerCase().includes(searchText);
        }),
      );
    }
  }

  return { data, matchScores };
}
