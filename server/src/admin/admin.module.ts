/**
 * 管理者モジュール（管理者のみ実行できる操作）
 */
import { Module } from "@nestjs/common";
import { TournamentModule } from "../tournament/tournament.module";
import { AdminController } from "./admin.controller";

@Module({
  imports: [TournamentModule],
  controllers: [AdminController],
})
export class AdminModule {}
