import { NextResponse } from "next/server";
import { requireScopedAdminTournament } from "@/lib/admin-scope";
import { getPrisma } from "@/lib/prisma";
import { tournamentStatusSchema } from "@/lib/schemas";
import { broadcastState } from "@/lib/tournament-service";

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
  await prisma.tournament.update({
    where: { id: scoped.tournament.id },
    data: { status: parsed.data.status },
  });

  await broadcastState();
  return NextResponse.json({ ok: true });
}
