/**
 * リアルタイムモジュール（リアルタイムの状態を管理）
 */
import { Module } from "@nestjs/common";
import { TournamentModule } from "../tournament/tournament.module";
import { RealtimeGateway } from "./realtime.gateway";

@Module({
  imports: [TournamentModule],
  providers: [RealtimeGateway],
})
export class RealtimeModule {}
