import { io } from "socket.io-client";

const url = "http://localhost:4004" || window.location.origin.replace(/:\d+$/, ":4004");

const socket = io(url, { transports: ["websocket"], autoConnect: false });

export function connectSocket() {
  if (!socket.connected) socket.connect();
  return socket;
}

export function disconnectSocket() {
  if (socket.connected) socket.disconnect();
}

export default socket;
