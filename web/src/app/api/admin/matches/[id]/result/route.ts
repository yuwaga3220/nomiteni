// web/src/app/api/admin/matches/[id]/result/route.ts
// 試合結果を登録する
import { MatchStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireScopedAdminTournament } from "@/lib/admin-scope";
import { getPrisma } from "@/lib/prisma";
import {
  attachWinnerToNext,
  broadcastState,
  resolveAutomaticMatches,
  updateTournamentStatus,
} from "@/lib/tournament-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: RouteContext) {
  const scoped = await requireScopedAdminTournament();
  if ("error" in scoped) return scoped.error;

  const { id: idParam } = await ctx.params;
  const id = Number(idParam);
  const body: unknown = await req.json();
  const parsed = z.object({ winnerId: z.number().int() }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const prisma = getPrisma();
  const existing = await prisma.match.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "試合が見つかりません。" }, { status: 404 });
  }
  if (existing.tournamentId !== scoped.tournament.id) {
    return NextResponse.json({ error: "試合が見つかりません。" }, { status: 404 });
  }
  if (![existing.player1Id, existing.player2Id].includes(parsed.data.winnerId)) {
    return NextResponse.json({ error: "勝者は対戦者から選択してください。" }, { status: 400 });
  }

  const match = await prisma.match.update({
    where: { id },
    data: {
      winnerId: parsed.data.winnerId,
      status: MatchStatus.COMPLETED,
      courtNumber: null,
    },
  });
  await attachWinnerToNext(id);
  await resolveAutomaticMatches(match.tournamentId);
  await updateTournamentStatus(match.tournamentId);
  await broadcastState();
  return NextResponse.json({ match });
}
