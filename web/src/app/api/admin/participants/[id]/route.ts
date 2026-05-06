import { NextResponse } from "next/server";
import { z } from "zod";
import { requireScopedAdminTournament } from "@/lib/admin-scope";
import { getPrisma } from "@/lib/prisma";
import { broadcastState } from "@/lib/tournament-service";
import { recreateTournamentMatches } from "@/lib/tournament-create";

const participantSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

function requireReadyTournament(status: string) {
  if (status !== "READY") {
    return NextResponse.json({ error: "参加者の変更はREADY状態でのみ行えます。" }, { status: 400 });
  }
  return null;
}

function parseParticipantId(value: string | undefined) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const scoped = await requireScopedAdminTournament();
  if ("error" in scoped) return scoped.error;

  const notReady = requireReadyTournament(scoped.tournament.status);
  if (notReady) return notReady;

  const { id: rawId } = await context.params;
  const id = parseParticipantId(rawId);
  if (!id) {
    return NextResponse.json({ error: "参加者IDが不正です。" }, { status: 400 });
  }

  const body: unknown = await req.json();
  const parsed = participantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const prisma = getPrisma();
  const participant = await prisma.participant.findFirst({
    where: { id, tournamentId: scoped.tournament.id },
  });
  if (!participant) {
    return NextResponse.json({ error: "参加者が見つかりません。" }, { status: 404 });
  }

  const updated = await prisma.participant.update({
    where: { id },
    data: { name: parsed.data.name },
  });

  await broadcastState();
  return NextResponse.json({ participant: updated });
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const scoped = await requireScopedAdminTournament();
  if ("error" in scoped) return scoped.error;

  const notReady = requireReadyTournament(scoped.tournament.status);
  if (notReady) return notReady;

  const { id: rawId } = await context.params;
  const id = parseParticipantId(rawId);
  if (!id) {
    return NextResponse.json({ error: "参加者IDが不正です。" }, { status: 400 });
  }

  const prisma = getPrisma();
  const participant = await prisma.participant.findFirst({
    where: { id, tournamentId: scoped.tournament.id },
  });
  if (!participant) {
    return NextResponse.json({ error: "参加者が見つかりません。" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.participant.delete({ where: { id } });
    await recreateTournamentMatches(tx, scoped.tournament.id);
  });

  await broadcastState();
  return NextResponse.json({ ok: true });
}
