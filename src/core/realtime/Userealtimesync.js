import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { connectSignalR, ConnectionState } from "./realtimeManager";
import { handleRealtimeMessage } from "./realtimeDispatcher";
import { readUserFromSession } from "../auth/useCurrentUser";
import { useNotificationStore } from "../state/useNotificationStore";
import { versionChecker } from "../../app/Hooks/VersionChecker";

const DEDUP_MAX_SIZE = 300;

export const useRealtimeSync = (getToken) => {
  const queryClient = useQueryClient();
  const [connectionState, setConnectionState] = useState(ConnectionState.Disconnected);
  const currentUser = readUserFromSession();
  const seen = useRef(new Set());

  const deduped = useCallback(
    (message) => {
      const entity = message.Entity ?? message.entity ?? "";
      const action = message.Action ?? message.action ?? "";
      const keyField = message.KeyField ?? message.keyField ?? "";
      const payload = message.Payload ?? message.payload ?? {};
      const ts = message.Timestamp ?? message.timestamp ?? Date.now();

      // Extract unique IDs
      const notificationId = payload?.NotificationId ?? payload?.notificationId;
      const idValue = payload[keyField] ?? Object.entries(payload).find(([k]) => k.toLowerCase() === keyField.toLowerCase())?.[1] ?? "";

      // 🔥 FIX 1: Bulletproof Deduplication using the exact Notification GUID
      let key;
      if (entity.toLowerCase() === "notification" && notificationId) {
          key = notificationId; // GUIDs are strictly unique
      } else {
          const timeKey = Math.floor(new Date(ts).getTime() / 1000);
          key = `${entity}|${action}|${idValue}|${timeKey}`;
      }

      if (seen.current.has(key)) return;
      seen.current.add(key);

      if (seen.current.size > DEDUP_MAX_SIZE) {
        const [oldest] = seen.current;
        seen.current.delete(oldest);
      }

      console.log("[Realtime Message]", message);

      // 🔥 FIX 2: Process Notification State
      if (entity.toLowerCase() === "notification") {
        const createdBy = payload?.CreatedByUserId ?? payload?.createdByUserId;
        
        // Robust check across all possible casing variations of user ID
        const myUserId = currentUser?.userId ?? currentUser?.UserId ?? currentUser?.id ?? currentUser?.Id ?? currentUser?.employeeId ?? currentUser?.EmployeeId;

        // Ensure we ONLY trigger if the ID does not match the creator
        if (createdBy && String(createdBy).toLowerCase() !== String(myUserId).toLowerCase()) {
          
          useNotificationStore.getState().increment();
          queryClient.invalidateQueries({ queryKey: ["notification"] });
          
        }
        return;
      }

      handleRealtimeMessage(queryClient, message);
    },
    [queryClient, currentUser],
  );

  const handleReconnected = useCallback(async () => {
    console.info("[RealtimeSync] Reconnected");
    queryClient.invalidateQueries();
    // await versionChecker();
  }, [queryClient]);

  useEffect(() => {
    let disposed = false;

    const startRealtime = async () => {
      const token = typeof getToken === "function" ? getToken() : getToken;
      if (!token) return;

      await connectSignalR(getToken, {
        onMessage: deduped,
        onStateChange: (state) => {
          if (!disposed) setConnectionState(state);
        },
        onReconnected: handleReconnected,
      });
    };

    startRealtime();
    return () => { disposed = true; };
  }, [deduped, handleReconnected, getToken]);

  return { connectionState };
};