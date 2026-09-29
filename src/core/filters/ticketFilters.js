// src/core/filters/ticketFilters.js
//
// Central ticket filtering for the app. Built on the shared ui-List filter
// engine so the list page, editor mentions and pickers all filter the same way.
// Tickets passed in here must already be normalized (normalizeTicket).

import { useMemo } from "react";
import { applyListFilters } from "../../packages/ui-List/core/filterEngine";
import { normalizeTicket } from "../../app/shared/utils/normalizer";
import { useTicketMaster } from "../../features/tickets/hooks/useTicketMaster";
import { queryClient } from "../api/queryClient";
import { executeApi } from "../api/executor";
import { extractSourceData } from "../query/useApiQuery";
import { queryKeys } from "../query/queryKeys";
import { buildSyncPayload } from "../sync/buildSyncPayload";

const REPO_TICKETS_STALE_TIME = 1000 * 60 * 3; // same as useTicketMaster list

// Filter config consumed by applyListFilters (same shape as a list UI config)
export const TICKET_FILTER_CONFIG = {
  enableTabs: false,
  filters: [
    { key: "repoId" },
    { key: "project" },
    { key: "statusId" },
    { key: "assignedTo" },
  ],
  searchFields: ["ticketKey", "title"],
  searchMode: "allTokens", // "hold ticket" matches "Test the Hold Ticket"
};

// Best matches first: exact code → code prefix → title prefix → rest
const rankTicket = (ticket, query) => {
  const code = String(ticket.ticketKey ?? "").toLowerCase();
  const title = String(ticket.title ?? "").toLowerCase();
  if (code === query || code.replace(/^[a-z]+/, "") === query) return 0;
  if (code.startsWith(query)) return 1;
  if (title.startsWith(query)) return 2;
  return 3;
};

// filters → { repoId, project, statusId, assignedTo } (comma strings allowed)
// text    → free text matched against ticket code + title (leading "#" ignored)
export const filterTickets = (tickets = [], { filters = {}, text = "", limit } = {}) => {
  let { data } = applyListFilters(tickets, {
    config: TICKET_FILTER_CONFIG,
    filters,
    text,
  });

  const query = text.toLowerCase().replace(/^#/, "").trim();
  if (query) {
    data = data
      .map((ticket, index) => ({ ticket, index, rank: rankTicket(ticket, query) }))
      .sort((a, b) => a.rank - b.rank || a.index - b.index)
      .map(({ ticket }) => ticket);
  }

  return limit ? data.slice(0, limit) : data;
};

// Raw API rows → normalized tickets of that repo only.
// Cached per rows array so typing doesn't re-normalize the whole list.
const repoTicketsCache = new WeakMap(); // rows → Map(repoKey → tickets)

const toRepoTickets = (rows, repoId) => {
  if (!Array.isArray(rows)) return [];
  const repoKey = String(repoId);

  let byRepo = repoTicketsCache.get(rows);
  if (!byRepo) {
    byRepo = new Map();
    repoTicketsCache.set(rows, byRepo);
  }
  if (!byRepo.has(repoKey)) {
    byRepo.set(
      repoKey,
      filterTickets(rows.map(normalizeTicket), { filters: { repoId: repoKey } }),
    );
  }
  return byRepo.get(repoKey);
};

// All tickets of one repo, normalized. Shares the React Query cache with the
// repo tickets page (same queryKey), so it adds no extra request there.
// repoId is stringified because route params (the page's cache key) are strings.
export const useRepoTickets = (repoId) => {
  const repoKey = repoId ? String(repoId) : null;
  const { data, isLoading } = useTicketMaster(
    { repoId: repoKey },
    { enabled: Boolean(repoKey) },
  );

  const tickets = useMemo(
    () => (repoKey ? toRepoTickets(data, repoKey) : []),
    [data, repoKey],
  );

  return { tickets, isLoading };
};

// Hook-free version for non-React callers (editor mention sources, etc.).
// Reads the same cache entry as useRepoTickets and fetches only when missing/stale.
export const fetchRepoTickets = async (repoId) => {
  if (!repoId) return [];
  const repoKey = String(repoId);

  const rows = await queryClient.ensureQueryData({
    queryKey: queryKeys.ticket.list({ repoId: repoKey, projectId: "all" }),
    queryFn: async () => {
      const res = await executeApi({
        url: "/sync/v2",
        method: "POST",
        payload: buildSyncPayload({ configKey: "TicketsList", repoId: repoKey }),
        config: { _silent: true },
      });
      return extractSourceData(res, "TicketsList") ?? res;
    },
    staleTime: REPO_TICKETS_STALE_TIME,
    revalidateIfStale: true, // serve cache instantly, refresh in background
  });

  return toRepoTickets(rows, repoKey);
};

// Warm the cache ahead of time (e.g. when an editor opens) so the first
// "#" shows results instantly. Safe to call repeatedly — requests are deduped.
export const prefetchRepoTickets = (repoId) => {
  if (!repoId) return;
  fetchRepoTickets(repoId).catch(() => {});
};
