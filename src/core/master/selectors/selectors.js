// src/core/master/selectors/selectors.js
//
// All master selectors live here.
// Components import from this file only — never from useMasterItem directly.

import { useMasterFilter, useMasterFind, useMasterList } from "../useMasterItem";

// ─── Find helpers ─────────────────────────────────────────────────────────────
export const useEmployeeById   = (id)   => useMasterFind("employee", "id",   id);
export const useEmployeeByName = (name) => useMasterFind("employee", "name", name);
export const useRepoById       = (id)   => useMasterFind("repo",     "id",   id);
export const useRepoByKey      = (key)  => useMasterFind("repo",     "key",  key);
export const useProjectById    = (id)   => useMasterFind("project",  "id",   id);
export const useProjectMaster  = ()      => useMasterList("project");
export const useTicketMaster  = ()      => useMasterList("ticket");
// ─── Filter helpers ───────────────────────────────────────────────────────────
export const useActiveEmployees  = ()    => useMasterFilter("employee", (e) => e.isActive);
export const useProjectsByRepoId = (rid) => useMasterFilter("project",  (p) => p.repoId === rid);

// ─── Options builder (for dropdowns / selects) ────────────────────────────────
//
// params:
//   masterKey     → registry key
//   valueShape    → "simple"  returns item[valueKey]  (just the id)
//                   "object"  returns { id, name }    (default)
//   filterFn      → optional predicate to narrow the list
//   prependOption → optional item added at index 0   e.g. { label: "All", value: "" }
//   labelKey      → field to use as option label  (default: "name")
//   valueKey      → field to use as option value  (default: "id")

export const useMasterOptions = ({
  masterKey,
  valueShape    = "object",
  filterFn      = null,
  prependOption = null,
  labelKey      = "name",
  valueKey      = "id",
}) => {
  const list     = useMasterList(masterKey);
  const filtered = filterFn ? list.filter(filterFn) : list;

  const options = filtered.map((item) => ({
    label: item[labelKey],
    value:
      valueShape === "simple"
        ? item[valueKey]
        : { id: item[valueKey], name: item[labelKey] },
  }));

  return prependOption ? [prependOption, ...options] : options;
};

// ─── Predefined option shortcuts ─────────────────────────────────────────────
export const useEmployeeOptions = (includeAll = false, overrides = {}) =>
  useMasterOptions({
    masterKey:     "employee",
    filterFn:      (e) => e.isActive,
    prependOption: includeAll ? { label: "All Employees", value: "" } : null,
    valueShape:    "simple", // 👈 This is the default
    ...overrides,            // 👈 Anything passed from the component will override the lines above
  });

export const useRepoOptions = (includeAll = false) =>
  useMasterOptions({
    masterKey:     "repo",
    valueShape:    "simple",
    prependOption: includeAll ? { label: "All Repositories", value: "" } : null,
  });

export const useProjectOptions = (includeAll = false) =>
  useMasterOptions({
    masterKey:     "project",
    valueShape:    "simple",
    prependOption: includeAll ? { label: "All Projects",     value: "" } : null,
  });

export const useLabelOptions = (includeAll = false) =>
  useMasterOptions({
    masterKey:     "label",
    valueShape:    "simple",
    prependOption: includeAll ? { label: "All Labels",       value: "" } : null,
  });

export const useTeamOptions = (includeAll = false) =>
  useMasterOptions({
    masterKey:     "team",
    valueShape:    "simple",
    prependOption: includeAll ? { label: "All Teams",        value: "" } : null,
  });

export const useTicketStatusOptions = (includeAll = false) =>
  useMasterOptions({
    masterKey:     "ticketStatus",
    valueShape:    "simple",
    prependOption: includeAll ? { label: "All Statuses",     value: "" } : null,
  });

export const useDepartmentOptions = (includeAll = false) =>
  useMasterOptions({
    masterKey:     "department",
    valueShape:    "simple",
    prependOption: includeAll ? { label: "All Departments",  value: "" } : null,
  });