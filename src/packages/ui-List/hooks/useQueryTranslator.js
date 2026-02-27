// hooks/useQueryTranslator.js

// 1. Converts Internal Query (GUIDs) -> Display Query (Labels)
export function getDisplayQuery(query, filtersConfig = []) {
  if (!query) return "";
  const tokens = query.match(/(\w+:"[^"]+"|\w+:\S+|\S+)/g) || [];

  return tokens.map(token => {
    if (token.includes(":")) {
      const [key, ...rest] = token.split(":");
      const value = rest.join(":").replace(/^"|"$/g, ""); // Strip quotes

      // Convert FROM internal TO display, so look up by internal `key`
      const filterDef = filtersConfig.find(f => f.key === key);
      
      if (filterDef) {
        const option = filterDef.options.find(o => String(o.value) === String(value));
        if (option) {
          // 🔥 FIX 1: Use 'view' if you provided it, otherwise fallback to 'key'
          const displayPrefix = filterDef.view || filterDef.key;
          
          // 🔥 FIX 2: Actually wrap in quotes if there is a space! 
          return option.label.includes(" ") 
            ? `${displayPrefix}:"${option.label}"` 
            : `${displayPrefix}:${option.label}`;
        }
      }
    }
    return token;
  }).join(" ");
}

// 2. Converts Display Query (Labels) -> Internal Query (GUIDs)
export function getInternalQuery(displayQuery, filtersConfig = []) {
  if (!displayQuery) return "";
  const tokens = displayQuery.match(/(\w+:"[^"]+"|\w+:\S+|\S+)/g) || [];

  return tokens.map(token => {
    if (token.includes(":")) {
      const [displayKey, ...rest] = token.split(":");
      const label = rest.join(":").replace(/^"|"$/g, ""); // Strip quotes

      // 🔥 FIX 3: Convert FROM display TO internal. 
      // We must search by BOTH 'view' or 'key' because the text prefix is now "Repo" or "Emp"
      const filterDef = filtersConfig.find(f => f.view === displayKey || f.key === displayKey);
      
      if (filterDef) {
        const option = filterDef.options.find(o => String(o.label) === String(label));
        if (option) {
          // Always return the true backend key and value
          return `${filterDef.key}:${option.value}`;
        }
      }
    }
    return token;
  }).join(" ");
}