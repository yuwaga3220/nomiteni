/**
 * 管理者コントローラー（管理者のみ実行できる操作）
 */
import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { MatchStatus, TournamentStatus, UserRole } from "@prisma/client";
import type { Request } from "express";
import { z } from "zod";
import { COURT_KEY } from "../config";
import { entryPasscodeSchema, observerPasscodeSchema, tournamentSettingsSchema } from "../schemas";
import { AuthService } from "../auth/auth.service";
import { AdminGuard } from "../auth/guards/admin.guard";
import { PrismaService } from "../prisma/prisma.service";
import { TournamentService, nextPowerOfTwo, shuffle } from "../tournament/tournament.service";
import { issueUniqueAdminPasscode } from "../utils/admin-passcode";

@Controller("admin")
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    private readonly tournamentService: TournamentService,
  ) {}

  private async requireScopedTournament(req: Request) {
    const session = this.auth.readSession(req);
    if (!session) {
      throw new HttpException({ error: "ログインが必要です。" }, HttpStatus.UNAUTHORIZED);
    }
    if (session.role !== UserRole.ADMIN) {
      throw new HttpException({ error: "管理者のみ実行できます。" }, HttpStatus.FORBIDDEN);
    }
    if (!session.tournamentId) {
      throw new HttpException({ error: "この管理者セッションには大会が紐づいていません。" }, HttpStatus.FORBIDDEN);
    }
    const tournament = await this.prisma.tournament.findUnique({ where: { id: session.tournamentId } });
    if (!tournament) {
      throw new HttpException({ error: "該当する大会が見つかりません。" }, HttpStatus.NOT_FOUND);
    }
    return tournament;
  }

  @Get("tournaments/settings")
  async getTournamentSettings(@Req() req: Request) {
    const activeTournament = await this.requireScopedTournament(req);
    return {
      tournament: {
        id: activeTournament.id,
        name: activeTournament.name,
        eventDate: activeTournament.eventDate,
        timeSlot: activeTournament.timeSlot,
        courtCount: activeTournament.courtCount,
        entryPasscode: activeTournament.entryPasscode,
        observerPasscode: activeTournament.observerPasscode,
      },
    };
  }

  @Get("participants")
  async participants() {
    const users = await this.prisma.user.findMany({
      where: { role: UserRole.PARTICIPANT },
      orderBy: [{ createdAt: "asc" }],
    });
    return { users };
  }

  @Post("participants/:id/checkin")
  async participantCheckin(@Param("id") idParam: string, @Body() body: unknown) {
    const id = Number(idParam);
    const parsed = z
      .object({ checkedIn: z.boolean(), canPlayToday: z.boolean().nullable() })
      .safeParse(body);
    if (!parsed.success) throw new HttpException({ error: parsed.error.flatten() }, HttpStatus.BAD_REQUEST);

    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target || target.role !== UserRole.PARTICIPANT) {
      throw new HttpException({ error: "参加者が見つかりません。" }, HttpStatus.NOT_FOUND);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: parsed.data,
    });
    await this.tournamentService.broadcastState();
    return { user };
  }

  @Post("settings/courts")
  async settingsCourts(@Req() req: Request, @Body() body: unknown) {
    const activeTournament = await this.requireScopedTournament(req);
    const parsed = z.object({ courtCount: z.number().int().min(1).max(32) }).safeParse(body);
    if (!parsed.success) throw new HttpException({ error: parsed.error.flatten() }, HttpStatus.BAD_REQUEST);
    await this.prisma.tournament.update({
      where: { id: activeTournament.id },
      data: { courtCount: parsed.data.courtCount },
    });
    await this.prisma.appSetting.upsert({
      where: { key: COURT_KEY },
      update: { value: String(parsed.data.courtCount) },
      create: { key: COURT_KEY, value: String(parsed.data.courtCount) },
    });
    await this.tournamentService.broadcastState();
    return { ok: true };
  }

  @Post("tournaments/observer-passcode")
  async observerPasscode(@Req() req: Request, @Body() body: unknown) {
    const activeTournament = await this.requireScopedTournament(req);
    const parsed = observerPasscodeSchema.safeParse(body);
    if (!parsed.success) throw new HttpException({ error: parsed.error.flatten() }, HttpStatus.BAD_REQUEST);

    await this.prisma.tournament.update({
      where: { id: activeTournament.id },
      data: { observerPasscode: parsed.data.passcode },
    });
    return { ok: true };
  }

  @Post("tournaments/entry-passcode")
  async entryPasscode(@Req() req: Request, @Body() body: unknown) {
    const activeTournament = await this.requireScopedTournament(req);
    const parsed = entryPasscodeSchema.safeParse(body);
    if (!parsed.success) throw new HttpException({ error: parsed.error.flatten() }, HttpStatus.BAD_REQUEST);

    await this.prisma.tournament.update({
      where: { id: activeTournament.id },
      data: { entryPasscode: parsed.data.passcode },
    });
    return { ok: true };
  }

  @Post("tournaments")
  async createTournament(@Body() body: unknown) {
    const parsed = tournamentSettingsSchema.safeParse(body);
    if (!parsed.success) throw new HttpException({ error: parsed.error.flatten() }, HttpStatus.BAD_REQUEST);

    const runningTournament = await this.prisma.tournament.findFirst({
      where: { status: TournamentStatus.RUNNING },
      orderBy: { createdAt: "desc" },
    });
    if (runningTournament) {
      throw new HttpException({ error: "進行中の大会があるため、新規トーナメントは作成できません。" }, HttpStatus.BAD_REQUEST);
    }

    const players = await this.prisma.user.findMany({
      where: { checkedIn: true, canPlayToday: true },
      select: { id: true },
    });

    await this.prisma.tournament.updateMany({
      where: { status: TournamentStatus.DRAFT },
      data: { status: TournamentStatus.FINISHED },
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
    await this.prisma.appSetting.upsert({
      where: { key: COURT_KEY },
      update: { value: String(parsed.data.courtCount) },
      create: { key: COURT_KEY, value: String(parsed.data.courtCount) },
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

  @Post("tournaments/settings")
  async postTournamentSettings(@Req() req: Request, @Body() body: unknown) {
    const activeTournament = await this.requireScopedTournament(req);
    const parsed = tournamentSettingsSchema.safeParse(body);
    if (!parsed.success) throw new HttpException({ error: parsed.error.flatten() }, HttpStatus.BAD_REQUEST);

    await this.prisma.tournament.update({
      where: { id: activeTournament.id },
      data: {
        name: parsed.data.name,
        eventDate: parsed.data.eventDate ?? null,
        timeSlot: parsed.data.timeSlot ?? null,
        courtCount: parsed.data.courtCount,
        entryPasscode: parsed.data.entryPasscode,
        observerPasscode: parsed.data.observerPasscode,
      },
    });
    await this.prisma.appSetting.upsert({
      where: { key: COURT_KEY },
      update: { value: String(parsed.data.courtCount) },
      create: { key: COURT_KEY, value: String(parsed.data.courtCount) },
    });
    await this.tournamentService.broadcastState();
    return { ok: true };
  }

  @Post("matches/:id/assign")
  async assignMatch(@Req() req: Request, @Param("id") idParam: string, @Body() body: unknown) {
    const activeTournament = await this.requireScopedTournament(req);
    const id = Number(idParam);
    const parsed = z.object({ courtNumber: z.number().int().min(1) }).safeParse(body);
    if (!parsed.success) throw new HttpException({ error: parsed.error.flatten() }, HttpStatus.BAD_REQUEST);

    const current = await this.prisma.match.findUnique({ where: { id } });
    if (!current || current.tournamentId !== activeTournament.id) {
      throw new HttpException({ error: "試合が見つかりません。" }, HttpStatus.NOT_FOUND);
    }
    const match = await this.prisma.match.update({
      where: { id },
      data: { courtNumber: parsed.data.courtNumber, status: MatchStatus.ASSIGNED },
    });
    await this.tournamentService.broadcastState();
    return { match };
  }

  @Post("matches/:id/start")
  async startMatch(@Req() req: Request, @Param("id") idParam: string) {
    const activeTournament = await this.requireScopedTournament(req);
    const id = Number(idParam);
    const current = await this.prisma.match.findUnique({ where: { id } });
    if (!current || current.tournamentId !== activeTournament.id) {
      throw new HttpException({ error: "試合が見つかりません。" }, HttpStatus.NOT_FOUND);
    }
    const match = await this.prisma.match.update({
      where: { id },
      data: { status: MatchStatus.IN_PROGRESS },
    });
    await this.tournamentService.broadcastState();
    return { match };
  }

  @Post("matches/:id/result")
  async matchResult(@Req() req: Request, @Param("id") idParam: string, @Body() body: unknown) {
    const activeTournament = await this.requireScopedTournament(req);
    const id = Number(idParam);
    const parsed = z.object({ winnerId: z.number().int() }).safeParse(body);
    if (!parsed.success) throw new HttpException({ error: parsed.error.flatten() }, HttpStatus.BAD_REQUEST);

    const existing = await this.prisma.match.findUnique({ where: { id } });
    if (!existing) throw new HttpException({ error: "試合が見つかりません。" }, HttpStatus.NOT_FOUND);
    if (existing.tournamentId !== activeTournament.id) {
      throw new HttpException({ error: "試合が見つかりません。" }, HttpStatus.NOT_FOUND);
    }
    if (![existing.player1Id, existing.player2Id].includes(parsed.data.winnerId)) {
      throw new HttpException({ error: "勝者は対戦者から選択してください。" }, HttpStatus.BAD_REQUEST);
    }

    const match = await this.prisma.match.update({
      where: { id },
      data: {
        winnerId: parsed.data.winnerId,
        status: MatchStatus.COMPLETED,
        courtNumber: null,
      },
    });
    await this.tournamentService.attachWinnerToNext(id);
    await this.tournamentService.resolveAutomaticMatches(match.tournamentId);
    await this.tournamentService.updateTournamentStatus(match.tournamentId);
    await this.tournamentService.broadcastState();
    return { match };
  }
}
