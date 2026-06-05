import * as signalR from "@microsoft/signalr";
import { useAppStore } from "../state/useAppStore";
import { APP_VERSION } from "../../app/shared/Version";

let connection = null;
let isConnecting = false;

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";

const fallbackRealtimeUrl = apiBaseUrl
  ? `${apiBaseUrl.replace(/\/+$/, "").replace(/\/api$/i, "")}/realtime`
  : "";

export const realtimeUrl =
  import.meta.env.VITE_REALTIME_URL || fallbackRealtimeUrl;

export const ConnectionState = Object.freeze({
  Disconnected: "Disconnected",
  Connecting: "Connecting",
  Connected: "Connected",
  Reconnecting: "Reconnecting",
});

export const connectSignalR = async (
  getToken,
  { onMessage, onStateChange, onReconnected } = {},
) => {
  const token = typeof getToken === "function" ? getToken() : getToken;

  if (!token || !realtimeUrl) return;

  if (connection || isConnecting) {
    return;
  }

  isConnecting = true;

  onStateChange?.(ConnectionState.Connecting);

  const isTestEnv = window.location.pathname.startsWith("/test");
  const envQueryParam = isTestEnv ? "Test" : "Live";

  // Safely append to the URL whether it already has query parameters or not
  const separator = realtimeUrl.includes("?") ? "&" : "?";
  const finalRealtimeUrl = `${realtimeUrl}${separator}env=${envQueryParam}`;
  const newConnection = new signalR.HubConnectionBuilder()
    .withUrl(realtimeUrl, {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000, 60000, 120000])
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  newConnection.on("EntityChanged", (message) => {
    console.log("[SignalR RAW EVENT]:", message);
    onMessage?.(message);
  });

  newConnection.on("VersionUpdated", (latestVersion) => {
    if (latestVersion.Version !== APP_VERSION) {
      useAppStore.getState().showVersionModal({
        currentVersion: APP_VERSION,
        latestVersion,
      });
    }
  });
  newConnection.onreconnecting((error) => {
    console.warn("[SignalR] Reconnecting...", error);
    onStateChange?.(ConnectionState.Reconnecting);
  });

  newConnection.onreconnected((connectionId) => {
    console.info("[SignalR] Reconnected:", connectionId);

    onStateChange?.(ConnectionState.Connected);

    onReconnected?.();
  });

  newConnection.onclose((error) => {
    console.warn("[SignalR] Closed:", error);

    connection = null;

    onStateChange?.(ConnectionState.Disconnected);
  });

  try {
    await newConnection.start();

    connection = newConnection;

    console.info("[SignalR] Connected");

    onStateChange?.(ConnectionState.Connected);
  } catch (err) {
    console.error("[SignalR] Initial connection failed:", err);

    onStateChange?.(ConnectionState.Disconnected);
  } finally {
    isConnecting = false;
  }
};

export const disconnectSignalR = async () => {
  if (connection) {
    await connection.stop();

    connection = null;

    console.info("[SignalR] Disconnected");
  }
};

export const getConnectionState = () => {
  if (!connection) {
    return ConnectionState.Disconnected;
  }

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

export const isSignalRConnected = () => {
  return connection !== null;
};
