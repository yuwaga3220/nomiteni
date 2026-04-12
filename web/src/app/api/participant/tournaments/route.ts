import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireAnySession } from "@/lib/session-guards";

// 参加者として紐づいている大会一覧を取得
export async function GET() {
  const guard = await requireAnySession();
  if ("error" in guard) return guard.error;

  const prisma = getPrisma();
  const roles = await prisma.userTournamentRole.findMany({
    where: {
      userId: guard.session.userId,
      role: "PARTICIPANT",
    },
    include: {
      tournament: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return NextResponse.json({
    tournaments: roles.map((r) => ({
      id: r.tournament.id,
      name: r.tournament.name,
      eventDate: r.tournament.eventDate,
      timeSlot: r.tournament.timeSlot,
      courtCount: r.tournament.courtCount,
      entryPasscode: r.tournament.entryPasscode,
      observerPasscode: r.tournament.observerPasscode,
      status: r.tournament.status,
    })),
  });
}
