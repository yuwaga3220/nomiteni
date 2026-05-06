// web/src/lib/tournament-service.ts
// トーナメント状態・試合進行の処理
import { MatchStatus, TournamentStatus } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { emitStateUpdate } from "@/lib/socket-registry";

// トーナメントの足の数を計算
export function getBracketSize(n: number): number {
  let v = 1;
  while (v < n) v *= 2;
  return v;
}

// 参加者をランダムで並べる
export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]; // 要素を交換
  }
  return arr;
}

// activeな大会とユーザ情報を取得（HomePageでの公開用）
export async function buildPublicState() {
  const prisma = getPrisma();
  const activeTournaments = await prisma.tournament.findMany({
    where: {
      status: {
        in: [
          TournamentStatus.READY,
          TournamentStatus.RUNNING,
          TournamentStatus.FINISHED,
        ],
      },
    },
    orderBy: { id: "desc" },
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
  const tournamentIds = activeTournaments.map((tournament) => tournament.id);
  const participants = tournamentIds.length
    ? await prisma.participant.findMany({
      where: { tournamentId: { in: tournamentIds } },
      orderBy: [{ initialPosition: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
      },
    })
    : [];
  const publicParticipants = participants.map((participant) => ({
    id: participant.id,
    name: participant.name,
  }));
  return { participants: publicParticipants, activeTournaments };
}

// 観戦パスコードが一致するRUNNING OR FINISHEDのトーナメントをひとつだけ取得
export async function getActiveTournamentByObserverPasscode(passcode: string) {
  const prisma = getPrisma();
  return prisma.tournament.findFirst({
    where: {
      status: { in: [TournamentStatus.RUNNING, TournamentStatus.FINISHED] },
      observerPasscode: passcode,
    },
    orderBy: { id: "desc" },
  });
}

// 公開状態をブロードキャスト
export async function broadcastState() {
  emitStateUpdate(await buildPublicState());
}

// 勝者を次の試合に設定
export async function attachWinnerToNext(matchId: number) {
  const prisma = getPrisma();
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match || !match.nextMatchId) return;
  const slot = match.position % 2 === 1 ? "player1Id" : "player2Id";
  await prisma.match.update({
    where: { id: match.nextMatchId },
    data: { [slot]: match.winnerId ?? null },
  });
}

// 自動試合を解決
export async function resolveAutomaticMatches(tournamentId: number) {
  const prisma = getPrisma();
  let changed = true;
  while (changed) {
    changed = false;
    const matches = await prisma.match.findMany({
      where: { tournamentId },
      include: { feeders: true },
      orderBy: [{ round: "asc" }, { position: "asc" }],
    });

    for (const match of matches) {
      if (match.status === MatchStatus.FINISHED) continue;
      const players = [match.player1Id, match.player2Id].filter(Boolean) as number[];
      const feedersDone =
        match.round === 1 || match.feeders.every((f) => f.status === MatchStatus.FINISHED);
      if (!feedersDone) continue;

      if (players.length === 0) {
        await prisma.match.update({
          where: { id: match.id },
          data: { status: MatchStatus.FINISHED, winnerId: null, courtNumber: null },
        });
        await attachWinnerToNext(match.id);
        changed = true;
      } else if (players.length === 1) {
        await prisma.match.update({
          where: { id: match.id },
          data: { status: MatchStatus.FINISHED, winnerId: players[0], courtNumber: null },
        });
        await attachWinnerToNext(match.id);
        changed = true;
      }
    }
  }
}

// トーナメント状態を更新
export async function updateTournamentStatus(tournamentId: number) {
  const prisma = getPrisma();
  const finalMatch = await prisma.match.findFirst({
    where: { tournamentId },
    orderBy: [{ round: "desc" }, { position: "desc" }],
  });
  if (!finalMatch) return;
  if (finalMatch.status === MatchStatus.FINISHED) {
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: TournamentStatus.FINISHED },
    });
  } else {
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: TournamentStatus.RUNNING },
    });
  }
}
