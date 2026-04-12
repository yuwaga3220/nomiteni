import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { requireAnySession } from "@/lib/session-guards";

// 参加者が選択した大会のリアルタイム状態を取得
export async function GET(req: Request) {
  const guard = await requireAnySession();
  if ("error" in guard) return guard.error;

  const url = new URL(req.url);
  const tournamentId = Number(url.searchParams.get("tournamentId"));
  if (!Number.isFinite(tournamentId) || tournamentId <= 0) {
    return NextResponse.json({ error: "tournamentId が不正です。" }, { status: 400 });
  }

  const prisma = getPrisma();
  const role = await prisma.userTournamentRole.findUnique({ // 参加者ロールを取得
    where: {
      tournamentId_userId_role: {
        tournamentId,
        userId: guard.session.userId,
        role: UserRole.PARTICIPANT,
      },
    },
  });
  if (!role) {
    return NextResponse.json({ error: "この大会の参加者ではありません。" }, { status: 403 });
  }

  const tournament = await prisma.tournament.findUnique({ // 大会を取得
    where: { id: tournamentId },
    select: {
      id: true,
      name: true,
      eventDate: true,
      timeSlot: true,
      courtCount: true,
      status: true,
      matches: {
        orderBy: [{ round: "asc" }, { position: "asc" }],
        select: {
          id: true,
          tournamentId: true,
          round: true,
          position: true,
          player1Id: true,
          player2Id: true,
          winnerId: true,
          status: true,
          courtNumber: true,
        },
      },
    },
  });
  if (!tournament) {
    return NextResponse.json({ error: "大会が見つかりません。" }, { status: 404 });
  }

  const users = await prisma.user.findMany({ // 参加者を取得
    where: {
      tournamentRoles: {
        some: {
          tournamentId,
          role: UserRole.PARTICIPANT,
        },
      },
    },
    orderBy: [{ checkedIn: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      checkedIn: true,
      canPlayToday: true,
      partyJoin: true,
      note: true,
    },
  });

  return NextResponse.json({ // レスポンスを返す
    users,
    activeTournament: tournament,
    courtCount: tournament.courtCount,
  });
}
