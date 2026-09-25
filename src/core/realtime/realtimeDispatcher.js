// realtimeDispatcher.js
//
// Design goal: adding a new real-time entity requires ONLY adding one config
// block to REALTIME_ENTITY_CONFIG.  No new handler functions, ever.
//
// Three update modes:
//   "queries"    → setQueriesData with a partial key prefix  (e.g. Ticket lists)
//   "query"      → setQueryData  with an exact key from the message  (e.g. Threads)
//   "invalidate" → invalidateQueries on an exact key  (payload too partial to merge)
//
// queryKeys is the single source of truth for all cache key construction.

import { masterKeys } from "../master/masterCall/masterKeys";
import { queryKeys } from "../query/queryKeys";
import { executeApi } from "../api/executor";
import { buildSyncPayload } from "../sync/buildSyncPayload";

// ─────────────────────────────────────────────────────────────────────────────
//  1.  MASTER BULK CACHE
//      Entity name → field name inside the bulk masterKeys cache object
//      Add one line here to support a new master-data entity.
// ─────────────────────────────────────────────────────────────────────────────
const MASTER_ENTITY_MAP = {
  RepoList: "RepoList",
  Project: "ProjectList",
  Employee: "EmployeeList",
  Label: "LabelMaster",
  Status: "StatusMaster",
  Team: "TeamMaster",
};

const MASTER_KEYS = Object.values(MASTER_ENTITY_MAP); // keeps it DRY

