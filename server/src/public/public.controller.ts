/**
 * パブリックコントローラー（パブリックな状態を管理）
 */
import { Controller, Get } from "@nestjs/common";
import { TournamentService } from "../tournament/tournament.service";

@Controller()
export class HealthController {
  @Get("health")
  health() {
    return { ok: true };
  }
}

@Controller("public")
export class PublicStateController {
  constructor(private readonly tournamentService: TournamentService) {}

  @Get("state")
  async state() {
    return this.tournamentService.buildPublicState();
  }
}

@Controller("settings")
export class SettingsController {
  constructor(private readonly tournamentService: TournamentService) {}

  @Get()
  async settings() {
    return { courtCount: await this.tournamentService.getCourtCount() };
  }
}
