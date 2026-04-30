// useRealtimeSync.js
// Drop-in hook that wires SignalR → React Query for any page/layout.
//
// Features:
//  • Connects once, disconnects on unmount (safe for StrictMode)
//  • On reconnect: invalidates the whole cache so every query re-fetches
//  • Deduplicates duplicate messages (e.g. from dual admin + repo groups)
//  • Exposes connectionState so the UI can show a live indicator

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  connectSignalR,
  disconnectSignalR,
  ConnectionState,
} from "./realtimeManager";
import { handleRealtimeMessage } from "./realtimeDispatcher";

const DEDUP_MAX_SIZE = 300; // prune after this many seen keys

/**
 * @param {string | (() => string)} token - JWT string or a getter function.
 *   Pass a getter when using a refresh-token flow so reconnects get a fresh token.
 *
 * @returns {{ connectionState: ConnectionState }}
 *
 * Usage:
 *   const { connectionState } = useRealtimeSync(token);
 */
export const useRealtimeSync = (token) => {
  const queryClient = useQueryClient();
  const [connectionState, setConnectionState] = useState(
    ConnectionState.Disconnected,
  );

  // ── Deduplication ───────────────────────────────────────────────────────────
  // A message can arrive twice when a user is in both "global-admin" and a
  // "repo-xxx" group (the backend broadcasts to both).
  const seen = useRef(new Set());

  const deduped = useCallback(
    (message) => {
      // Build a fingerprint from entity + action + keyField value + timestamp
      const entity   = message.Entity   ?? message.entity   ?? "";
      const action   = message.Action   ?? message.action   ?? "";
      const keyField = message.KeyField ?? message.keyField ?? "";
      const payload  = message.Payload  ?? message.payload  ?? {};
      const ts       = message.Timestamp ?? message.timestamp ?? Date.now();

      // Get the ID value from payload using keyField
      const idValue =
        payload[keyField] ??
        Object.entries(payload).find(
          ([k]) => k.toLowerCase() === keyField.toLowerCase(),
        )?.[1] ??
        "";

      const key = `${entity}|${action}|${idValue}|${ts}`;

      if (seen.current.has(key)) return; // drop duplicate
      seen.current.add(key);

      // Prune oldest entries to prevent memory leak
      if (seen.current.size > DEDUP_MAX_SIZE) {
        const [oldest] = seen.current;
        seen.current.delete(oldest);
      }
       console.log("use realtime :",message);

      handleRealtimeMessage(queryClient, message);
    },
    [queryClient],
  );

  // ── Reconnect handler ───────────────────────────────────────────────────────
  // When the connection drops and recovers, we may have missed N seconds of
  // events. Invalidate everything so queries re-fetch from the server.
  const handleReconnected = useCallback(() => {
    console.info("[RealtimeSync] Reconnected – invalidating all queries.");
    queryClient.invalidateQueries();
  }, [queryClient]);

  // ── Lifecycle ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;

    let torn = false;

    connectSignalR(token, {
      onMessage: deduped,
      onStateChange: (state) => {
        if (!torn) setConnectionState(state);
      },
      onReconnected: handleReconnected,
    });

    return () => {
      torn = true;
      disconnectSignalR();
    };
    // token identity is stable; re-connect only if the token itself changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return { connectionState };
};