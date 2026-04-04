/**
 * トーナメントコントローラー
 */
import { Body, Controller, HttpException, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { TournamentStatus } from "@prisma/client";
import { tournamentSettingsSchema } from "../schemas";
import { NomiteniSession } from "../auth/nomiteni-session.decorator";
import { SessionAuthGuard } from "../auth/guards/session-auth.guard";
import type { SessionPayload } from "../auth/session.types";
import { PrismaService } from "../prisma/prisma.service";
import { TournamentService, nextPowerOfTwo, shuffle } from "../tournament/tournament.service";
import { issueUniqueAdminPasscode } from "../utils/admin-passcode";

@Controller("tournaments")
export class TournamentsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tournamentService: TournamentService,
  ) {}

  @Post("create")
  @UseGuards(SessionAuthGuard)
  async create(@Body() body: unknown, @NomiteniSession() _session: SessionPayload) {
    const parsed = tournamentSettingsSchema.safeParse(body);
    if (!parsed.success) throw new HttpException({ error: parsed.error.flatten() }, HttpStatus.BAD_REQUEST);

    const runningTournament = await this.prisma.tournament.findFirst({
      where: { status: TournamentStatus.RUNNING },
      orderBy: { createdAt: "desc" },
    });
    if (runningTournament) {
      throw new HttpException({ error: "進行中の大会があるため、新規トーナメントは作成できません。" }, HttpStatus.BAD_REQUEST);
    }

    await this.prisma.tournament.updateMany({
      where: { status: TournamentStatus.DRAFT },
      data: { status: TournamentStatus.FINISHED },
    });

    const players = await this.prisma.user.findMany({
      where: { checkedIn: true, canPlayToday: true },
      select: { id: true },
    });
    const tournament = await this.prisma.tournament.create({
      data: {
        name: parsed.data.name,
        adminPasscode: await issueUniqueAdminPasscode(this.prisma),
        eventDate: parsed.data.eventDate ?? null,
        timeSlot: parsed.data.timeSlot ?? null,
        courtCount: parsed.data.courtCount,
        status: TournamentStatus.DRAFT,
        observerPasscode: parsed.data.observerPasscode,
        entryPasscode: parsed.data.entryPasscode,
      },
    });

    if (players.length < 2) {
      await this.tournamentService.broadcastState();
      return {
        tournamentId: tournament.id,
        adminPasscode: tournament.adminPasscode,
        warning: "参加可能者が2名未満のため、対戦表はまだ作成されていません。",
      };
    }

    const shuffled = shuffle(players.map((p) => p.id));
    const size = nextPowerOfTwo(shuffled.length);
    const rounds = Math.log2(size);
    const slots: Array<number | null> = [...shuffled];
    while (slots.length < size) slots.push(null);

    const createdIds = new Map<string, number>();
    for (let round = 1; round <= rounds; round++) {
      const count = size / 2 ** round;
      for (let position = 1; position <= count; position++) {
        const createData =
          round === 1
            ? {
                player1Id: slots[(position - 1) * 2],
                player2Id: slots[(position - 1) * 2 + 1],
              }
            : {};
        const match = await this.prisma.match.create({
          data: {
            tournamentId: tournament.id,
            round,
            position,
            ...createData,
          },
        });
        createdIds.set(`${round}-${position}`, match.id);
      }
    }

    for (let round = 1; round < rounds; round++) {
      const count = size / 2 ** round;
      for (let position = 1; position <= count; position++) {
        const id = createdIds.get(`${round}-${position}`)!;
        const nextId = createdIds.get(`${round + 1}-${Math.ceil(position / 2)}`)!;
        await this.prisma.match.update({
          where: { id },
          data: { nextMatchId: nextId },
        });
      }
    }

    await this.tournamentService.resolveAutomaticMatches(tournament.id);
    await this.tournamentService.updateTournamentStatus(tournament.id);
    await this.tournamentService.broadcastState();
    return { tournamentId: tournament.id, adminPasscode: tournament.adminPasscode };
  }
}
