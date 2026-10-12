import { queryKeys } from "../../../core/query/queryKeys";
import { useApiQuery } from "../../../core/query/useApiQuery";

export const useHours = (MyUserId = null, IssueId = null) => {
    return useApiQuery({
      queryKey: ["AllHour", "list", MyUserId ?? "none", IssueId ?? "none"],
      url: "/sync/v2",
      method: "POST",
      silent:true,
      payload: {
        ConfigKeys: ["AllHour"],
        Params: {
            AllHour: {
                MyUserId: MyUserId,
                IssueId: IssueId
          }
        }
      },
      source: "AllHour",
      options: {
        staleTime: 10 * 60 * 1000, // 10 minutes
       
      },
    });
  };
 

  
const toThreadWorkTypeList = (data) =>
  Array.isArray(data) ? data : Array.isArray(data?.Data) ? data.Data : [];

// "Thread For" options. Not a boot master: fetched the first time a thread
// screen mounts this hook, then kept for the whole session (staleTime/gcTime
// Infinity). A "ThreadWorkType" realtime event still refetches it.
export const useThreadWorkType = ({ enabled = true } = {}) => {

  return useApiQuery({
    queryKey:queryKeys.ThreadWorkType.list(),
    url: "/sync/v2",
    method: "POST",
    silent:true,
    payload: {
      ConfigKeys: ["ThreadWorkType"]},
    source: "ThreadWorkType",
    options: {
      enabled,
      staleTime: Infinity,
      gcTime: Infinity,
      select: toThreadWorkTypeList,
    },
  });
};