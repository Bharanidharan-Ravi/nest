import { parseQuery } from "../hooks/useQueryParser";

// Default query string of a list: "is:<tab>" plus every filter defaultValue.
export function buildDefaultQuery(config, tabKey) {
  let q = config.enableTabs !== false && tabKey ? `is:${tabKey}` : "";
  (config.filters || []).forEach((f) => {
    if (f.defaultValue && f.defaultValue !== "") {
      const safeValue = f.defaultValue.includes(" ")
        ? `"${f.defaultValue}"`
        : f.defaultValue;
      q += ` ${f.key}:${safeValue}`;
    }
  });
  return q.trim();
}

const readCache = (key) => {
  try {
    return JSON.parse(sessionStorage.getItem(key) || "{}");
  } catch {
    return {};
  }
};

// The "<moduleId>_*" URL params a list writes (useUrlSync) after it mounts
// with no params of its own. Pre-writing them with the module switch gives
// one navigation instead of a bare ?module=x followed by a second rewrite.
// Mirrors the initial state of useListState and the rules of useUrlSync.
export function getInitialListParams(config, userRole = null) {
  if (!config || config.syncUrl === false || !config.moduleId) return {};

  const id = config.moduleId;
  const hasMultipleViews =
    Array.isArray(config.allowViewSwitch) && config.allowViewSwitch.length > 1;

  const view =
    (hasMultipleViews && readCache(`wgnest_cache_${id}`).view) ||
    config.defaultView ||
    "table";
  const cache = readCache(
    hasMultipleViews ? `wgnest_cache_${id}_${view}` : `wgnest_cache_${id}`,
  );

  const defaultTab =
    config.enableTabs !== false ? config.tabConfig?.[0]?.key : null;
  const query =
    cache.query !== undefined ? cache.query : buildDefaultQuery(config, defaultTab);

  const sortField = config.defaultSort?.field || "updatedAt";
  const sortOrder = config.defaultSort?.order || "desc";
  const statusTab = parseQuery(query, config.filters, userRole).filters.is;

  const params = {};
  const add = (key, value, defaultVal) => {
    if (value && value !== defaultVal) params[`${id}_${key}`] = String(value);
  };
  add("q", query, "");
  add("sort", sortField, config.defaultSort?.field);
  add("order", sortOrder, config.defaultSort?.order);
  add("tab", statusTab, config.tabConfig?.[0]?.key);
  params[`${id}_view`] = view; // always kept, like useUrlSync
  return params;
}
