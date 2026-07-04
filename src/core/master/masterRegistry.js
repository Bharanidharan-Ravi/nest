// src/core/master/masterRegistry.js
import { formatEmployee, formatTeam } from "../adapters/masterAdapter";
import { formatRepo } from "../adapters/masterAdapter";
import { formatProject } from "../adapters/masterAdapter";
import { formatLabel } from "../adapters/masterAdapter";
import { executeApi } from "../api/executor";

export const MASTER_REGISTRY = {

  // ─── Masters that come from the sync/masterData endpoint ───────────────
  employee: {
    source: "masterData",       // lives inside the global master payload
    masterKey: "EmployeeList",  // key inside masterData object
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

  // ─── Masters from SEPARATE APIs ─────────────────────────────────────────
  // These don't live in masterData at all — they have their own endpoint.
  // buildOptionsResolver handles them the exact same way as masterData ones.
  ticketStatus: {
    source: "api",
    queryKey: ["master", "ticketStatus"],
    queryFn: () => executeApi({ url: "/Status/GetAll", method: "GET" }),
    adapter: (raw) => ({ id: raw.StatusId, name: raw.StatusName }),
  },
  department: {
    source: "api",
    queryKey: ["master", "departments"],
    queryFn: () => executeApi({ url: "/Dept/List", method: "GET" }),
    adapter: (raw) => ({ id: raw.DeptCode, name: raw.DeptName }),
  },
};