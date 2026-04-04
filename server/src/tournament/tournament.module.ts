/**
 * トーナメントモジュール
 */
import { Module } from "@nestjs/common";
import { StateSocketService } from "../realtime/state-socket.service";
import { TournamentService } from "./tournament.service";

@Module({
  providers: [StateSocketService, TournamentService],
  exports: [TournamentService, StateSocketService],
})
export class TournamentModule {}
