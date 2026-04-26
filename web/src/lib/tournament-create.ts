// web/src/lib/tournament-create.ts
// トーナメント新規作成（ブラケット生成までの処理）
import { TournamentStatus } from "@prisma/client";
import type { z } from "zod";
import { issueUniqueAdminPasscode } from "@/lib/admin-passcode";
import { getPrisma } from "@/lib/prisma";
import { tournamentSettingsSchema } from "@/lib/schemas";
import {
  broadcastState,
  nextPowerOfTwo,
  resolveAutomaticMatches,
  updateTournamentStatus,
} from "@/lib/tournament-service";

type TournamentSettingsInput = z.infer<typeof tournamentSettingsSchema>;

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
      entryPasscode: data.entryPasscode,
    },
  });

  const players = await prisma.userTournamentRole.findMany({
    where: { tournamentId: tournament.id, role: "PARTICIPANT" },
    select: { userId: true, initialPosition: true },
  });
  if (players.length < 2) { // 参加者が2名未満の場合
    await broadcastState();
    return {
      tournamentId: tournament.id,
      adminPasscode: tournament.adminPasscode,
      warning: "参加可能者が2名未満のため、対戦表はまだ作成されていません。",
    };
  }
  
  // 大会内の初期ポジション順で参加者を確定し、未設定者は後ろに寄せる（昇順）
  const playerIds = [...players]
    .sort((a, b) => {
      const aPos = a.initialPosition ?? Number.MAX_SAFE_INTEGER;
      const bPos = b.initialPosition ?? Number.MAX_SAFE_INTEGER;
      if (aPos !== bPos) return aPos - bPos;
      return a.userId - b.userId;
    })
    .map((p) => p.userId); // 参加者IDを取得（大会内の初期ポジション順）
  const size = nextPowerOfTwo(playerIds.length); // 参加者数の次の2の累乗を取得
  const rounds = Math.log2(size); // ラウンド数を取得
  const slots: Array<number | null> = [...playerIds]; // スロットを作成
  while (slots.length < size) slots.push(null);

  // 試合を作成
  const createdIds = new Map<string, number>();
  // ラウンド数をループ
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
      const match = await prisma.match.create({
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

  // 次のラウンドの試合を更新
  for (let round = 1; round < rounds; round++) {
    const count = size / 2 ** round;
    for (let position = 1; position <= count; position++) {
      const id = createdIds.get(`${round}-${position}`)!;
      const nextId = createdIds.get(`${round + 1}-${Math.ceil(position / 2)}`)!;
      await prisma.match.update({
        where: { id },
        data: { nextMatchId: nextId },
      });
    }
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
