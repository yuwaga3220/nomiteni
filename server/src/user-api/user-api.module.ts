/**
 * ユーザーAPIモジュール
 */
import { Module } from "@nestjs/common";
import { TournamentModule } from "../tournament/tournament.module";
import { AuthHttpController } from "./auth-http.controller";
import { CheckinController } from "./checkin.controller";
import { EntryController } from "./entry.controller";
import { TournamentsController } from "./tournaments.controller";

@Module({
  imports: [TournamentModule],
  controllers: [AuthHttpController, EntryController, CheckinController, TournamentsController],
})
export class UserApiModule {}
