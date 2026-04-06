import { NextResponse } from "next/server";
import { HttpError } from "@/lib/http-error";
import { tournamentSettingsSchema } from "@/lib/schemas";
import { jsonFromError } from "@/lib/route-utils";
import { requireAnySession } from "@/lib/session-guards";
import { createTournamentWithSettings } from "@/lib/tournament-create";

// 大会を作成
export async function POST(req: Request) {
  try {
    const guard = await requireAnySession(); // セッションガードを取得
    if ("error" in guard) return guard.error;

    const body: unknown = await req.json();
    const parsed = tournamentSettingsSchema.safeParse(body);
    if (!parsed.success) { // 大会設定スキーマをパースできない場合
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const result = await createTournamentWithSettings(parsed.data); // 大会を作成
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof HttpError) { // HttpErrorの場合
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return jsonFromError(e);
  }
}
