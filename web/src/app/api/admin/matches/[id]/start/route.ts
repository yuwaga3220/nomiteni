// web/src/app/api/admin/matches/[id]/start/route.ts
// 試合を開始する
import { MatchStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireScopedAdminTournament } from "@/lib/admin-scope";
import { getPrisma } from "@/lib/prisma";
import { broadcastState } from "@/lib/tournament-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: RouteContext) {
  const scoped = await requireScopedAdminTournament();
  if ("error" in scoped) return scoped.error;

  const { id: idParam } = await ctx.params;
  const id = Number(idParam);
  const prisma = getPrisma();
  const current = await prisma.match.findUnique({ where: { id } });
  if (!current || current.tournamentId !== scoped.tournament.id) {
    return NextResponse.json({ error: "試合が見つかりません。" }, { status: 404 });
  }
  const match = await prisma.match.update({
    where: { id },
    data: { status: MatchStatus.RUNNING },
  });
  await broadcastState();
  return NextResponse.json({ match });
}