// ─────────────────────────────────────────────────────────────────────────────
//  2.  ENTITY CONFIG REGISTRY
//
//  Each entry describes WHAT to update and HOW to extract/wrap the list.
//  The generic engine below does all the actual work.
//
//  Config shape
//  ────────────
//  type: "queries"
//    queryKey    : Array  – partial prefix for setQueriesData (exact: false)
//    extractList : (oldData) => { list: T[], shape: string } | { list: null }
//    wrapList    : (oldData, updatedList, shape) => newCacheValue
//    sort        : "asc" | "desc"
//    scopeGuard? : (oldData, payload) => boolean   – return false to skip this cache entry
//
//  type: "query"
//    queryKey    : (message) => queryKey[]  – exact key resolved per-message
//    extractList : (oldData) => { list: T[], shape: string } | { list: null }
//    wrapList    : (oldData, updatedList, shape) => newCacheValue
//    sort        : "asc" | "desc"
//
//  type: "invalidate"
//    queryKey    : Array | (message) => queryKey[]  – key to invalidateQueries on
// ─────────────────────────────────────────────────────────────────────────────
const REALTIME_ENTITY_CONFIG = {
  // ── Ticket lists ────────────────────────────────────────────────────────────
  Ticket: {
    type: "queries",
    // Pull the prefix straight from queryKeys – if ticket.all ever changes, this follows.
    queryKey: [...queryKeys.ticket.all, "list"], // ["ticket","list"] – partial prefix

    sort: "desc",

    extractList: (data) => {
      if (Array.isArray(data)) return { list: data, shape: "array" };
      if (Array.isArray(data?.TicketsList?.Data))
        return { list: data.TicketsList.Data, shape: "ticketsList" };
      if (Array.isArray(data?.Data)) return { list: data.Data, shape: "data" };
      return { list: null, shape: null };
    },

    wrapList: (oldData, list, shape) => {
      if (shape === "array") return list;
      if (shape === "ticketsList")
        return {
          ...oldData,
          TicketsList: { ...oldData.TicketsList, Data: list },
        };
      return { ...oldData, Data: list };
    },

    // Don't push a Project-B ticket into a Project-A cached list
    scopeGuard: (oldData, payload) => {
      const extracted = safeExtract(
        oldData,
        REALTIME_ENTITY_CONFIG.Ticket.extractList,
      );
      const list = extracted.list;
      if (!list || list.length === 0) return true; // empty cache – always allow
      const sampleProject = normalize(
        getCI(list[0], "project") ?? getCI(list[0], "projectId"),
      );
      const payloadProject = normalize(
        getCI(payload, "project") ?? getCI(payload, "projectId"),
      );
      if (sampleProject && payloadProject && sampleProject !== payloadProject)
        return false;
      return true;
    },
  },

  // ── Ticket threads (comments) ───────────────────────────────────────────────
  ThreadsList: {
    type: "query",
    // Exact key resolved from the incoming message at runtime
    queryKey: (msg) => queryKeys.ticket.thread(
      msg.IssueId ?? msg.issueId ?? msg.Payload?.Issue_Id
  ),

    sort: "asc", // chronological

    extractList: (data) => {
      if (Array.isArray(data?.ThreadsList))
        return { list: data.ThreadsList, shape: "array" };
      if (Array.isArray(data?.ThreadsList?.Data))
        return { list: data.ThreadsList.Data, shape: "nested" };
      return { list: [], shape: "array" };
    },

    wrapList: (oldData, list) => ({ ...(oldData ?? {}), ThreadsList: list }),
  },

  // ── Ticket history ──────────────────────────────────────────────────────────
  TicketHistory: {
    type: "query",
    queryKey: (msg) => queryKeys.ticket.history(msg.IssueId ?? msg.issueId),

    sort: "asc",

    extractList: (data) => ({
      list: Array.isArray(data?.HistoryList) ? data.HistoryList : [],
      shape: "historyList",
    }),

    wrapList: (oldData, list) => ({ ...(oldData ?? {}), HistoryList: list }),
  },

  // ── Employee-scoped ticket list ─────────────────────────────────────────────
  TicketByEmployee: {
    type: "query",
    queryKey: (msg) =>
      queryKeys.ticket.byEmployee(msg.EmployeeId ?? msg.employeeId),

    sort: "desc",

    extractList: (data) => ({
      list: Array.isArray(data)
        ? data
        : Array.isArray(data?.Data)
          ? data.Data
          : [],
      shape: Array.isArray(data) ? "array" : "data",
    }),

    wrapList: (oldData, list, shape) =>
      shape === "array" ? list : { ...oldData, Data: list },
  },
  TicketProgress: {
    type: "query",

    queryKey: (msg) =>
      queryKeys.TicketProgress.list(
        msg.IssueId ?? msg.issueId ?? msg.Payload?.Issue_Id,
      ),

    sort: "desc",

    extractList: (data) => ({
      list: Array.isArray(data) ? data : data ? [data] : [],
      shape: Array.isArray(data) ? "array" : "single",
    }),

    wrapList: (_oldData, list, shape) =>
      shape === "array" ? list : (list[0] ?? null),
  },

  // ── Leave requests ───────────────────────────────────────────────────────
  // Backend only broadcasts a partial payload ({ID, EMPLOYEE_ID, STATUS}) —
  // not enough to merge a full row (fromDate/toDate/EmployeeName/etc. missing
  // on "Created"), so this just invalidates and lets useLeaveRequestMaster
  // refetch the real list instead of patching the cache in place.
  LeaveRequest: {
    type: "invalidate",
    queryKey: () => queryKeys.leaveRequest.list(),
  },

  MeetingData: {
    type: "query",
  
    queryKeys: (msg) => {
      const payload = msg.Payload ?? {};
  const parseParticipants =(val)=>{
    if(!val) return [];
    if(Array.isArray(val)) return val;
    try{
      return JSON.parse(val);
    }catch{
      return [];
    }
  };
  const internal = parseParticipants(payload.InternalParticipants);
  const client = parseParticipants(payload.ClientParticipants);
      const keys = [
        payload.Host_Id,
        ...(internal).map(x => x.Participant_Id),
        ...(client).map(x => x.Participant_Id),
      ]
        .filter(Boolean)
        .map(id => queryKeys.MeetingData.list(String(id).toLowerCase()));
        return keys;
    },
  
    sort: "desc",
    extractList: (data) => ({
      list: Array.isArray(data)
        ? data
        : Array.isArray(data?.Data)
          ? data.Data
          : [],
      shape: Array.isArray(data) ? "array" : "data",
    }),
  
    wrapList: (oldData, list, shape) =>
      shape === "array"
        ? list
        : { ...(oldData ?? {}), Data: list },
  },


};

