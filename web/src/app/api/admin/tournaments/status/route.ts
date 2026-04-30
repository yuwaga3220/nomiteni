import { NextResponse } from "next/server";
import { TournamentStatus } from "@prisma/client";
import { requireScopedAdminTournament } from "@/lib/admin-scope";
import { getPrisma } from "@/lib/prisma";
import { tournamentStatusSchema } from "@/lib/schemas";
import { recreateTournamentMatches } from "@/lib/tournament-create";
import { broadcastState, resolveAutomaticMatches } from "@/lib/tournament-service";

// 大会のstatusのstatusを更新
export async function POST(req: Request) {
  const scoped = await requireScopedAdminTournament();
  if ("error" in scoped) return scoped.error;

  const body: unknown = await req.json();
  const parsed = tournamentStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const prisma = getPrisma();
  const nextStatus = parsed.data.status;

  await prisma.$transaction(async (tx) => {
    // RUNNINGの場合はmatchesを再生成
    if (nextStatus === TournamentStatus.RUNNING) {
      await recreateTournamentMatches(tx, scoped.tournament.id);
    }

    await tx.tournament.update({
      where: { id: scoped.tournament.id },
      data: { status: nextStatus },
    });
  });
  
  // RUNNINGの場合は自動試合を解決
  if (nextStatus === TournamentStatus.RUNNING) {
    await resolveAutomaticMatches(scoped.tournament.id);
  }

  await broadcastState();
  return NextResponse.json({ ok: true });
}
