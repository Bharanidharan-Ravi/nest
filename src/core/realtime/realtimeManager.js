import * as signalR from "@microsoft/signalr";

let connection = null;
let isConnecting = false;

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
const fallbackRealtimeUrl = apiBaseUrl
  ? `${apiBaseUrl.replace(/\/+$/, "").replace(/\/api$/i, "")}/realtime`
  : "";
const realtimeUrl = import.meta.env.VITE_REALTIME_URL || fallbackRealtimeUrl;

export const connectSignalR = async (token, onMessage) => {
  if (!token || !realtimeUrl) return;

  if (connection || isConnecting) {
    return;
  }

  isConnecting = true;

  const newConnection = new signalR.HubConnectionBuilder()
    .withUrl(realtimeUrl, {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  newConnection.on("EntityChanged", (message) => {
    if (onMessage) onMessage(message);
    
  });

  try {
    await newConnection.start();
    connection = newConnection;
    console.log("SignalR Connected");
  } catch (err) {
    console.error("SignalR connection failed:", err);
  } finally {
    isConnecting = false;
  }
};

export const disconnectSignalR = async () => {
  if (connection) {
    await connection.stop();
    connection = null;
    console.log("SignalR Disconnected");
  }
};