// Backend EventCenter broadcasts use the sync config key as the entity name
// (e.g. "TicketsList" for TicketFactory.TicketUpdated), so map them onto the
// config that already knows how to patch that data.
const ENTITY_ALIASES = {
  TicketsList: "Ticket",
  ThreadList: "ThreadsList",
};

// ─────────────────────────────────────────────────────────────────────────────
//  2b. TICKET SCOPE
//      Any change to one of these entities can move data on the ticket thread
//      page (header status/%, tags, assignees, threads, reactions, history,
//      progress). Payloads are often partial, so rather than patching every
//      shape we refetch that ticket's per-ticket queries. Only queries that are
//      on screen refetch; the rest are just marked stale.
// ─────────────────────────────────────────────────────────────────────────────
const TICKET_SCOPED_ENTITIES = new Set([
  "Ticket",
  "TicketsList",
  "ThreadsList",
  "ThreadList",
  "TicketHistory",
  "TicketProgress",
  "TicketFeedback",
  "Emoji_Reactions",
]);

// Entities that change the ticket row itself (status, assignees, owner…), so
// the ticket may now belong to lists it wasn't in before.
const TICKET_ROW_ENTITIES = new Set(["Ticket", "TicketsList"]);

// ["ticket", <sub>, issueId] keys that hold one ticket's thread-page data.
// "detail" is not here: it holds a TicketsList row and is patched with the
// fresh row like every other list.
const TICKET_SUB_KEYS = new Set(["thread", "history", "feedbacks"]);

// Caches holding raw TicketsList rows, on any screen:
//   ["ticket","list",repo,project]   project / repo ticket lists
//   ["ticket","detail",id]           ticket thread page header
//   ["ticket","TicketsList",{…}]     per-employee list (meeting scheduler)
//   ["TicketsList",{…}]              API-filtered lists (dashboard My Tickets)
function isTicketRowCache([root, sub]) {
  if (root === "TicketsList") return true;
  return (
    root === queryKeys.ticket.all[0] &&
    (sub === "list" || sub === "detail" || sub === "TicketsList")
  );
}

// Screens built from ticket data in another shape (logged time, daily plan,
// stale tickets). They can't take a TicketsList row, so they refetch.
const TICKET_DERIVED_ROOTS = new Set([
  "TimeSheet",
  "DashBoardTimesheetData",
  "CheckedTickets",
  "GetStaleTicketsForAssignee",
]);
const TICKET_DERIVED_DASHBOARD_SUBS = new Set(["timesheet", "checkedTickets"]);

function isTicketDerivedCache([root, sub]) {
  if (TICKET_DERIVED_ROOTS.has(root)) return true;
  return (
    root === queryKeys.dashboard.all[0] &&
    TICKET_DERIVED_DASHBOARD_SUBS.has(sub)
  );
}

// One save fires several events (thread + ticket + progress) within a few ms;
// collapse them into a single refresh per ticket.
const TICKET_REFRESH_DELAY_MS = 250;
const pendingTicketRefresh = new Map(); // issueId → { timer, rowChanged }

function scheduleTicketRefresh(queryClient, issueId, rowChanged) {
  const pending = pendingTicketRefresh.get(issueId);
  clearTimeout(pending?.timer);
  const next = { rowChanged: rowChanged || !!pending?.rowChanged };
  next.timer = setTimeout(() => {
    pendingTicketRefresh.delete(issueId);
    refreshTicket(queryClient, issueId, next.rowChanged);
  }, TICKET_REFRESH_DELAY_MS);
  pendingTicketRefresh.set(issueId, next);
}

