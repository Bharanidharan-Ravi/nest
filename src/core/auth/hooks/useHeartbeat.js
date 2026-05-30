import { useEffect } from "react";
import { readUserFromSession } from "../useCurrentUser";
import { executeApi } from "../../api/executor";

export default function useHeartbeat() {
  useEffect(() => {
    const user = readUserFromSession();

    if (!user?.sessionId) return;

    const timer = setInterval(async () => {
      try {
        const sendHeartbeat = await executeApi({
          url: "/Login/heartbeat",
          method: "POST",
          payload: {
            sessionId: user.sessionId,
          },
          config: {
            _silent: true,
          },
        });
      } catch (err) {
        console.error("[Heartbeat]", err);
      }
    }, 30000);

    return () => clearInterval(timer);
  }, []);
}
