/**
 * エントリーコントローラー
 */
import { Body, Controller, HttpException, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { entryPasscodeOnlySchema, entrySchema } from "../schemas";
import { NomiteniSession } from "../auth/nomiteni-session.decorator";
import { ParticipantGuard } from "../auth/guards/participant.guard";
import type { SessionPayload } from "../auth/session.types";
import { PrismaService } from "../prisma/prisma.service";
import { toClientUser } from "../auth/auth.service";
import { TournamentService } from "../tournament/tournament.service";

@Controller("entry")
export class EntryController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tournamentService: TournamentService,
  ) {}

  @Post("self")
  @UseGuards(ParticipantGuard)
  async self(@Body() body: unknown, @NomiteniSession() session: SessionPayload) {
    const parsed = entrySchema.safeParse(body);
    if (!parsed.success) throw new HttpException({ error: parsed.error.flatten() }, HttpStatus.BAD_REQUEST);

    const activeTournament = await this.tournamentService.getActiveTournament();
    if (!activeTournament || !activeTournament.entryPasscode) {
      throw new HttpException({ error: "大会エントリーパスコードが未設定です。" }, HttpStatus.UNAUTHORIZED);
    }
    if (parsed.data.tournamentPasscode !== activeTournament.entryPasscode) {
      throw new HttpException({ error: "大会エントリーパスコードが違います。" }, HttpStatus.UNAUTHORIZED);
    }

    const user = await this.prisma.user.update({
      where: { id: session.userId },
      data: {
        name: parsed.data.name,
        partyJoin: parsed.data.partyJoin,
        note: parsed.data.note,
      },
    });
    await this.tournamentService.broadcastState();
    return { user: toClientUser(user) };
  }

  @Post("preview")
  @UseGuards(ParticipantGuard)
  async preview(@Body() body: unknown) {
    const parsed = entryPasscodeOnlySchema.safeParse(body);
    if (!parsed.success) throw new HttpException({ error: parsed.error.flatten() }, HttpStatus.BAD_REQUEST);

    const activeTournament = await this.tournamentService.getActiveTournament();
    if (!activeTournament || !activeTournament.entryPasscode) {
      throw new HttpException({ error: "大会エントリーパスコードが未設定です。" }, HttpStatus.UNAUTHORIZED);
    }
    if (parsed.data.tournamentPasscode !== activeTournament.entryPasscode) {
      throw new HttpException({ error: "大会エントリーパスコードが違います。" }, HttpStatus.UNAUTHORIZED);
    }

    return {
      tournament: {
        id: activeTournament.id,
        name: activeTournament.name,
        status: activeTournament.status,
      },
    };
  }
}
