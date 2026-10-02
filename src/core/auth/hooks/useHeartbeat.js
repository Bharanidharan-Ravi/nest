import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { readUserFromSession } from "../useCurrentUser";
import { executeApi } from "../../api/executor";
import { queryKeys } from "../../query/queryKeys";

const HEARTBEAT_MS = 30_000;

// Keeps this session online (server marks it offline after 1 min without a beat)
// and stores everyone's presence: each response carries GetUserOnlineStatus,
// which useUserStatusList reads from the cache — there is no separate poll.
// Keyed on the token so it starts right after login and stops on logout.
export default function useHeartbeat(token) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const sessionId = token ? readUserFromSession()?.sessionId : null;
    if (!sessionId) return;

    const beat = async () => {
      try {
        const res = await executeApi({
          url: "/Login/heartbeat",
          method: "POST",
          payload: { sessionId },
          config: { _silent: true, _noErrorToast: true },
        });
        const status = res?.GetUserOnlineStatus;
        if (status?.Ok) queryClient.setQueryData(queryKeys.GetUserOnlineStatus.all, status.Data);
      } catch (err) {
        console.error("[Heartbeat]", err);
      }
    };

    beat();
    const timer = setInterval(beat, HEARTBEAT_MS);
    return () => clearInterval(timer);
  }, [token, queryClient]);
}
