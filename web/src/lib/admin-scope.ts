// web/src/lib/admin-scope.ts
// 管理者 API の権限検証

import { NextResponse } from "next/server"; // Next.js のレスポンス
import { getPrisma } from "@/lib/prisma"; // Prisma クライアント
import { getSession } from "@/lib/session-cookie"; // セッションを取得

// 管理者 API の権限検証
export async function requireScopedAdminTournament() {
  // Cookie からセッションを取得
  const session = await getSession();
  // セッションがない場合
  if (!session) {
    return { error: NextResponse.json({ error: "ログインが必要です。" }, { status: 401 }) };
  }
  // 管理者セッションであるか確認
  if (session.scope !== "admin") {
    return { error: NextResponse.json({ error: "管理者のみ実行できます。" }, { status: 403 }) };
  }
  // 大会が紐づいているか確認
  if (!session.tournamentId) {
    return {
      error: NextResponse.json(
        { error: "この管理者セッションには大会が紐づいていません。" },
        { status: 403 },
      ),
    };
  }
  // 大会を取得
  const prisma = getPrisma();
  const tournament = await prisma.tournament.findUnique({ where: { id: session.tournamentId } });
  // 大会が見つからない場合はエラー
  if (!tournament) {
    return { error: NextResponse.json({ error: "該当する大会が見つかりません。" }, { status: 404 }) };
  }
  const admin = await prisma.tournamentAdmin.findUnique({
    where: { tournamentId_userId: { tournamentId: session.tournamentId, userId: session.userId } },
  });
  if (!admin) {
    return { error: NextResponse.json({ error: "管理者権限がありません。" }, { status: 403 }) };
  }
  // セッションと大会を返す
  return { session, tournament };
}
