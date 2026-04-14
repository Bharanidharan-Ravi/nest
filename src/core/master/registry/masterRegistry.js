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

export const MASTER_REGISTRY = {

  // ── Masters from the bulk /sync/v2 preload ────────────────────────────────
  employee: {
    source:    "masterData",
    masterKey: "EmployeeList",
    adapter:   formatEmployee,
  },
  repo: {
    source:    "masterData",
    masterKey: "RepoList",
    adapter:   formatRepo,
  },
  project: {
    source:    "masterData",
    masterKey: "ProjectList",
    adapter:   formatProject,
  },
  label: {
    source:    "masterData",
    masterKey: "LabelMaster",
    adapter:   formatLabel,
  },
  team: {
    source:    "masterData",
    masterKey: "TeamMaster",
    adapter:   formatTeam,
  },

  // ── Masters with their own endpoint ──────────────────────────────────────
  // These go through useRegistryQuery → useApiQuery → executeApi
  ticketStatus: {
    source:    "api",
    queryKey:  () => ["master", "ticketStatus"],
    url:       "/Status/GetAll",
    method:    "GET",
    staleTime: Infinity,
    adapter:   (raw) => ({ id: raw.StatusId, name: raw.StatusName }),
  },
  department: {
    source:    "api",
    queryKey:  () => ["master", "departments"],
    url:       "/Dept/List",
    method:    "GET",
    staleTime: Infinity,
    adapter:   (raw) => ({ id: raw.DeptCode, name: raw.DeptName }),
  },

};