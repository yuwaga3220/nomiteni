import type { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | undefined;

export function setIo(server: SocketIOServer) {
  io = server;
}

export function emitStateUpdate(data: unknown) {
  io?.emit("state:update", data);
}
