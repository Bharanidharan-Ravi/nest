// Instant first paint for the paged ticket list (stale-while-revalidate).
//
// When a filter / tab / sort has no cached page yet, the rows already loaded
// for other filters (any ["ticket","page",…] cache in the same repo scope)
// are filtered and sorted here the way GetTicketList_V2 does it, and shown at
// once. The real request runs in parallel and replaces them silently.
//
// The preview can only miss rows (it sees just what was loaded before), never
// show a row the server wouldn't: a filter key not handled here makes the
// preview empty, and the caller then keeps the previous list.
// Mirrors the 'F' / 'S' rows of dbo.TicketListQueryDef
// (scripts/ticket_v2_list_sp.sql) — add a key here when adding one there.

import { queryKeys } from "../../../core/query/queryKeys";

const lower = (v) => String(v ?? "").toLowerCase();
const splitIds = (csv) => (csv ? lower(csv).split(",").filter(Boolean) : []);
const toTime = (v) => (v ? new Date(v).getTime() : null);
const anyIn = (rowValues, values) => rowValues.some((v) => values.has(v));

const FLAG_FIELDS = {
  isCloseRequested: "IsCloseRequested",
  priorityRequest: "PriorityRequest",
  funcResponse: "FuncResponse",
  webResponse: "WebResponse",
  technicalResponse: "TechnicalResponse",
  adminResponse: "AdminResponse",
  raiseToClient: "RaiseToClient",
};

const BATTERY = {
  "0-20": (p) => p >= 0 && p <= 20,
  "21-40": (p) => p > 20 && p <= 40,
  "41-60": (p) => p > 40 && p <= 60,
  "61-80": (p) => p > 60 && p <= 80,
  "81-100": (p) => p > 80 && p <= 100,
};

// key → (row, Set<lower-case value>, ctx) => bool
const FILTERS = {
  issue: (row, v) => v.has(lower(row.Issue_Id)),
  repo: (row, v) => v.has(lower(row.RepoId)),
  project: (row, v) => v.has(lower(row.Project_Id)),
  status: (row, v) => v.has(lower(row.StatusId)),
  priority: (row, v) => v.has(lower(row.Priority)),
  label: (row, v) => anyIn(splitIds(row.Label_Ids), v),
  owner: (row, v) =>
    row.Assignee_Id ? v.has(lower(row.Assignee_Id)) : v.has("__no_owner__"),
  assignee: (row, v) =>
    anyIn(splitIds(row.Assignee_Ids), v) || anyIn(splitIds(row.Handler_Ids), v),
  team: (row, v, { lookup }) =>
    v.has(lower(lookup.get("employee", row.Assignee_Id)?.Team)),
  // Handler_Ids already has the empty guid for a NULL Move_to
  handler: (row, v) => anyIn(splitIds(row.Handler_Ids), v),
  member: (row, v) =>
    v.has(lower(row.Assignee_Id)) ||
    v.has(lower(row.CreatedBy)) ||
    anyIn(splitIds(row.Assignee_Ids), v),
  flag: (row, v) =>
    Object.entries(FLAG_FIELDS).some(
      ([flag, field]) => row[field] && (v.has(lower(flag)) || v.has("allflags")),
    ),
  battery: (row, v) =>
    [...v].some((bucket) => BATTERY[bucket]?.(row.OverallPercentage ?? 0)),
  search: (row, v) =>
    [...v].some(
      (term) => lower(row.Issue_Code).includes(term) || lower(row.Title).includes(term),
    ),
};

const dueBucket = (order) => (row) => {
  if (!row.Due_Date) return 9;
  const due = new Date(row.Due_Date).setHours(0, 0, 0, 0);
  const today = new Date().setHours(0, 0, 0, 0);
  const bucket = due < today ? "overdue" : due === today ? "today" : "upcoming";
  return order.indexOf(bucket) + 1;
};

// key → (row, ctx) => sortable value (null sorts first ASC, last DESC, as SQL)
const SORTS = {
  flagsFirst: (row, { userId }) =>
    (row.IsCloseRequested && lower(row.Assignee_Id) === lower(userId)) ||
    row.PriorityRequest ||
    row.FuncResponse ||
    row.WebResponse ||
    row.TechnicalResponse ||
    row.AdminResponse
      ? 1
      : 0,
  updatedAt: (row) => toTime(row.UpdatedAt),
  createdAt: (row) => toTime(row.CreatedAt),
  dueDate: (row) => toTime(row.Due_Date),
  priority: (row) => row.Priority ?? null,
  title: (row) => row.Title ?? null,
  // SP sorts by SiNo; the number in the code follows it
  code: (row) => Number(String(row.Issue_Code ?? "").match(/(\d+)\D*$/)?.[1] ?? 0),
  battery: (row) => row.OverallPercentage ?? 0,
  consumed: (row) => row.TotalConsumeMinutes ?? null,
  threads: (row) => row.ThreadCount ?? 0,
  dueOverdueFirst: dueBucket(["overdue", "today", "upcoming"]),
  dueTodayFirst: dueBucket(["today", "overdue", "upcoming"]),
  dueUpcomingFirst: dueBucket(["upcoming", "today", "overdue"]),
};

const compareValues = (a, b) => {
  if (a === b) return 0;
  if (a === null || a === undefined) return -1;
  if (b === null || b === undefined) return 1;
  return typeof a === "string" ? a.localeCompare(b) : a < b ? -1 : 1;
};

const buildComparator = (sort, ctx) => {
  const parts = (sort ?? [])
    .filter((s) => SORTS[s.key])
    .map((s) => ({ fn: SORTS[s.key], sign: lower(s.dir) === "desc" ? -1 : 1 }));
  return (a, b) => {
    for (const { fn, sign } of parts) {
      const diff = compareValues(fn(a, ctx), fn(b, ctx));
      if (diff) return diff * sign;
    }
    return compareValues(lower(a.Issue_Id), lower(b.Issue_Id));
  };
};

/** Raw TicketListV2 rows of every cached page in this repo scope, newest cache first, one per ticket. */
const cachedRows = (queryClient, repoId) => {
  const seen = new Map();
  queryClient
    .getQueryCache()
    .findAll({ queryKey: [...queryKeys.ticket.all, "page"] })
    .filter((q) => q.state.data && (q.queryKey[2]?.repoId ?? null) === repoId)
    .sort((a, b) => b.state.dataUpdatedAt - a.state.dataUpdatedAt)
    .forEach((q) =>
      q.state.data.pages.flat().forEach((row) => {
        const id = lower(row.Issue_Id);
        if (!seen.has(id)) seen.set(id, row);
      }),
    );
  return [...seen.values()];
};

/**
 * Infinite-query shaped preview ({ pages: [rows], pageParams: [1] }) for
 * { repoId, f, sort, size }, or undefined when nothing can be shown.
 */
export function buildTicketListPreview(queryClient, { repoId, f, sort, size }, ctx) {
  const entries = Object.entries(f ?? {});
  if (entries.some(([key]) => !FILTERS[key])) return undefined;

  const checks = entries.map(([key, values]) => [FILTERS[key], new Set(values.map(lower))]);
  const rows = cachedRows(queryClient, repoId)
    .filter((row) => checks.every(([check, values]) => check(row, values, ctx)))
    .sort(buildComparator(sort, ctx))
    .slice(0, size);

  return rows.length ? { pages: [rows], pageParams: [1] } : undefined;
}
