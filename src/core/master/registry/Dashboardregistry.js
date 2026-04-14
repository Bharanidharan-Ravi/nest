// src/core/master/registry/dashboardRegistry.js
//
// ┌──────────────────────────────────────────────────────────────────────────┐
// │  SINGLE SOURCE OF TRUTH for all Dashboard API calls.                     │
// │                                                                          │
// │  DASHBOARD_REGISTRY  → read queries   (useRegistryQuery)                 │
// │  DASHBOARD_MUTATIONS → write actions  (useRegistryMutation)              │
// │                                                                          │
// │  To add a new query    → add entry to DASHBOARD_REGISTRY                 │
// │  To add a new mutation → add entry to DASHBOARD_MUTATIONS                │
// │  Then expose it in dashboardSelectors.js  (one line)                     │
// └──────────────────────────────────────────────────────────────────────────┘

// ─── Read queries ─────────────────────────────────────────────────────────────
//
// Entry shape:
//   queryKey  : (params) => [...]
//   url       : string
//   method    : "GET" | "POST"
//   payload   : (params) => {}        (omit for GET)
//   source    : string                key to extract from sync/v2 envelope
//   staleTime : ms
//   enabled   : (params) => bool
//   adapter   : (row) => {}           optional per-row transform

export const DASHBOARD_REGISTRY = {

  timesheet: {
    queryKey: ({ employeeId, fromDate, toDate }) => [
      "dashboard", "timesheet",
      employeeId ?? "none",
      fromDate   ?? "none",
      toDate     ?? "none",
    ],
    url:    "/sync/v2",
    method: "POST",
    payload: ({ employeeId, fromDate, toDate }) => ({
      ConfigKeys: ["TimeSheet"],
      Params: {
        TimeSheet: {
          EmployeeID: employeeId,
          FromDate:   fromDate,
          ToDate:     toDate,
        },
      },
    }),
    source:    "TimeSheet",
    staleTime: 0,
    enabled:   ({ fromDate, toDate }) => !!fromDate && !!toDate,
    adapter:   (item) => item,         // transform rows here when needed
  },

  checkedTickets: {
    queryKey: ({ employeeId, planDate }) => [
      "dashboard", "checkedTickets",
      employeeId ?? "none",
      planDate   ?? "none",
    ],
    url:    "/sync/v2",
    method: "POST",
    payload: ({ employeeId, planDate }) => ({
      ConfigKeys: ["CheckedTickets"],
      Params: {
        CheckedTickets: {
          userId:   employeeId,
          planDate: planDate,
        },
      },
    }),
    source:    "CheckedTickets",
    staleTime: 0,
    enabled:   ({ employeeId, planDate }) => !!employeeId && !!planDate,
    adapter:   (item) => item,
  },

  // ── Add future queries here ───────────────────────────────────────────────
  // sprintSummary: { ... }
  // teamWorkload:  { ... }

};

// ─── Write mutations ──────────────────────────────────────────────────────────
//
// Entry shape:
//   url    : string | (urlParams) => string   static or dynamic
//   method : "POST" | "PATCH" | "PUT" | "DELETE"
//   note   : description (for onboarding / code search)

export const DASHBOARD_MUTATIONS = {

  commitCheckedTicket: {
    url:    "/dailyplan",
    method: "POST",
    note:   "Saves a checked ticket into the daily plan",
  },

  uncheckCheckedTicket: {
    url:    ({ planId }) => `/dailyplan/${planId}/uncheck`,
    method: "PATCH",
    note:   "Reverts a previously checked ticket",
  },

  // ── Add future mutations here ─────────────────────────────────────────────
  // deleteDailyPlan: { url: ({ planId }) => `/dailyplan/${planId}`, method: "DELETE" }

};