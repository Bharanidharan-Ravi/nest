// src/core/master/useMasterItem.js
//
// Master-specific convenience wrappers over useRegistryQuery.
// selectors.js builds on top of these three primitives.

import { useRegistryQuery } from "./query/useRegistryQuery";
import { MASTER_REGISTRY }  from "./registry/masterRegistry";

// ─── Full normalized list for any master key ──────────────────────────────────
//   useMasterList("employee")  → all employees after adapter transform
export const useMasterList = (masterKey, params = {}, overrides = {}) => {
  const { data } = useRegistryQuery(MASTER_REGISTRY, masterKey, params, overrides);
  return data ?? [];
};

// ─── Find ONE item by field + value ──────────────────────────────────────────
//   useMasterFind("employee", "id",   userId)
//   useMasterFind("employee", "name", "John")
// field → value → first matching item, built once per (immutable) master list:
// list rows call this several times each, so a page of cards did hundreds of
// linear scans.
const findIndexCache = new WeakMap();
const getFieldIndex = (list, field) => {
  let byField = findIndexCache.get(list);
  if (!byField) {
    byField = new Map();
    findIndexCache.set(list, byField);
  }
  let index = byField.get(field);
  if (!index) {
    index = new Map();
    list.forEach((item) => {
      if (!index.has(item[field])) index.set(item[field], item);
    });
    byField.set(field, index);
  }
  return index;
};

export const useMasterFind = (masterKey, field, value) => {
  const list = useMasterList(masterKey);
  if (!value) return null;
  return getFieldIndex(list, field).get(value) ?? null;
};

// ─── Filter list by any predicate ────────────────────────────────────────────
//   useMasterFilter("employee", (e) => e.isActive)
//   useMasterFilter("project",  (p) => p.repoId === rid)
export const useMasterFilter = (masterKey, predicateFn) => {
  const list = useMasterList(masterKey);
  if (!predicateFn) return list;
  return list.filter(predicateFn);
};