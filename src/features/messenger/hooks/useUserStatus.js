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
export const usePresenceLookup = () => {
  const list = useUserStatusList();
  return useMemo(() => {
    const byId = new Map(list.map((s) => [lower(s.EmployeeID), toPresence(s)]));
    return (userId) => (userId ? byId.get(lower(userId)) ?? null : null);
  }, [list]);
};

export const usePresence = (userId) => usePresenceLookup()(userId);
