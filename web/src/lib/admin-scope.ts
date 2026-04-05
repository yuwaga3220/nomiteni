/**
 * 管理者 API の大会スコープ検証
 */
import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getSession } from "@/lib/session-cookie";

export async function requireScopedAdminTournament() {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "ログインが必要です。" }, { status: 401 }) };
  }
  if (session.role !== UserRole.ADMIN) {
    return { error: NextResponse.json({ error: "管理者のみ実行できます。" }, { status: 403 }) };
  }
  if (!session.tournamentId) {
    return {
      error: NextResponse.json(
        { error: "この管理者セッションには大会が紐づいていません。" },
        { status: 403 },
      ),
    };
  }
  const prisma = getPrisma();
  const tournament = await prisma.tournament.findUnique({ where: { id: session.tournamentId } });
  if (!tournament) {
    return { error: NextResponse.json({ error: "該当する大会が見つかりません。" }, { status: 404 }) };
  }
  return { session, tournament };
}
