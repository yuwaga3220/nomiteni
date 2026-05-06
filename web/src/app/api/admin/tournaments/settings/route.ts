import { NextResponse } from "next/server";
import { requireScopedAdminTournament } from "@/lib/admin-scope";
import { getPrisma } from "@/lib/prisma";
import { tournamentSettingsSchema } from "@/lib/schemas";
import { broadcastState } from "@/lib/tournament-service";

// 大会の設定を取得
export async function GET() {
  const scoped = await requireScopedAdminTournament();
  if ("error" in scoped) return scoped.error;

  const prisma = getPrisma();
  const t = scoped.tournament;
  const participants = await prisma.participant.findMany({ // 参加者を取得
    where: {
      tournamentId: t.id,
    },
    orderBy: [{ initialPosition: "asc" }, { id: "asc" }],
    select: {
      id: true,
      initialPosition: true,
      name: true,
    },
  });
  return NextResponse.json({
    tournament: {
      id: t.id,
      name: t.name,
      eventDate: t.eventDate,
      timeSlot: t.timeSlot,
      courtCount: t.courtCount,
      observerPasscode: t.observerPasscode,
    },
    participants: participants.map((p) => ({
      id: p.id,
      initialPosition: p.initialPosition,
      name: p.name,
    })),
  });
}

// 大会の設定を更新
export async function POST(req: Request) {
  const scoped = await requireScopedAdminTournament();
  if ("error" in scoped) return scoped.error;

  const body: unknown = await req.json();
  const parsed = tournamentSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const prisma = getPrisma();
  await prisma.tournament.update({ // 大会の設定を更新
    where: { id: scoped.tournament.id },
    data: {
      name: parsed.data.name,
      eventDate: parsed.data.eventDate ?? null,
      timeSlot: parsed.data.timeSlot ?? null,
      courtCount: parsed.data.courtCount,
      observerPasscode: parsed.data.observerPasscode,
    },
  });
  await broadcastState();
  return NextResponse.json({ ok: true });
}
