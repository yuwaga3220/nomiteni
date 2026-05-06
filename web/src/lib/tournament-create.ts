// web/src/lib/tournament-create.ts
// トーナメント新規作成（ブラケット生成までの処理）
import { Prisma, PrismaClient, TournamentStatus } from "@prisma/client";
import type { z } from "zod";
import { issueUniqueAdminPasscode } from "@/lib/admin-passcode";
import { getPrisma } from "@/lib/prisma";
import { tournamentSettingsSchema } from "@/lib/schemas";
import {
  broadcastState,
  getBracketSize,
  resolveAutomaticMatches,
  updateTournamentStatus,
} from "@/lib/tournament-service";

type TournamentSettingsInput = z.infer<typeof tournamentSettingsSchema>;
type DbClient = PrismaClient | Prisma.TransactionClient;

function sortByInitialPosition(
  a: { id: number; initialPosition: number | null }, 
  b: { id: number; initialPosition: number | null }
) {
  const aPos = a.initialPosition ?? Number.MAX_SAFE_INTEGER;
  const bPos = b.initialPosition ?? Number.MAX_SAFE_INTEGER;
  if (aPos !== bPos) return aPos - bPos;
  return a.id - b.id;
}

export async function recreateTournamentMatches(db: DbClient, tournamentId: number) {
  const players = await db.participant.findMany({
    where: { tournamentId },
    select: { id: true, initialPosition: true },
  });

  // 既存の該当トーナメントのmatchesを全て削除
  await db.match.deleteMany({ where: { tournamentId } });

  if (players.length < 2) return 0;

  const playerIds = [...players].sort(sortByInitialPosition).map((p) => p.id);
  const size = getBracketSize(playerIds.length);
  const rounds = Math.log2(size); // ラウンド数
  const slots: Array<number | null> = [...playerIds];
  while (slots.length < size) slots.push(null); // nullも含めた配列

  const createdIds = new Map<string, number>();
  for (let round = 1; round <= rounds; round++) {
    const count = size / 2 ** round; // **が先
    for (let position = 1; position <= count; position++) {
      // 初戦のみplayer1Idとplayer2Idを設定
      const createData =
        round === 1
          ? {
              player1Id: slots[(position - 1) * 2],
              player2Id: slots[(position - 1) * 2 + 1],
            }
          : {};
      const match = await db.match.create({
        data: {
          tournamentId,
          round,
          position,
          ...createData,
        },
      });
      createdIds.set(`${round}-${position}`, match.id);
    }
  }

  // nextMatchIdを設定
  for (let round = 1; round < rounds; round++) {
    const count = size / 2 ** round;
    for (let position = 1; position <= count; position++) {
      const id = createdIds.get(`${round}-${position}`)!;
      const nextId = createdIds.get(`${round + 1}-${Math.ceil(position / 2)}`)!;
      await db.match.update({
        where: { id },
        data: { nextMatchId: nextId },
      });
    }
  }

  return createdIds.size;
}

// トーナメント新規作成（ブラケット生成までの処理）
export async function createTournamentWithSettings(data: TournamentSettingsInput) {
  const prisma = getPrisma();
  
  // トーナメントを作成
  const tournament = await prisma.tournament.create({
    data: {
      name: data.name,
      adminPasscode: await issueUniqueAdminPasscode(prisma),
      eventDate: data.eventDate ?? null,
      timeSlot: data.timeSlot ?? null,
      courtCount: data.courtCount,
      status: TournamentStatus.ENTRY,
      observerPasscode: data.observerPasscode,
    },
  });

  const createdMatchCount = await recreateTournamentMatches(prisma, tournament.id);
  if (createdMatchCount < 1) { // 参加者が2名未満の場合
    await broadcastState();
    return {
      tournamentId: tournament.id,
      adminPasscode: tournament.adminPasscode,
      warning: "参加可能者が2名未満のため、対戦表はまだ作成されていません。",
    };
  }
  
  // 自動的な試合を解決
  await resolveAutomaticMatches(tournament.id);
  // トーナメントステータスを更新
  await updateTournamentStatus(tournament.id);
  // ブロードキャスト
  await broadcastState();
  // トーナメントIDと管理者パスコードを返す
  return { tournamentId: tournament.id, adminPasscode: tournament.adminPasscode };
}
