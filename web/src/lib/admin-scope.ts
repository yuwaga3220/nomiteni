// web/src/lib/admin-scope.ts
// 管理者 API の権限検証
import { UserRole } from "@prisma/client"; // ユーザーロール
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
  // 管理者ロールであるか確認
  if (session.role !== UserRole.ADMIN) {
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
  // セッションと大会を返す
  return { session, tournament };
}
