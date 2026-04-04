/**
 * リアルタイムゲートウェイ（リアルタイムの状態を管理）
 */
import {
  OnGatewayConnection,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";
import { isProduction, SOCKET_ALLOWED_ORIGINS } from "../config";
import { TournamentService } from "../tournament/tournament.service";
import { StateSocketService } from "./state-socket.service";

@WebSocketGateway({
  cors: {
    origin: isProduction ? SOCKET_ALLOWED_ORIGINS : true,
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly tournamentService: TournamentService,
    private readonly stateSocket: StateSocketService,
  ) {}

  afterInit() {
    this.stateSocket.attach(this.server);
  }

  handleConnection(client: Socket) {
    void this.tournamentService.buildPublicState().then((state) => {
      client.emit("state:update", state);
    });
  }
}
