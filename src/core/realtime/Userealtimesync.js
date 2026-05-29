import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  connectSignalR,
  ConnectionState,
} from "./realtimeManager";
import { handleRealtimeMessage } from "./realtimeDispatcher";

const DEDUP_MAX_SIZE = 300;

export const useRealtimeSync = (getToken) => {
  const queryClient = useQueryClient();

  const [connectionState, setConnectionState] = useState(
    ConnectionState.Disconnected,
  );

  const seen = useRef(new Set());

  const deduped = useCallback(
    (message) => {
      const entity = message.Entity ?? message.entity ?? "";
      const action = message.Action ?? message.action ?? "";
      const keyField = message.KeyField ?? message.keyField ?? "";
      const payload = message.Payload ?? message.payload ?? {};
      const ts = message.Timestamp ?? message.timestamp ?? Date.now();

      const idValue =
        payload[keyField] ??
        Object.entries(payload).find(
          ([k]) => k.toLowerCase() === keyField.toLowerCase(),
        )?.[1] ??
        "";

      const key = `${entity}|${action}|${idValue}|${ts}`;

      if (seen.current.has(key)) return;

      seen.current.add(key);

      if (seen.current.size > DEDUP_MAX_SIZE) {
        const [oldest] = seen.current;
        seen.current.delete(oldest);
      }

      console.log("[Realtime Message]", message);

      handleRealtimeMessage(queryClient, message);
    },
    [queryClient],
  );

  const handleReconnected = useCallback(() => {
    console.info("[RealtimeSync] Reconnected");

    queryClient.invalidateQueries();
  }, [queryClient]);

  useEffect(() => {
    let disposed = false;

    const startRealtime = async () => {
      const token =
        typeof getToken === "function"
          ? getToken()
          : getToken;

      if (!token) {
        console.log("[RealtimeSync] No JWT found");
        return;
      }

      console.log("[RealtimeSync] Starting SignalR...");

      await connectSignalR(getToken, {
        onMessage: deduped,

        onStateChange: (state) => {
          if (!disposed) {
            setConnectionState(state);
          }
        },

        onReconnected: handleReconnected,
      });
    };

    startRealtime();

    return () => {
      disposed = true;
    };
  }, [deduped, handleReconnected, getToken]);

  return {
    connectionState,
  };
};