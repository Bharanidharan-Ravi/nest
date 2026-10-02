// src/core/master/useMasterLookup.js
//
// Id → item lookups over every bulk-preloaded master in MASTER_REGISTRY
// (employee, repo, project, label, team, status, ...), built once per master
// cache change. For mapping ids in slim rows (e.g. TicketListV2) to names
// without a per-row useMasterFind.
//
//   const lookup = useMasterLookup();
//   lookup.get("employee", row.Assignee_Id)?.name
//   lookup.list("status")
//
// Ids are matched case-insensitively (GUIDs differ in case between SPs).

import { useMemo } from "react";
import { useMasterData } from "./masterCall/useMasterData";
import { MASTER_REGISTRY } from "./registry/masterRegistry";

const toKey = (id) => String(id).trim().toLowerCase();

export const useMasterLookup = () => {
  const { data: masterData } = useMasterData();

  return useMemo(() => {
    const maps = {};
    Object.entries(MASTER_REGISTRY).forEach(([key, config]) => {
      if (config.source !== "masterData") return;
      const list = (masterData?.[config.masterKey] ?? [])
        .map(config.adapter)
        .filter(Boolean);
      maps[key] = new Map(list.map((item) => [toKey(item.id), item]));
    });

    return {
      ready: Boolean(masterData),
      get: (key, id) =>
        id === null || id === undefined || id === ""
          ? null
          : (maps[key]?.get(toKey(id)) ?? null),
      list: (key) => Array.from(maps[key]?.values() ?? []),
    };
  }, [masterData]);
};
