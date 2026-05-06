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

export async function POST(req: Request) {
  const scoped = await requireScopedAdminTournament();
  if ("error" in scoped) return scoped.error;

  const notReady = requireReadyTournament(scoped.tournament.status);
  if (notReady) return notReady;

  const body: unknown = await req.json();
  const parsed = participantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const prisma = getPrisma();
  const participant = await prisma.$transaction(async (tx) => {
    const maxInitialPosition = await tx.participant.aggregate({
      where: { tournamentId: scoped.tournament.id },
      _max: { initialPosition: true },
    });
    const created = await tx.participant.create({
      data: {
        tournamentId: scoped.tournament.id,
        name: parsed.data.name,
        initialPosition: (maxInitialPosition._max.initialPosition ?? 0) + 1,
      },
    });
    await recreateTournamentMatches(tx, scoped.tournament.id);
    return created;
  });

  await broadcastState();
  return NextResponse.json({ participant });
}
