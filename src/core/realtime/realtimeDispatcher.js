// realtimeDispatcher.js
//
// Design goal: adding a new real-time entity requires ONLY adding one config
// block to REALTIME_ENTITY_CONFIG.  No new handler functions, ever.
//
// Two update modes:
//   "queries" → setQueriesData with a partial key prefix  (e.g. Ticket lists)
//   "query"   → setQueryData  with an exact key from the message  (e.g. Threads)
//
// queryKeys is the single source of truth for all cache key construction.

import { masterKeys } from "../master/masterCall/masterKeys";
import { queryKeys } from "../query/queryKeys";

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
    queryKey: (msg) => queryKeys.ticket.thread(msg.IssueId ?? msg.issueId),

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
  // ─────────────────────────────────────────────────────────────────────────
  //  ADDING A NEW ENTITY IN THE FUTURE
  //  Copy-paste one of the blocks below, fill in the queryKey and list shape.
  //  That's it.  No new functions, no edits anywhere else.
  // ─────────────────────────────────────────────────────────────────────────

  // DailyPlan: {
  //   type: "queries",
  //   queryKey: [...queryKeys.dailyPlan.all, "list"],
  //   sort: "desc",
  //   extractList: (data) => ({
  //     list: Array.isArray(data) ? data : (data?.Data ?? []),
  //     shape: Array.isArray(data) ? "array" : "data",
  //   }),
  //   wrapList: (oldData, list, shape) =>
  //     shape === "array" ? list : { ...oldData, Data: list },
  // },

  // Sprint: {
  //   type: "queries",
  //   queryKey: [...queryKeys.sprint.all, "list"],
  //   sort: "desc",
  //   extractList: (data) => ({ list: Array.isArray(data) ? data : [], shape: "array" }),
  //   wrapList: (_oldData, list) => list,
  // },

  // WorkStream: {
  //   type: "query",
  //   queryKey: (msg) => queryKeys.workStream.detail(msg.WorkStreamId ?? msg.workStreamId),
  //   sort: "asc",
  //   extractList: (data) => ({ list: data?.Items ?? [], shape: "items" }),
  //   wrapList: (oldData, list) => ({ ...oldData, Items: list }),
  // },
};

// ─────────────────────────────────────────────────────────────────────────────
//  3.  PUBLIC ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────
export const handleRealtimeMessage = (queryClient, message) => {
  const entity = message.Entity ?? message.entity;
  const action = message.Action ?? message.action;
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
    // Exact key derived from the message payload
    const key = config.queryKey(message);
    if (key) queryClient.setQueryData(key, updater);
  }
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
  console.log("oldData :", list, action, payload, keyField, sortDir);
  if (!Array.isArray(list)) return [];
  const targetVal = normalize(getCI(payload, keyField));
  const match = (x) => normalize(getCI(x, keyField)) === targetVal;
  const formatted = list.length > 0 ? syncCasing(payload, list[0]) : payload;

  let result;
  if (action === "Create")
    result = list.some(match) ? list : [formatted, ...list];
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
