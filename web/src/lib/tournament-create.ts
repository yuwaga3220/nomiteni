// web/src/lib/tournament-create.ts
// トーナメント新規作成（ブラケット生成までの処理）
import { TournamentStatus } from "@prisma/client";
import type { z } from "zod";
import { COURT_KEY } from "@/lib/config";
import { issueUniqueAdminPasscode } from "@/lib/admin-passcode";
import { getPrisma } from "@/lib/prisma";
import { tournamentSettingsSchema } from "@/lib/schemas";
import { HttpError } from "@/lib/http-error";
import {
  broadcastState,
  nextPowerOfTwo,
  resolveAutomaticMatches,
  shuffle,
  updateTournamentStatus,
} from "@/lib/tournament-service";

type TournamentSettingsInput = z.infer<typeof tournamentSettingsSchema>;

// トーナメント新規作成（ブラケット生成までの処理）
export async function createTournamentWithSettings(data: TournamentSettingsInput) {
  // プリズマを取得
  const prisma = getPrisma();
  // 進行中のトーナメントを取得
  const runningTournament = await prisma.tournament.findFirst({
    where: { status: TournamentStatus.RUNNING },
    orderBy: { createdAt: "desc" },
  });
  if (runningTournament) {
    throw new HttpError(400, "進行中の大会があるため、新規トーナメントは作成できません。");
  }

  // 参加者を取得
  const players = await prisma.user.findMany({
    where: { checkedIn: true, canPlayToday: true },
    select: { id: true },
  });

  // 進行中のトーナメントを更新
  await prisma.tournament.updateMany({
    where: { status: TournamentStatus.DRAFT },
    data: { status: TournamentStatus.FINISHED },
  });

  // トーナメントを作成
  const tournament = await prisma.tournament.create({
    data: {
      name: data.name,
      adminPasscode: await issueUniqueAdminPasscode(prisma),
      eventDate: data.eventDate ?? null,
      timeSlot: data.timeSlot ?? null,
      courtCount: data.courtCount,
      status: TournamentStatus.DRAFT,
      observerPasscode: data.observerPasscode,
      entryPasscode: data.entryPasscode,
    },
  });

  // コート数を更新
  await prisma.appSetting.upsert({
    where: { key: COURT_KEY },
    update: { value: String(data.courtCount) },
    create: { key: COURT_KEY, value: String(data.courtCount) },
  });

  // 参加者が2名未満の場合
  if (players.length < 2) {
    // ブロードキャスト
    await broadcastState();
    return {
      tournamentId: tournament.id,
      adminPasscode: tournament.adminPasscode,
      warning: "参加可能者が2名未満のため、対戦表はまだ作成されていません。",
    };
  }

  // 参加者をシャッフル
  const shuffled = shuffle(players.map((p) => p.id));
  // 参加者数の次の2の累乗を取得
  const size = nextPowerOfTwo(shuffled.length);
  // ラウンド数を取得
  const rounds = Math.log2(size);
  // スロットを作成
  const slots: Array<number | null> = [...shuffled];
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
