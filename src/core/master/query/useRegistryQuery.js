// src/core/master/query/useRegistryQuery.js
//
// One hook for ALL registry-driven read access.
// Works for any registry: MASTER_REGISTRY, DASHBOARD_REGISTRY, etc.
//
// source: "masterData" → reads from the pre-loaded bulk cache (no network call)
// source: "api"        → fires through useApiQuery → executeApi → interceptor

import { useMasterData } from "../masterCall/useMasterData";
import { useApiQuery } from "../../query/useApiQuery";
import { enrichData } from "../enrich/enrichData";

// Adapted master lists, built once per cached raw list and adapter. Lookups
// like useEmployeeById run several times per list row, and re-adapting the
// whole master on every call made long lists slow to render.
const EMPTY = [];
const adaptedCache = new WeakMap(); // raw list → Map(adapter → adapted list)
const adaptMasterList = (rawList, adapter) => {
  if (!rawList) return EMPTY;
  let byAdapter = adaptedCache.get(rawList);
  if (!byAdapter) {
    byAdapter = new Map();
    adaptedCache.set(rawList, byAdapter);
  }
  let adapted = byAdapter.get(adapter);
  if (!adapted) {
    adapted = rawList.map(adapter).filter(Boolean);
    byAdapter.set(adapter, adapted);
  }
  return adapted;
};

/**
 * @param {object} registry  - any registry object  (MASTER_REGISTRY | DASHBOARD_REGISTRY | …)
 * @param {string} key       - entry key inside that registry
 * @param {object} params    - runtime values  → fed into queryKey / payload / enabled
 * @param {object} overrides - component-level overrides  { staleTime, enabled, refetchInterval, … }
 *
 * @returns {{ data, isLoading, isError, error, ...rest }}
 *   data is always the adapter-mapped result
 */
export const useRegistryQuery = (
  registry,
  key,
  params = {},
  overrides = {},
) => {
  const config = registry[key];

  if (!config) {
    throw new Error(`[useRegistryQuery] Unknown registry key: "${key}"`);
  }

  // ── Path A: bulk pre-loaded master (no extra network call) ─────────────────
  if (config.source === "masterData") {
    const { data: masterData, isLoading, isError, error } = useMasterData();
    const data = adaptMasterList(masterData?.[config.masterKey], config.adapter);
    return { data, isLoading, isError, error };
  }

  // ── Path B: any independent API  →  useApiQuery → executeApi → interceptor ─
  const queryKey =
    typeof config.queryKey === "function"
      ? config.queryKey(params)
      : config.queryKey;
  const payload =
    typeof config.payload === "function"
      ? config.payload(params)
      : config.payload; // undefined for GET calls

  // component override wins; fallback to registry; fallback to true
  const enabled =
    overrides.enabled !== undefined
      ? overrides.enabled
      : typeof config.enabled === "function"
        ? config.enabled(params)
        : (config.enabled ?? true);

  const staleTime = overrides.staleTime ?? config.staleTime ?? 5 * 60 * 1000;

  const result = useApiQuery({
    queryKey,
    url: config.url,
    method: config.method,
    payload,
    source: config.source, // key to unwrap from sync/v2 envelope
    silent: overrides.silent, // true → never the global loader
    options: {
      staleTime,
      enabled,
      ...overrides, // gcTime, refetchInterval, select, etc.
    },
  });

  // apply per-row adapter when response is a list
  let data = result.data;

  if (data && config.adapter) {
    data = Array.isArray(data)
      ? data.map(config.adapter).filter(Boolean)
      : config.adapter(data);
  }
  if (config.enrich) {
    data = enrichData(data, config.enrich);
  }

  return { ...result, data };
};
