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
  const participants = await (prisma as unknown as {
    userTournamentRole: { // 参加者を取得
      findMany: (args: unknown) => Promise<Array<{
        userId: number;
        initialPosition: number | null;
        user: { name: string | null };
      }>>;
    };
  }).userTournamentRole.findMany({ // 参加者を取得
    where: {
      tournamentId: t.id,
      role: "PARTICIPANT",
    },
    orderBy: [{ initialPosition: "asc" }, { userId: "asc" }],
    select: {
      userId: true,
      initialPosition: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  });
  return NextResponse.json({
    tournament: {
      id: t.id,
      name: t.name,
      eventDate: t.eventDate,
      timeSlot: t.timeSlot,
      courtCount: t.courtCount,
      entryPasscode: t.entryPasscode,
      observerPasscode: t.observerPasscode,
    },
    participants: participants.map((p) => ({
      userId: p.userId,
      initialPosition: p.initialPosition,
      name: p.user.name ?? `Player #${p.userId}`,
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
      entryPasscode: parsed.data.entryPasscode,
      observerPasscode: parsed.data.observerPasscode,
    },
  });
  await broadcastState();
  return NextResponse.json({ ok: true });
}
