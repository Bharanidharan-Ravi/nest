// Paged ticket list for the ui-List server mode (config.useServerData).
//
// Builds the TicketListV2 "Filters" JSON from the list state:
//   filters → f[<filter.serverKey>]   (filters without serverKey are ignored)
//   is:<tab> → f.status              (tab statuses; excludeValues resolved
//                                     against the status master)
//   text    → f.search
//   serverScope.f → fixed filters, e.g. { issue: [ids] } (Checked Tickets);
//             an empty array there matches nothing, so no request is sent
//   sort    → sortFields[].serverKey / orders[].serverSort,
//             plus config.serverDefaultSort on the default sort
// Rows are mapped to names with the masters (normalizeTicketListRow).
// Tab and dropdown counts come from TicketListCountsV2: each facet is counted
// without its own filter, so the status facet gives every tab's count.
//
// No loader on filter / tab / sort changes (stale-while-revalidate):
//   1. a cached page for the exact request is shown as is;
//   2. otherwise the already-loaded rows are filtered/sorted locally
//      (ticketListPreview) and shown at once, or the previous list stays;
//   3. the request runs silently and replaces the rows when it lands.
// The global loader shows only when there is nothing at all to show.
// Server load: the preview follows every click / keystroke, but the list and
// counts requests wait until the request stops changing, so picking 5 filter
// options quickly costs one list + one counts call.
// The counts SP is far slower than the list page (~900ms vs ~70ms), so the
// counts go out as their own request (_noBatch) with a longer debounce: the
// list never waits for the counts.
// Other tabs are not prefetched (one SP call per tab on every filter change);
// a tab switch shows the preview and the tab counts at once instead.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  keepPreviousData,
  replaceEqualDeep,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { executeApi } from "../../../core/api/executor";
import { extractSourceData, useApiQuery } from "../../../core/query/useApiQuery";
import { queryKeys } from "../../../core/query/queryKeys";
import { buildSyncPayload } from "../../../core/sync/buildSyncPayload";
import { useMasterLookup } from "../../../core/master/useMasterLookup";
import { normalizeTicketListRow } from "../../../app/shared/utils/normalizer";
import { readUserFromSession } from "../../../core/auth/useCurrentUser";
import { buildTicketListPreview } from "./ticketListPreview";

const LIST_KEY = "TicketListV2";
const COUNTS_KEY = "TicketListCountsV2";
const TAB_SERVER_KEY = "status";
// Realtime refetches these caches when a ticket changes, so a cached page is
// reused when going back to a tab/filter or returning to the screen.
const STALE_TIME = 5 * 60 * 1000;
// Filters / tab / sort / search: one request once the changes pause,
// not one per click or keystroke (the preview shows meanwhile)
const LIST_DEBOUNCE_MS = 150;
const COUNTS_DEBOUNCE_MS = 400;

const toArray = (value) =>
  (Array.isArray(value) ? value : String(value ?? "").split(","))
    .map((v) => String(v).trim())
    .filter(Boolean);

const useDebounced = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

const sameId = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();

const tabStatusIds = (tab, statusIds) =>
  tab.excludeValues
    ? statusIds.filter((id) => !tab.excludeValues.includes(id))
    : [].concat(tab.filterValue);

const buildSort = (config, sortField, sortOrder) => {
  const sortDef = config.sortFields?.find((s) => s.key === sortField);
  const orderDef = sortDef?.orders?.find((o) => o.key === sortOrder);
  const isDefault =
    sortField === config.defaultSort?.field &&
    sortOrder === config.defaultSort?.order;

  return [
    ...(isDefault ? (config.serverDefaultSort ?? []) : []),
    ...(orderDef?.serverSort ??
      (sortDef?.serverKey ? [{ key: sortDef.serverKey, dir: sortOrder }] : [])),
  ];
};

const fetchSync = async (configKey, repoId, filters, silent) => {
  const res = await executeApi({
    url: "/sync/v2",
    method: "POST",
    payload: buildSyncPayload({
      configKey,
      repoId,
      customParams: { Filters: JSON.stringify(filters) },
    }),
    config: { _silent: silent },
  });
  return extractSourceData(res, configKey) ?? [];
};

// Pages kept per list: the card view keeps 2 pages ahead and 1 behind the
// page on screen, so 5 leaves room for both. Past it, fetching a page at one
// end drops the page at the other end (fetched again when scrolled back to).
const MAX_PAGES = 5;
const PAGES_AHEAD = 2;
const PAGES_BEHIND = 1;

