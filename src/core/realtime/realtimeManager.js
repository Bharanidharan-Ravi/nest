// realtimeManager.js
// Production-grade SignalR connection manager
// Handles: state tracking, reconnect callbacks, token refresh, teardown

import * as signalR from "@microsoft/signalr";

let connection = null;
let isConnecting = false;

// ─── URL Resolution ───────────────────────────────────────────────────────────
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
const fallbackRealtimeUrl = apiBaseUrl
  ? `${apiBaseUrl.replace(/\/+$/, "").replace(/\/api$/i, "")}/realtime`
  : "";
export const realtimeUrl =
  import.meta.env.VITE_REALTIME_URL || fallbackRealtimeUrl;

// ─── Connection State Enum ────────────────────────────────────────────────────
export const ConnectionState = Object.freeze({
  Disconnected: "Disconnected",
  Connecting: "Connecting",
  Connected: "Connected",
  Reconnecting: "Reconnecting",
});

// ─── Connect ──────────────────────────────────────────────────────────────────
/**
 * @param {() => string} getToken - A function that returns the latest JWT.
 *   Pass a getter (not the token string itself) so reconnects always use a fresh token.
 *
 * @param {object} callbacks
 * @param {(msg: object) => void}            callbacks.onMessage      - Called on every EntityChanged event
 * @param {(state: ConnectionState) => void} callbacks.onStateChange  - Called on every state transition
 * @param {() => void}                       callbacks.onReconnected  - Called after successful reconnect (use to invalidate cache)
 */
export const connectSignalR = async (
  getToken,
  { onMessage, onStateChange, onReconnected } = {},
) => {
  if (!getToken || !realtimeUrl) return;
  if (connection || isConnecting) return;

  isConnecting = true;
  onStateChange?.(ConnectionState.Connecting);

  const newConnection = new signalR.HubConnectionBuilder()
    .withUrl(realtimeUrl, {
      // Always call getToken() so token refreshes are picked up automatically
      accessTokenFactory: () =>
        typeof getToken === "function" ? getToken() : getToken,
    })
    // Exponential-ish back-off: immediately, 2 s, 5 s, 10 s, then every 30 s
    .withAutomaticReconnect([0, 2_000, 5_000, 10_000, 30_000])
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  // ── Incoming message ────────────────────────────────────────────────────────
  newConnection.on("EntityChanged", (message) => {
    onMessage?.(message);
  });

  // ── Lifecycle hooks ─────────────────────────────────────────────────────────
  newConnection.onreconnecting((error) => {
    console.warn("[SignalR] Reconnecting…", error);
    onStateChange?.(ConnectionState.Reconnecting);
  });

  newConnection.onreconnected((connectionId) => {
    console.info("[SignalR] Reconnected. ConnectionId:", connectionId);
    onStateChange?.(ConnectionState.Connected);
    // ⚡ Tell the consumer to re-sync the cache
    onReconnected?.();
  });

  newConnection.onclose((error) => {
    connection = null;
    console.warn("[SignalR] Connection closed.", error);
    onStateChange?.(ConnectionState.Disconnected);
  });

  // ── Start ───────────────────────────────────────────────────────────────────
  try {
    await newConnection.start();
    connection = newConnection;
    console.info("[SignalR] Connected.");
    onStateChange?.(ConnectionState.Connected);
  } catch (err) {
    console.error("[SignalR] Initial connection failed:", err);
    onStateChange?.(ConnectionState.Disconnected);
  } finally {
    isConnecting = false;
  }
};

// ─── Disconnect ───────────────────────────────────────────────────────────────
export const disconnectSignalR = async () => {
  if (connection) {
    await connection.stop();
    connection = null;
    console.info("[SignalR] Disconnected.");
  }
};

// ─── Read current state ───────────────────────────────────────────────────────
export const getConnectionState = () => {
  if (!connection) return ConnectionState.Disconnected;
  switch (connection.state) {
    case signalR.HubConnectionState.Connected:
      return ConnectionState.Connected;
    case signalR.HubConnectionState.Reconnecting:
      return ConnectionState.Reconnecting;
    case signalR.HubConnectionState.Connecting:
      return ConnectionState.Connecting;
    default:
      return ConnectionState.Disconnected;
  }
};