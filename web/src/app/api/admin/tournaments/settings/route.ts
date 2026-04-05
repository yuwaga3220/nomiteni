import { NextResponse } from "next/server";
import { COURT_KEY } from "@/lib/config";
import { requireScopedAdminTournament } from "@/lib/admin-scope";
import { getPrisma } from "@/lib/prisma";
import { tournamentSettingsSchema } from "@/lib/schemas";
import { broadcastState } from "@/lib/tournament-service";

export async function GET() {
  const scoped = await requireScopedAdminTournament();
  if ("error" in scoped) return scoped.error;

  const t = scoped.tournament;
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
  });
}

export async function POST(req: Request) {
  const scoped = await requireScopedAdminTournament();
  if ("error" in scoped) return scoped.error;

  const body: unknown = await req.json();
  const parsed = tournamentSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const prisma = getPrisma();
  await prisma.tournament.update({
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
  await prisma.appSetting.upsert({
    where: { key: COURT_KEY },
    update: { value: String(parsed.data.courtCount) },
    create: { key: COURT_KEY, value: String(parsed.data.courtCount) },
  });
  await broadcastState();
  return NextResponse.json({ ok: true });
}
