// src/core/master/useMasterItem.js
import { useQuery } from "@tanstack/react-query";
import { MASTER_REGISTRY } from "./masterRegistry";
import { useMasterData } from "./useMasterData";

// ─── Core: get the full normalized list for any master ──────────────────────
export const useMasterList = (masterKey) => {
  const registry = MASTER_REGISTRY[masterKey];

  if (registry.source === "masterData") {
    const { data: masterData } = useMasterData();
    const rawList = masterData?.[registry.masterKey] ?? [];
    return rawList.map(registry.adapter).filter(Boolean);
  }

  // Separate API master
  const { data } = useQuery({
    queryKey: registry.queryKey,
    queryFn: registry.queryFn,
    staleTime: 5 * 60 * 1000,
  });
  return data ?? [];
};

// ─── Find ONE item by any field + value ─────────────────────────────────────
//  useEmployeeById    → useMasterFind("employee", "id", userId)
//  find by name       → useMasterFind("employee", "name", "John")
//  find by department → useMasterFind("employee", "department", "IT")
export const useMasterFind = (masterKey, field, value) => {
  const list = useMasterList(masterKey);
  if (!value) return null;
  return list.find((item) => item[field] === value) ?? null;
};

// ─── Filter LIST by any condition ────────────────────────────────────────────
//  all active employees     → useMasterFilter("employee", emp => emp.isActive)
//  repos for a project      → useMasterFilter("repo", r => r.projectId === projId)
//  multiple conditions      → useMasterFilter("employee", emp => emp.isActive && emp.department === "IT")
export const useMasterFilter = (masterKey, predicateFn) => {
  const list = useMasterList(masterKey);
  if (!predicateFn) return list;
  return list.filter(predicateFn);
};