async function refreshTicket(queryClient, issueId, rowChanged) {
  // 1. Thread page: threads, reactions, history, feedbacks, progress
  queryClient.invalidateQueries({
    predicate: ({ queryKey: [root, sub, id] }) => {
      if (root === queryKeys.ticket.all[0] && TICKET_SUB_KEYS.has(sub))
        return normalize(id) === issueId;
      if (root === queryKeys.TicketProgress.all[0])
        return normalize(sub) === issueId;
      return false;
    },
  });

  // 2. Timesheet / checked / stale tickets
  scheduleDerivedRefresh(queryClient);

  // 3. Every ticket list + the detail header. Thread count, last thread,
  //    logged time, % and summary are computed server-side, so fetch this
  //    ticket's row once and swap it into every cached list that shows it.
  const rowCaches = queryClient
    .getQueryCache()
    .findAll({
      predicate: (q) =>
        q.state.data !== undefined && isTicketRowCache(q.queryKey),
    });
  if (rowCaches.length === 0) return;

  let freshRow;
  try {
    freshRow = await fetchTicketRow(issueId);
  } catch (err) {
    console.warn("[Realtime] Ticket row fetch failed, refetching lists:", err);
    freshRow = null;
  }

  rowCaches.forEach((q) => {
    const hasTicket = cacheHasTicket(q.state.data, issueId);
    if (hasTicket && freshRow) {
      queryClient.setQueryData(q.queryKey, (old) =>
        replaceTicketRow(old, issueId, freshRow),
      );
    } else if (hasTicket) {
      // No row (fetch failed, deleted, or no longer visible) — let the list
      // itself decide rather than dropping the ticket on a guess
      queryClient.invalidateQueries({ queryKey: q.queryKey, exact: true });
    } else if (freshRow && rowChanged && q.queryKey[1] !== "detail") {
      // New ticket, or reassigned into this list's scope — only the server
      // knows which filtered lists it belongs to now
      queryClient.invalidateQueries({ queryKey: q.queryKey, exact: true });
    }
  });
}

// Many tickets changing at once must not refetch these screens per ticket
const DERIVED_REFRESH_DELAY_MS = 1000;
let pendingDerivedRefresh = null;

function scheduleDerivedRefresh(queryClient) {
  if (pendingDerivedRefresh) return;
  pendingDerivedRefresh = setTimeout(() => {
    pendingDerivedRefresh = null;
    queryClient.invalidateQueries({
      predicate: (q) => isTicketDerivedCache(q.queryKey),
    });
  }, DERIVED_REFRESH_DELAY_MS);
}

// This user's current view of one ticket (row visibility is role-aware on
// the server, so the broadcast payload — built for the sender — isn't used).
// Resolves to null when the ticket is gone or no longer visible.
async function fetchTicketRow(issueId) {
  const res = await executeApi({
    url: "/sync/v2",
    method: "POST",
    payload: buildSyncPayload({
      configKey: "TicketsList",
      idKey: "IssueId",
      idValue: issueId,
    }),
    config: { _silent: true },
  });
  const section = res?.Res?.TicketsList ?? res?.TicketsList;
  const rows = Array.isArray(section) ? section : section?.Data;
  if (!Array.isArray(rows)) throw new Error("Unexpected TicketsList response");
  return rows.find((r) => normalize(getCI(r, "Issue_Id")) === issueId) ?? null;
}

function cacheHasTicket(data, issueId) {
  const { list } = safeExtract(data, REALTIME_ENTITY_CONFIG.Ticket.extractList);
  return !!list?.some((r) => normalize(getCI(r, "Issue_Id")) === issueId);
}

function replaceTicketRow(data, issueId, row) {
  const { extractList, wrapList } = REALTIME_ENTITY_CONFIG.Ticket;
  const { list, shape } = safeExtract(data, extractList);
  if (!list) return data;
  const updated = list.map((r) =>
    normalize(getCI(r, "Issue_Id")) === issueId ? row : r,
  );
  return wrapList(data, updated, shape);
}

// The Ticket config patches the project/repo lists (["ticket","list",…])
// straight from the broadcast. Give every other screen's copy of this ticket
// (dashboard, detail header, per-employee list) the same immediate patch, so
// no screen waits on the row fetch. Rows only — which filtered lists a new
// ticket belongs to is refreshTicket's call.
function patchOtherTicketRowCaches(queryClient, action, payload, keyField) {
  if (action !== "Update" && action !== "Delete") return;
  const issueId = normalize(getKeyValue(payload, keyField));
  if (!issueId) return;
  const { extractList, wrapList } = REALTIME_ENTITY_CONFIG.Ticket;

  queryClient
    .getQueryCache()
    .findAll({
      predicate: (q) =>
        q.state.data !== undefined &&
        isTicketRowCache(q.queryKey) &&
        !isProjectTicketList(q.queryKey) &&
        cacheHasTicket(q.state.data, issueId),
    })
    .forEach((q) =>
      queryClient.setQueryData(q.queryKey, (old) => {
        const { list, shape } = safeExtract(old, extractList);
        if (!list) return old;
        return wrapList(
          old,
          applyAction(list, action, payload, keyField, "desc"),
          shape,
        );
      }),
    );
}

