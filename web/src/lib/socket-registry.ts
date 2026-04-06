// web/src/lib/socket-registry.ts
// Socket.IO サーバーを登録
import type { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | undefined;

// Socket.IO サーバーを登録
export function setIo(server: SocketIOServer) {
  io = server;
}

// 状態更新を emit
export function emitStateUpdate(data: unknown) {
  io?.emit("state:update", data);
}
