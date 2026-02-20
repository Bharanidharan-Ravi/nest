import * as signalR from "@microsoft/signalr";

let connection = null;
let isConnecting = false;

export const connectSignalR = async (token, onMessage) => {
  if (!token) return;

  if (connection || isConnecting) {
    return;
  }

  isConnecting = true;

  const newConnection = new signalR.HubConnectionBuilder()
    .withUrl("https://localhost:8008/realtime", {
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
