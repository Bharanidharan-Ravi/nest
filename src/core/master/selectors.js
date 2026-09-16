// src/core/master/selectors.js  — just convenience wrappers, no logic here

import { useMasterFilter, useMasterFind, useMasterList } from "./useMasterItem";

export const useEmployeeById = (id) => useMasterFind("employee", "id", id);
export const useEmployeeByName = (name) =>
  useMasterFind("employee", "name", name);
export const useActiveEmployees = () =>
  useMasterFilter("employee", (e) => e.isActive);
export const useRepoById = (id) => useMasterFind("repo", "id", id);
export const useRepoByKey = (key) => useMasterFind("repo", "key", key);
export const useProjectsByRepoId = (rid) =>
  useMasterFilter("project", (p) => p.repoId === rid);
export const useProjectById = (id) => useMasterFind("project", "id", id);

// selectors.js — just a formatter on top of useMasterList
export const useMasterOptions = ({
  masterKey,
  valueShape = "object", // "simple" | "object"
  filterFn = null,
  prependOption = null,
  labelKey = "name",
  valueKey = "id",
}) => {
  const list = useMasterList(masterKey); // ← handles everything internally

  const filtered = filterFn ? list.filter(filterFn) : list;
  console.log("list :", list, filtered);

  const options = filtered.map((item) => ({
    label: item[labelKey],
    value:
      valueShape === "simple"
        ? item[valueKey]
        : { id: item[valueKey], name: item[labelKey] },
  }));

  return prependOption ? [prependOption, ...options] : options;
};

// ─── Predefined shortcuts ─────────────────────────────────────────────
export const useEmployeeOptions = (includeAll = false) =>
  useMasterOptions({
    masterKey: "employee",
    valueShape: "simple",
    filterFn: (e) => e.isActive,
    prependOption: includeAll ? { label: "All Employees", value: "" } : null,
  });

export const useRepoOptions = (includeAll = false) =>
  useMasterOptions({
    masterKey: "repo",
    valueShape: "simple",
    prependOption: includeAll ? { label: "All Repositories", value: "" } : null,
  });

export const useProjectOptions = (includeAll = false) =>
  useMasterOptions({
    masterKey: "project",
    valueShape: "simple",
    prependOption: includeAll ? { label: "All Projects", value: "" } : null,
  });

export const useLabelOptions = (includeAll = false) =>
  useMasterOptions({
    masterKey: "label",
    valueShape: "simple",
    prependOption: includeAll ? { label: "All Labels", value: "" } : null,
  });

export const useTeamOptions = (includeAll = false) =>
  useMasterOptions({
    masterKey: "team",
    valueShape: "simple",
    prependOption: includeAll ? { label: "All Teams", value: "" } : null,
  });
