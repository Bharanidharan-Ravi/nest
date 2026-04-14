// src/core/master/useMasterItem.js
//
// Master-specific convenience wrappers over useRegistryQuery.
// selectors.js builds on top of these three primitives.

import { useRegistryQuery } from "./query/useRegistryQuery";
import { MASTER_REGISTRY }  from "./registry/masterRegistry";

// ─── Full normalized list for any master key ──────────────────────────────────
//   useMasterList("employee")  → all employees after adapter transform
export const useMasterList = (masterKey) => {
  const { data } = useRegistryQuery(MASTER_REGISTRY, masterKey);
  return data ?? [];
};

// ─── Find ONE item by field + value ──────────────────────────────────────────
//   useMasterFind("employee", "id",   userId)
//   useMasterFind("employee", "name", "John")
export const useMasterFind = (masterKey, field, value) => {
  const list = useMasterList(masterKey);
  if (!value) return null;
  return list.find((item) => item[field] === value) ?? null;
};

// ─── Filter list by any predicate ────────────────────────────────────────────
//   useMasterFilter("employee", (e) => e.isActive)
//   useMasterFilter("project",  (p) => p.repoId === rid)
export const useMasterFilter = (masterKey, predicateFn) => {
  const list = useMasterList(masterKey);
  if (!predicateFn) return list;
  return list.filter(predicateFn);
};