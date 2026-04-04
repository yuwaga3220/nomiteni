import { MatchStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireScopedAdminTournament } from "@/lib/admin-scope";
import { getPrisma } from "@/lib/prisma";
import { broadcastState } from "@/lib/tournament-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: RouteContext) {
  const scoped = await requireScopedAdminTournament();
  if ("error" in scoped) return scoped.error;

  const { id: idParam } = await ctx.params;
  const id = Number(idParam);
  const body: unknown = await req.json();
  const parsed = z.object({ courtNumber: z.number().int().min(1) }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const prisma = getPrisma();
  const current = await prisma.match.findUnique({ where: { id } });
  if (!current || current.tournamentId !== scoped.tournament.id) {
    return NextResponse.json({ error: "試合が見つかりません。" }, { status: 404 });
  }
  const match = await prisma.match.update({
    where: { id },
    data: { courtNumber: parsed.data.courtNumber, status: MatchStatus.ASSIGNED },
  });
  await broadcastState();
  return NextResponse.json({ match });
}
