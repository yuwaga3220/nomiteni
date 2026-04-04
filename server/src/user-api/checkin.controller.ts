/**
 * 参加者チェックインコントローラー
 */
import { Body, Controller, HttpException, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { selfCheckinSchema } from "../schemas";
import { NomiteniSession } from "../auth/nomiteni-session.decorator";
import { ParticipantGuard } from "../auth/guards/participant.guard";
import type { SessionPayload } from "../auth/session.types";
import { PrismaService } from "../prisma/prisma.service";
import { toClientUser } from "../auth/auth.service";
import { TournamentService } from "../tournament/tournament.service";

@Controller("checkin")
export class CheckinController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tournamentService: TournamentService,
  ) {}

  @Post("self")
  @UseGuards(ParticipantGuard)
  async self(@Body() body: unknown, @NomiteniSession() session: SessionPayload) {
    const parsed = selfCheckinSchema.safeParse(body);
    if (!parsed.success) throw new HttpException({ error: parsed.error.flatten() }, HttpStatus.BAD_REQUEST);

    const user = await this.prisma.user.update({
      where: { id: session.userId },
      data: { checkedIn: true, canPlayToday: parsed.data.canPlayToday },
    });
    await this.tournamentService.broadcastState();
    return { user: toClientUser(user) };
  }
}
