// src/core/master/registry/masterRegistry.js
//
// ┌──────────────────────────────────────────────────────────────────────────┐
// │  SINGLE SOURCE OF TRUTH for all master data.                             │
// │                                                                          │
// │  source: "masterData" → data comes from the preloaded bulk cache         │
// │  source: "api"        → has its own dedicated endpoint                   │
// │                                                                          │
// │  To add a new master: add one entry here + one line in selectors.js      │
// └──────────────────────────────────────────────────────────────────────────┘

import { executeApi } from "../../api/executor";
import {
  formatEmployee,
  formatRepo,
  formatProject,
  formatLabel,
  formatTeam,
} from "../../adapters/masterAdapter";
import { queryKeys } from "../../query/queryKeys";
import { buildSyncPayload } from "../../sync/buildSyncPayload";

export const MASTER_REGISTRY = {
  // ── Masters from the bulk /sync/v2 preload ────────────────────────────────
  employee: {
    source: "masterData",
    masterKey: "EmployeeList",
    adapter: formatEmployee,
  },
  repo: {
    source: "masterData",
    masterKey: "RepoList",
    adapter: formatRepo,
  },
  project: {
    source: "masterData",
    masterKey: "ProjectList",
    adapter: formatProject,
  },
  label: {
    source: "masterData",
    masterKey: "LabelMaster",
    adapter: formatLabel,
  },
  team: {
    source: "masterData",
    masterKey: "TeamMaster",
    adapter: formatTeam,
  },
  ticketProgress: {
    // Make sure this matches the key your sync API returns (e.g., "TicketProgressList")
    source: "TicketProgress",

    url: "/sync/v2",
    method: "POST",

    // 1. Change queryKey to a function so it caches per-ticket
    queryKey: (params) => ["TicketProgress", params?.issueId],

    // 2. Build the complex payload here! Hides it from the UI.
    payload: (params) => buildSyncPayload({
          configKey: "TicketProgress",
          idKey: "IssueId",
          idValue: params?.issueId ,
        }),
    //   ({
    //   configKey: "TicketProgressLogs", // Change this to your C# ConfigKey
    //   syncParams: { IssueId: params?.issueId },
    // }),

    // 3. Remove formatTeam (unless you actually wanted team formatting here)
    adapter: (raw) => raw,
  },

  // ── Masters with their own endpoint ──────────────────────────────────────
  // These go through useRegistryQuery → useApiQuery → executeApi
  ticketStatus: {
    source: "api",
    queryKey: () => ["master", "ticketStatus"],
    url: "/Status/GetAll",
    method: "GET",
    staleTime: Infinity,
    adapter: (raw) => ({ id: raw.StatusId, name: raw.StatusName }),
  },
  department: {
    source: "api",
    queryKey: () => ["master", "departments"],
    url: "/Dept/List",
    method: "GET",
    staleTime: Infinity,
    adapter: (raw) => ({ id: raw.DeptCode, name: raw.DeptName }),
  },
};
