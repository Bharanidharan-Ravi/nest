import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../core/query/queryKeys";
import { formateDateTime } from "../../../app/shared/utils/chattime";

const EMPTY = [];
const lower = (id) => String(id ?? "").toLowerCase();

// Everyone's presence rows ({ EmployeeID, IsOnline, StatusSince, … }), computed by
// the GetAllUserOnlineStatus SP and written into this cache by every heartbeat
// response (useHeartbeat). Reading it never sends a request.
export const useUserStatusList = () =>
  useQuery({
    queryKey: queryKeys.GetUserOnlineStatus.all,
    queryFn: () => EMPTY,
    enabled: false,
    staleTime: Infinity,
  }).data ?? EMPTY;

const toPresence = (status) => ({
  isOnline: !!status.IsOnline,
  since: status.StatusSince,
  label: status.IsOnline
    ? `Online since ${formateDateTime(status.StatusSince)}`
    : status.StatusSince
      ? `Offline since ${formateDateTime(status.StatusSince)}`
      : "Offline",
});

/** Status-dot colour for a presence returned by usePresenceLookup. */
export const presenceDotClass = (presence) => (presence?.isOnline ? "bg-green-500" : "bg-red-400");

/**
 * (userId) => { isOnline, since, label } | null (null = no status row for that user).
 * One lookup for a whole list; use usePresence for a single user.
 */
// One lookup per status list, shared by every caller: a page of cards has
// hundreds of avatars, each calling usePresence. Presences are built on first
// use, so only the users actually shown pay for the date formatting.
const lookupCache = new WeakMap();
const buildLookup = (list) => {
  const rows = new Map(list.map((s) => [lower(s.EmployeeID), s]));
  const built = new Map();
  return (userId) => {
    if (!userId) return null;
    const id = lower(userId);
    if (!built.has(id)) {
      const row = rows.get(id);
      built.set(id, row ? toPresence(row) : null);
    }
    return built.get(id);
  };
};

export const usePresenceLookup = () => {
  const list = useUserStatusList();
  return useMemo(() => {
    let lookup = lookupCache.get(list);
    if (!lookup) {
      lookup = buildLookup(list);
      lookupCache.set(list, lookup);
    }
    return lookup;
  }, [list]);
};

export const usePresence = (userId) => usePresenceLookup()(userId);
