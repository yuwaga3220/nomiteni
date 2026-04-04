/**
 * パブリックモジュール（パブリックな状態を管理）
 */
import { Module } from "@nestjs/common";
import { TournamentModule } from "../tournament/tournament.module";
import { HealthController, PublicStateController, SettingsController } from "./public.controller";

@Module({
  imports: [TournamentModule],
  controllers: [HealthController, PublicStateController, SettingsController],
})
export class PublicModule {}
