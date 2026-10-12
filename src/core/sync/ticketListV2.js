// Ticket rows from the V2 sync keys. Rows carry ids only; names come from the
// masters (normalizeTicketListRow).
//
//   TicketListV2   — lists. filters = the SP's "Filters" JSON
//                    (dbo.GetTicketList_V2): { f: { <filterKey>: [values] },
//                    sort, page, size }; no "size" → every matching row.
//   TicketDetailV2 — one ticket with the ticket screen / edit form columns
//                    (description, times, work streams). Same row shape.
//                    Clients (role 3) get the client view only.
//   TicketTagsV2   — id / code / title / owner / repo of every visible
//                    ticket, for the "#" pickers.

import { executeApi } from "../api/executor";
import { extractSourceData } from "../query/useApiQuery";
import { buildSyncPayload } from "./buildSyncPayload";

export const TICKET_LIST_KEY = "TicketListV2";
export const TICKET_DETAIL_KEY = "TicketDetailV2";
export const TICKET_TAGS_KEY = "TicketTagsV2";

const fetchSyncRows = async (payload, key, silent) => {
  const res = await executeApi({
    url: "/sync/v2",
    method: "POST",
    payload,
    config: { _silent: silent },
  });
  return extractSourceData(res, key) ?? [];
};

export const ticketListPayload = (filters = {}, repoId = null) =>
  buildSyncPayload({
    configKey: TICKET_LIST_KEY,
    repoId,
    customParams: { Filters: JSON.stringify(filters) },
  });

export const fetchTicketRows = (filters, { repoId = null, silent = false } = {}) =>
  fetchSyncRows(ticketListPayload(filters, repoId), TICKET_LIST_KEY, silent);

export const ticketDetailPayload = (ticketId) =>
  buildSyncPayload({
    configKey: TICKET_DETAIL_KEY,
    customParams: { IssueId: String(ticketId) },
  });

/** The ticket's detail row, or null when it's gone / not visible. */
export const fetchTicketDetailRow = async (ticketId, { silent = false } = {}) => {
  const rows = await fetchSyncRows(ticketDetailPayload(ticketId), TICKET_DETAIL_KEY, silent);
  return rows[0] ?? null;
};

export const ticketTagsPayload = (repoId = null) =>
  buildSyncPayload({ configKey: TICKET_TAGS_KEY, repoId });

export const fetchTicketTags = (repoId = null, { silent = true } = {}) =>
  fetchSyncRows(ticketTagsPayload(repoId), TICKET_TAGS_KEY, silent);
