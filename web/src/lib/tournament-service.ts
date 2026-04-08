// web/src/lib/tournament-service.ts
// トーナメント状態・試合進行（旧 TournamentService）
import { MatchStatus, TournamentStatus } from "@prisma/client";
import { COURT_KEY } from "@/lib/config";
import { getPrisma } from "@/lib/prisma";
import { emitStateUpdate } from "@/lib/socket-registry";

// 2の累乗を取得
export function nextPowerOfTwo(n: number): number {
  let v = 1;
  while (v < n) v *= 2;
  return v;
}

// シャッフル
export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// コート数を取得
export async function getCourtCount(): Promise<number> {
  const prisma = getPrisma();
  const activeTournament = await getActiveTournament();
  if (activeTournament?.courtCount) return activeTournament.courtCount;
  const setting = await prisma.appSetting.findUnique({ where: { key: COURT_KEY } });
  return Number(setting?.value ?? "2");
}

// 開催状況と参加者情報を含む状態を取得(大会の開催状況の公開用)
export async function buildPublicState() {
  const prisma = getPrisma();
  // prismaから現在開催中の大会を取得
  const activeTournament = await prisma.tournament.findFirst({ 
    where: {
      status: { in: [TournamentStatus.DRAFT, TournamentStatus.RUNNING] },
    }, // 草稿または開催中の大会を取得
    orderBy: { createdAt: "desc" }, // 作成日時で降順にソート
    select: {
      id: true,
      name: true,
      eventDate: true,
      timeSlot: true,
      courtCount: true,
      status: true,
      matches: {
        orderBy: [{ round: "asc" }, { position: "asc" }], // ラウンドと位置で昇順にソート
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

  // prismaから参加者を取得
  const users = await prisma.user.findMany({
    orderBy: [{ checkedIn: "desc" }, { name: "asc" }], // チェックイン日時で降順にソート、名前で昇順にソート
    select: {
      id: true,
      name: true,
      checkedIn: true,
      canPlayToday: true,
      partyJoin: true,
      note: true,
    },
  });

  const courtCount = await getCourtCount(); // コート数を取得
  return { users, activeTournament, courtCount }; // 状態を返す
}

// アクティブなトーナメントを取得
export async function getActiveTournament() {
  const prisma = getPrisma();
  return prisma.tournament.findFirst({
    where: { status: { in: [TournamentStatus.DRAFT, TournamentStatus.RUNNING] } },
    orderBy: { createdAt: "desc" },
  });
}

// 公開状態をブロードキャスト
export async function broadcastState() {
  emitStateUpdate(await buildPublicState());
}

// 勝者を次の試合に追加
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
      if (match.status === MatchStatus.COMPLETED) continue;
      const players = [match.player1Id, match.player2Id].filter(Boolean) as number[];
      const feedersDone =
        match.round === 1 || match.feeders.every((f) => f.status === MatchStatus.COMPLETED);
      if (!feedersDone) continue;

      if (players.length === 0) {
        await prisma.match.update({
          where: { id: match.id },
          data: { status: MatchStatus.COMPLETED, winnerId: null, courtNumber: null },
        });
        await attachWinnerToNext(match.id);
        changed = true;
      } else if (players.length === 1) {
        await prisma.match.update({
          where: { id: match.id },
          data: { status: MatchStatus.COMPLETED, winnerId: players[0], courtNumber: null },
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
  if (finalMatch.status === MatchStatus.COMPLETED) {
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