function isProjectTicketList([root, sub]) {
  return root === queryKeys.ticket.all[0] && sub === "list";
}

function resolveIssueId(message, payload) {
  return normalize(
    message.IssueId ??
      message.issueId ??
      getCI(payload, "Issue_Id") ??
      getCI(payload, "IssueId") ??
      getCI(payload, "IssuesId"),
  );
}

// "TICKET_UPDATED" / "Created" / "Update" → "Update" / "Create" / ...
function normalizeAction(action) {
  const a = String(action).toLowerCase();
  if (a.includes("delete") || a.includes("remove")) return "Delete";
  if (a.includes("create") || a.includes("add")) return "Create";
  if (a.includes("update") || a.includes("change") || a.includes("edit"))
    return "Update";
  return action;
}

// ─────────────────────────────────────────────────────────────────────────────
//  3.  PUBLIC ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────
export const handleRealtimeMessage = (queryClient, message) => {
  const rawEntity = message.Entity ?? message.entity;
  const entity = ENTITY_ALIASES[rawEntity] ?? rawEntity;
  const rawAction = message.Action ?? message.action;
  const action = rawAction && normalizeAction(rawAction);
  const payload = message.Payload ?? message.payload;
  const keyField = message.KeyField ?? message.keyField;
  if (!entity || !action || !payload || !keyField) {
    console.warn("[Realtime] Dropped invalid message:", message);
    return;
  }

  // 1. Update the master bulk cache
  if (entity in MASTER_ENTITY_MAP) {
    updateMasterCache(queryClient, entity, action, payload, keyField);
  }

  // 2. Update the dedicated query cache (fully config-driven, no if/switch)
  const config = REALTIME_ENTITY_CONFIG[entity];
  if (config) {
    applyEntityConfig(queryClient, config, action, payload, keyField, message);
  }
  if (entity === "Ticket") {
    patchOtherTicketRowCaches(queryClient, action, payload, keyField);
  }

  // 3. Refresh everything the ticket thread page shows for this ticket
  if (TICKET_SCOPED_ENTITIES.has(rawEntity) || TICKET_SCOPED_ENTITIES.has(entity)) {
    const issueId = resolveIssueId(message, payload);
    const rowChanged =
      TICKET_ROW_ENTITIES.has(rawEntity) || TICKET_ROW_ENTITIES.has(entity);
    if (issueId) scheduleTicketRefresh(queryClient, issueId, rowChanged);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  4.  GENERIC QUERY ENGINE  (processes ALL entity types – never edit this)
// ─────────────────────────────────────────────────────────────────────────────
function applyEntityConfig(
  queryClient,
  config,
  action,
  payload,
  keyField,
  message,
) {
  // Simplest mode: no cache merging — just invalidate so the query refetches.
  // Use this when the broadcast payload is too partial to patch a full row.
  if (config.type === "invalidate") {
    const key =
      typeof config.queryKey === "function"
        ? config.queryKey(message)
        : config.queryKey;
    if (key)
      queryClient.invalidateQueries({ queryKey: key, refetchType: "all" });
    return;
  }

  const updater = (oldData) => {
    
    if (config.scopeGuard && !config.scopeGuard(oldData, payload))
      return oldData;

    const { list, shape } = safeExtract(oldData, config.extractList);
    if (!list) return oldData;

    const updatedList = applyAction(
      list,
      action,
      payload,
      keyField,
      config.sort,
    );
    return config.wrapList(oldData, updatedList, shape);
  };

  if (config.type === "queries") {
    // Partial prefix → hits every cached list that starts with this prefix
    queryClient.setQueriesData(
      { queryKey: config.queryKey, exact: false },
      updater,
    );
  } else if (config.type === "query") {
    // Exact key(s) derived from the message payload
    const keys = config.queryKeys
      ? config.queryKeys(message) || []
      : [config.queryKey(message)];
    keys.forEach((key) => {
      if (!key) return;
      // Only patch caches that were actually fetched. Seeding an uncached key
      // would leave a one-row list that the page then trusts until staleTime.
      findCachedKeys(queryClient, key).forEach((cachedKey) =>
        queryClient.setQueryData(cachedKey, updater),
      );
    });
  }
}

// Cached query keys equal to `key`, ignoring id casing (GUIDs from the URL and
// from the server don't always agree on upper/lower case)
function findCachedKeys(queryClient, key) {
  const target = key.map(normalizeKeyPart);
  return queryClient
    .getQueryCache()
    .findAll({
      predicate: (q) =>
        q.state.data !== undefined &&
        q.queryKey.length === target.length &&
        q.queryKey.every((part, i) => normalizeKeyPart(part) === target[i]),
    })
    .map((q) => q.queryKey);
}

function normalizeKeyPart(part) {
  return normalize(
    part !== null && typeof part === "object" ? JSON.stringify(part) : part,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  5.  MASTER CACHE UPDATER
// ─────────────────────────────────────────────────────────────────────────────
function updateMasterCache(queryClient, entity, action, payload, keyField) {
  const listField = MASTER_ENTITY_MAP[entity];

  queryClient.setQueryData(masterKeys.multi(MASTER_KEYS), (oldData) => {
    if (!oldData || !(listField in oldData)) return oldData;
    const updated = applyAction(
      oldData[listField],
      action,
      payload,
      keyField,
      "desc",
    );
    return { ...oldData, [listField]: updated };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  6.  PURE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function safeExtract(data, extractFn) {
  try {
    return extractFn(data) ?? { list: null, shape: null };
  } catch {
    return { list: null, shape: null };
  }
}

function applyAction(list, action, payload, keyField, sortDir) {
  if (!Array.isArray(list)) return [];
  const targetVal = normalize(getKeyValue(payload, keyField));
  // No id → matching would hit every row whose id is also missing
  if (!targetVal) return list;
  const match = (x) => normalize(getKeyValue(x, keyField)) === targetVal;
  const formatted = list.length > 0 ? syncCasing(payload, list[0]) : payload;

  let result;
  if (action === "Create")
    // Upsert: the same row can arrive again (or as "..._ADDED"), keep it fresh
    result = list.some(match)
      ? list.map((x) => (match(x) ? { ...x, ...formatted } : x))
      : [formatted, ...list];
  else if (action === "Update")
    result = list.map((x) => (match(x) ? { ...x, ...formatted } : x));
  else if (action === "Delete") result = list.filter((x) => !match(x));
  else result = list;

  return sortByUpdatedAt(result, sortDir);
}

function getCI(obj, key) {
  if (!obj || !key) return undefined;
  const k = Object.keys(obj).find((k) => k.toLowerCase() === key.toLowerCase());
  return k ? obj[k] : undefined;
}

// KeyField and row fields don't always agree on underscores
// (EventCenter sends KeyField "IssueId" for rows keyed "Issue_Id")
function getKeyValue(obj, keyField) {
  const direct = getCI(obj, keyField);
  if (direct !== undefined || !obj || !keyField) return direct;
  const bare = keyField.replace(/_/g, "").toLowerCase();
  const k = Object.keys(obj).find(
    (k) => k.replace(/_/g, "").toLowerCase() === bare,
  );
  return k ? obj[k] : undefined;
}

function syncCasing(source, reference) {
  if (!reference) return source;
  const out = {};
  for (const key of Object.keys(source)) {
    const refKey = Object.keys(reference).find(
      (k) => k.toLowerCase() === key.toLowerCase(),
    );
    out[refKey ?? key] = source[key];
  }
  return out;
}

function normalize(val) {
  return val == null ? "" : String(val).trim().toLowerCase();
}

function sortByUpdatedAt(list, direction = "desc") {
  return [...list].sort((a, b) => {
    const tA = getCI(a, "UpdatedAt")
      ? new Date(getCI(a, "UpdatedAt")).getTime()
      : 0;
    const tB = getCI(b, "UpdatedAt")
      ? new Date(getCI(b, "UpdatedAt")).getTime()
      : 0;
    return direction === "asc" ? tA - tB : tB - tA;
  });
}
