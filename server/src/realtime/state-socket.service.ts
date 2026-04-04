/**
 * 状態ソケットサービス（リアルタイムの状態を管理）
 */
import { Injectable } from "@nestjs/common";
import type { Server } from "socket.io";

@Injectable()
export class StateSocketService {
  private server: Server | null = null;

  attach(server: Server) {
    this.server = server;
  }

  emit(event: string, data: unknown) {
    this.server?.emit(event, data);
  }
}