const pageQueryOptions = ({ repoId, f, sort, size }, isSilent) => ({
  queryKey: queryKeys.ticket.page({ repoId, f, sort, size }),
  queryFn: ({ pageParam }) =>
    fetchSync(LIST_KEY, repoId, { f, sort, page: pageParam, size }, isSilent(pageParam)),
  initialPageParam: 1,
  // Page numbers from the params, not pages.length: the first kept page
  // isn't page 1 once pages have been dropped
  getNextPageParam: (lastPage, pages, lastPageParam) =>
    lastPage.length === size ? lastPageParam + 1 : undefined,
  getPreviousPageParam: (firstPage, pages, firstPageParam) =>
    firstPageParam > 1 ? firstPageParam - 1 : undefined,
  maxPages: MAX_PAGES,
  staleTime: STALE_TIME,
});

export function useTicketList({ filters, text, sortField, sortOrder }, config) {
  const lookup = useMasterLookup();
  const search = String(text ?? "").replace(/^#/, "").trim();
  const { repoId = null, projectId = null, f: scopeF } = config.serverScope ?? {};
  const size = config.pageSize ?? 20;

  const statusIds = useMemo(
    () => lookup.list("status").map((s) => s.id),
    [lookup],
  );

  const tabs = config.enableTabs !== false ? (config.tabConfig ?? []) : [];
  const activeTab = tabs.find((t) => t.key === filters.is);

  const { f, noMatch } = useMemo(() => {
    const result = {};
    (config.filters ?? []).forEach((filter) => {
      if (!filter.serverKey) return;
      const values = toArray(filters[filter.key]);
      if (values.length) result[filter.serverKey] = values;
    });

    // Project page: the route project, narrowed by any project filter
    let projectOutOfScope = false;
    if (projectId) {
      const picked = result.project;
      projectOutOfScope = !!picked && !picked.some((p) => sameId(p, projectId));
      result.project = [projectId];
    }

    if (activeTab) result[TAB_SERVER_KEY] = tabStatusIds(activeTab, statusIds);

    if (search) result.search = [search];

    // The SP ignores an empty filter, so an empty fixed one can't be sent
    const scopeEmpty = Object.values(scopeF ?? {}).some((v) => v.length === 0);
    Object.assign(result, scopeF);

    return { f: result, noMatch: projectOutOfScope || scopeEmpty };
  }, [config.filters, filters, projectId, scopeF, activeTab, statusIds, search]);

  const sort = buildSort(config, sortField, sortOrder);
  // Exclude-style tabs need the status master before the first call
  const enabled = lookup.ready && !noMatch;

  const queryClient = useQueryClient();
  const request = { repoId, f, sort, size };
  const requestHash = JSON.stringify(request);
  // A cached page still shows at once (disabled queries keep their data)
  const settled = useDebounced(requestHash, LIST_DEBOUNCE_MS) === requestHash;
  const fetchEnabled = enabled && settled;
  const countsHash = JSON.stringify({ repoId, f });
  const countsSettled = useDebounced(countsHash, COUNTS_DEBOUNCE_MS) === countsHash;
  const countsEnabled = enabled && countsSettled;

  // Local preview for a request with no cache yet (computed once per request)
  const preview = useMemo(
    () =>
      enabled && !queryClient.getQueryData(queryKeys.ticket.page(request))
        ? buildTicketListPreview(queryClient, request, {
            lookup,
            userId: readUserFromSession()?.userId,
          })
        : undefined,
    // request is described by requestHash
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [requestHash, enabled, queryClient, lookup],
  );

  // Rows on screen → fetch silently; nothing to show → global loader
  const hasRowsRef = useRef(false);
  const list = useInfiniteQuery({
    ...pageQueryOptions(request, (page) => page > 1 || hasRowsRef.current),
    placeholderData: (previous) => preview ?? keepPreviousData(previous),
    enabled: fetchEnabled,
  });
  hasRowsRef.current = (list.data?.pages?.[0]?.length ?? 0) > 0;

  const { data: countRows } = useApiQuery({
    queryKey: queryKeys.ticket.pageCounts({ repoId, f }),
    queryFn: () =>
      executeApi({
        url: "/sync/v2",
        method: "POST",
        payload: buildSyncPayload({
          configKey: COUNTS_KEY,
          repoId,
          customParams: { Filters: JSON.stringify({ f }) },
        }),
        config: { _silent: true, _noBatch: true },
      }),
    source: COUNTS_KEY,
    options: {
      placeholderData: keepPreviousData,
      staleTime: STALE_TIME,
      enabled: countsEnabled,
    },
  });

  // facets[facet][lower-case value] = count; "total" is under ""
  const facets = useMemo(() => {
    const result = {};
    (enabled ? (countRows ?? []) : []).forEach((row) => {
      result[row.Facet] ??= {};
      result[row.Facet][String(row.Value ?? "").toLowerCase()] = row.Cnt;
    });
    return result;
  }, [countRows, enabled]);

  const total = facets.total?.[""] ?? 0;

  const tabCounts = useMemo(
    () =>
      Object.fromEntries(
        tabs.map((tab) => [
          tab.key,
          tabStatusIds(tab, statusIds).reduce(
            (sum, id) => sum + (facets[TAB_SERVER_KEY]?.[String(id)] ?? 0),
            0,
          ),
        ]),
      ),
    [tabs, statusIds, facets],
  );

  const filterCounts = useMemo(() => {
    const counts = {};
    (config.filters ?? []).forEach((filter) => {
      if (!filter.serverKey || !filter.showCounts) return;
      counts[filter.key] = Object.fromEntries(
        (filter.options ?? []).map((opt) => [
          opt.value,
          opt.value === ""
            ? total
            : (facets[filter.serverKey]?.[String(opt.value).toLowerCase()] ?? 0),
        ]),
      );
    });
    return counts;
  }, [config.filters, facets, total]);

  // A ticket whose raw row didn't change keeps its row object (preview →
  // server rows, refetch, next page), so its memoised card doesn't re-render.
  // A ticket on two pages (moved while paging) is shown once.
  const rowCache = useRef({ lookup: null, byId: new Map() });
  const data = useMemo(() => {
    if (!enabled) return [];
    const cache = rowCache.current;
    if (cache.lookup !== lookup) cache.byId = new Map();
    const byId = new Map();
    (list.data?.pages ?? []).flat().forEach((raw) => {
      const id = String(raw.Issue_Id ?? "").toLowerCase();
      if (byId.has(id)) return;
      const prev = cache.byId.get(id);
      const same = prev && (prev.raw === raw || replaceEqualDeep(prev.raw, raw) === prev.raw);
      byId.set(id, same ? prev : { raw, row: normalizeTicketListRow(raw, lookup) });
    });
    rowCache.current = { lookup, byId };
    return [...byId.values()].map((entry) => entry.row);
  }, [list.data, lookup, enabled]);

  // A preview / previous list isn't this request's data: no paging from it.
  // One page request at a time (a second one would cancel the first).
  const {
    hasNextPage,
    hasPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
    fetchNextPage,
    fetchPreviousPage,
    isPlaceholderData,
  } = list;
  const paging = isFetchingNextPage || isFetchingPreviousPage;
  const firstPage = list.data?.pageParams?.[0] ?? 1;
  const pageCount = list.data?.pages?.length ?? 0;
  const loadMore = useCallback(() => {
    if (hasNextPage && !paging && !isPlaceholderData) fetchNextPage();
  }, [hasNextPage, paging, isPlaceholderData, fetchNextPage]);

  // Called by the card view with the pages on screen (0-based). Keeps
  // PAGES_BEHIND pages above the top one and PAGES_AHEAD below it loaded,
  // one request at a time, never dropping a page that is on screen.
  //   open → 1,2,3 · page 2 on screen → 4 · page 3 → 5 (1-5 kept)
  //   page 4 → 6 (page 1 dropped, 2-6) · back to page 2 → 1 (6 dropped)
  const showPages = useCallback(
    (top, bottom) => {
      if (!enabled || paging || isPlaceholderData || !pageCount) return;
      const topPage = top + 1;
      const from = Math.max(1, topPage - PAGES_BEHIND);
      const to = Math.max(bottom + 1, topPage + PAGES_AHEAD);
      const last = firstPage + pageCount - 1;
      const full = pageCount >= MAX_PAGES;

      // A page on screen above the kept ones (scrolled up / scrollbar drag)
      if (hasPreviousPage && firstPage > topPage) fetchPreviousPage();
      // Ahead, unless that drops (full) a page on screen at the top
      else if (hasNextPage && last < to && !(full && firstPage >= topPage)) fetchNextPage();
      // Behind, unless that drops (full) a page still needed below
      else if (hasPreviousPage && firstPage > from && !(full && last - 1 < to)) fetchPreviousPage();
    },
    [
      enabled,
      paging,
      isPlaceholderData,
      pageCount,
      firstPage,
      hasNextPage,
      hasPreviousPage,
      fetchNextPage,
      fetchPreviousPage,
    ],
  );

  return {
    data,
    total,
    hasMore: enabled && !!hasNextPage && !isPlaceholderData,
    loadMore,
    showPages,
    // Pages dropped before data[0] (the card view keeps their space)
    pageOffset: enabled && !isPlaceholderData ? firstPage - 1 : 0,
    tabCounts,
    filterCounts,
    isLoading: list.isLoading,
    // The previous filter's rows are on screen (no local preview possible)
    isStale: enabled && isPlaceholderData && !preview,
    dataUpdatedAt: list.dataUpdatedAt,
  };
}
