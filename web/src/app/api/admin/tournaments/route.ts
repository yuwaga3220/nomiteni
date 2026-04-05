// web/src/app/api/admin/tournaments/route.ts
// トーナメントを作成する
import { NextResponse } from "next/server";
import { HttpError } from "@/lib/http-error";
import { tournamentSettingsSchema } from "@/lib/schemas";
import { jsonFromError } from "@/lib/route-utils";
import { requireAdmin } from "@/lib/session-guards";
import { createTournamentWithSettings } from "@/lib/tournament-create";

// トーナメントを作成する
export async function POST(req: Request) {
  // 管理者ログインチェック
  try {
    const guard = await requireAdmin();
    if ("error" in guard) return guard.error;

    // リクエストボディをパース
    const body: unknown = await req.json();
    // トーナメント設定をパース
    const parsed = tournamentSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    // トーナメントを作成
    const result = await createTournamentWithSettings(parsed.data);
    return NextResponse.json(result);
  } catch (e) {
    // エラーを処理
    if (e instanceof HttpError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return jsonFromError(e);
  }
}
