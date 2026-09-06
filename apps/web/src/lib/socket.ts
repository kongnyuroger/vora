import { io, type Socket } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

let socket: Socket | null = null;

/** Creates the shared ride socket on first call; reconnects it with a fresh token on later calls. */
export function connectSocket(token: string): Socket {
  if (socket) {
    if (!socket.connected) {
      socket.auth = { token };
      socket.connect();
    }
    return socket;
  }

  // Polling is kept as a fallback rather than forcing websocket-only: a
  // carrier proxy that blocks the upgrade would otherwise take live tracking
  // down completely, which is the one thing the demo cannot lose.
  socket = io(API_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
  });
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
