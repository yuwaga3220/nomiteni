/**
 * トーナメント新規作成（ブラケット生成まで）
 */
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

export async function createTournamentWithSettings(data: TournamentSettingsInput) {
  const prisma = getPrisma();

  const runningTournament = await prisma.tournament.findFirst({
    where: { status: TournamentStatus.RUNNING },
    orderBy: { createdAt: "desc" },
  });
  if (runningTournament) {
    throw new HttpError(400, "進行中の大会があるため、新規トーナメントは作成できません。");
  }

  const players = await prisma.user.findMany({
    where: { checkedIn: true, canPlayToday: true },
    select: { id: true },
  });

  await prisma.tournament.updateMany({
    where: { status: TournamentStatus.DRAFT },
    data: { status: TournamentStatus.FINISHED },
  });

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

  await prisma.appSetting.upsert({
    where: { key: COURT_KEY },
    update: { value: String(data.courtCount) },
    create: { key: COURT_KEY, value: String(data.courtCount) },
  });

  if (players.length < 2) {
    await broadcastState();
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

  await resolveAutomaticMatches(tournament.id);
  await updateTournamentStatus(tournament.id);
  await broadcastState();
  return { tournamentId: tournament.id, adminPasscode: tournament.adminPasscode };
}
