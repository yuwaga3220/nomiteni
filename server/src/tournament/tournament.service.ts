/**
 * トーナメントサービス
 */
import { Injectable } from "@nestjs/common";
import { MatchStatus, TournamentStatus, UserRole } from "@prisma/client";
import { COURT_KEY } from "../config";
import { PrismaService } from "../prisma/prisma.service";
import { StateSocketService } from "../realtime/state-socket.service";

export function nextPowerOfTwo(n: number): number {
  let v = 1;
  while (v < n) v *= 2;
  return v;
}

export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

@Injectable()
export class TournamentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stateSocket: StateSocketService,
  ) {}

  async getCourtCount(): Promise<number> {
    const activeTournament = await this.getActiveTournament();
    if (activeTournament?.courtCount) return activeTournament.courtCount;
    const setting = await this.prisma.appSetting.findUnique({ where: { key: COURT_KEY } });
    return Number(setting?.value ?? "2");
  }

  async buildPublicState() {
    const activeTournament = await this.prisma.tournament.findFirst({
      where: {
        status: { in: [TournamentStatus.DRAFT, TournamentStatus.RUNNING] },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        eventDate: true,
        timeSlot: true,
        courtCount: true,
        status: true,
        matches: {
          orderBy: [{ round: "asc" }, { position: "asc" }],
          select: {
            id: true,
            tournamentId: true,
            round: true,
            position: true,
            player1Id: true,
            player2Id: true,
            winnerId: true,
            status: true,
            courtNumber: true,
          },
        },
      },
    });

    const users = await this.prisma.user.findMany({
      where: { role: UserRole.PARTICIPANT },
      orderBy: [{ checkedIn: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        checkedIn: true,
        canPlayToday: true,
        partyJoin: true,
        note: true,
      },
    });

    const courtCount = await this.getCourtCount();
    return { users, activeTournament, courtCount };
  }

  async getActiveTournament() {
    return this.prisma.tournament.findFirst({
      where: { status: { in: [TournamentStatus.DRAFT, TournamentStatus.RUNNING] } },
      orderBy: { createdAt: "desc" },
    });
  }

  async broadcastState() {
    this.stateSocket.emit("state:update", await this.buildPublicState());
  }

  async attachWinnerToNext(matchId: number) {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match || !match.nextMatchId) return;
    const slot = match.position % 2 === 1 ? "player1Id" : "player2Id";
    await this.prisma.match.update({
      where: { id: match.nextMatchId },
      data: { [slot]: match.winnerId ?? null },
    });
  }

  async resolveAutomaticMatches(tournamentId: number) {
    let changed = true;
    while (changed) {
      changed = false;
      const matches = await this.prisma.match.findMany({
        where: { tournamentId },
        include: { feeders: true },
        orderBy: [{ round: "asc" }, { position: "asc" }],
      });

      for (const match of matches) {
        if (match.status === MatchStatus.COMPLETED) continue;
        const players = [match.player1Id, match.player2Id].filter(Boolean) as number[];
        const feedersDone = match.round === 1 || match.feeders.every((f) => f.status === MatchStatus.COMPLETED);
        if (!feedersDone) continue;

        if (players.length === 0) {
          await this.prisma.match.update({
            where: { id: match.id },
            data: { status: MatchStatus.COMPLETED, winnerId: null, courtNumber: null },
          });
          await this.attachWinnerToNext(match.id);
          changed = true;
        } else if (players.length === 1) {
          await this.prisma.match.update({
            where: { id: match.id },
            data: { status: MatchStatus.COMPLETED, winnerId: players[0], courtNumber: null },
          });
          await this.attachWinnerToNext(match.id);
          changed = true;
        }
      }
    }
  }

  async updateTournamentStatus(tournamentId: number) {
    const finalMatch = await this.prisma.match.findFirst({
      where: { tournamentId },
      orderBy: [{ round: "desc" }, { position: "desc" }],
    });
    if (!finalMatch) return;
    if (finalMatch.status === MatchStatus.COMPLETED) {
      await this.prisma.tournament.update({
        where: { id: tournamentId },
        data: { status: TournamentStatus.FINISHED },
      });
    } else {
      await this.prisma.tournament.update({
        where: { id: tournamentId },
        data: { status: TournamentStatus.RUNNING },
      });
    }
  }
}
