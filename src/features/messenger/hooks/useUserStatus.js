import { queryKeys } from "../../../core/query/queryKeys";
import { useApiQuery } from "../../../core/query/useApiQuery";
import { buildSyncPayload } from "../../../core/sync/buildSyncPayload";

  export const fetUserStatus = () => {
    const query = queryKeys.GetUserOnlineStatus.all;
  
    const payload = buildSyncPayload({
      configKey: "GetUserOnlineStatus"
    });
    return useApiQuery({
      queryKey: query,
      url: "/sync/v2",
      method: "POST",
      payload: payload,
      source: "GetUserOnlineStatus",
      silent: true,
      // One poll every 30 s for the whole app. Every avatar uses this query, so
      // with staleTime 0 each avatar that mounted (list page, scroll) refetched it.
      options: {
        staleTime: 25_000,
        refetchInterval:30_000,
        refetchOnWindowFocus:true,
        refetchOnMount:true,
        enabled: true,

      },
    });
  };

  