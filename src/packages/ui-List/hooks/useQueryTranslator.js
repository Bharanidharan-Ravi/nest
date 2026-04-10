// hooks/useQueryTranslator.js

// getDisplayQuery — convert IDs → Labels (handles multi)
export function getDisplayQuery(query, filtersConfig = []) {
  if (!query) return "";
  const tokens = query.match(/(\w+:"[^"]+"|\w+:\S+|\S+)/g) || [];

  return tokens
    .map((token) => {
      if (!token.includes(":")) return token;

      const [key, ...rest] = token.split(":");
      const rawValue = rest.join(":").replace(/^"|"$/g, "");
      const filterDef = filtersConfig.find((f) => f.key === key);

      if (!filterDef) return token;

      const displayPrefix = filterDef.view || filterDef.key;

      // 🔥 Split comma-separated IDs and convert each one
      const ids = rawValue.split(",").map((v) => v.trim());
      const labels = ids.map((id) => {
        const option = filterDef.options?.find(
          (o) => String(o.value) === String(id),
        );
        return option ? option.label : id; // fallback to raw id if not found
      });

      // Wrap in quotes if any label has a space
      const formatted = labels.map((l) => l).join(","); // ✅ No quotes wrapping
      return `${displayPrefix}:${formatted}`;
    })
    .join(" ");
}

// getInternalQuery — convert Labels → IDs (handles multi)
export function getInternalQuery(displayQuery, filtersConfig = []) {
  if (!displayQuery) return "";
  const tokens = displayQuery.match(/(\w+:"[^"]+"|\w+:\S+|\S+)/g) || [];

  return tokens
    .map((token) => {
      if (!token.includes(":")) return token;

      const [displayKey, ...rest] = token.split(":");
      const rawLabel = rest.join(":").replace(/^"|"$/g, "");
      const filterDef = filtersConfig.find(
        (f) => f.view === displayKey || f.key === displayKey,
      );

      if (!filterDef) return token;

      // 🔥 Split comma-separated labels and convert each one back to ID
      const labels = rawLabel
        .split(",")
        .map((v) => v.trim().replace(/^"|"$/g, ""));
      const ids = labels.map((label) => {
        const option = filterDef.options?.find(
          (o) => String(o.label) === String(label),
        );
        return option ? String(option.value) : label;
      });

      return `${filterDef.key}:${ids.join(",")}`;
    })
    .join(" ");
}
