import { NextResponse } from "next/server";
import { z } from "zod";
import { requireScopedAdminTournament } from "@/lib/admin-scope";
import { getPrisma } from "@/lib/prisma";
import { broadcastState } from "@/lib/tournament-service";

export async function POST(req: Request) {
  const scoped = await requireScopedAdminTournament();
  if ("error" in scoped) return scoped.error;

  const body: unknown = await req.json();
  const parsed = z.object({ courtCount: z.number().int().min(1).max(32) }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const prisma = getPrisma();
  await prisma.tournament.update({
    where: { id: scoped.tournament.id },
    data: { courtCount: parsed.data.courtCount },
  });
  await broadcastState();
  return NextResponse.json({ ok: true });
}
