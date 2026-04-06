import { NextResponse } from "next/server";
import { entryPasscodeOnlySchema } from "@/lib/schemas";
import { requireParticipant } from "@/lib/session-guards";
import { getActiveTournament } from "@/lib/tournament-service";

// 大会エントリーパスコードのみで大会情報を取得
export async function POST(req: Request) {
  const guard = await requireParticipant(); // 参加者ガードを取得
  if ("error" in guard) return guard.error;

  const body: unknown = await req.json();
  const parsed = entryPasscodeOnlySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const activeTournament = await getActiveTournament();
  if (!activeTournament || !activeTournament.entryPasscode) { // 大会エントリーパスコードが未設定の場合
    return NextResponse.json({ error: "大会エントリーパスコードが未設定です。" }, { status: 401 });
  }
  if (parsed.data.tournamentPasscode !== activeTournament.entryPasscode) { // 大会エントリーパスコードが違う場合
    return NextResponse.json({ error: "大会エントリーパスコードが違います。" }, { status: 401 });
  }

  return NextResponse.json({ // レスポンスを返す
    tournament: {
      id: activeTournament.id,
      name: activeTournament.name,
      status: activeTournament.status,
    },
  });
}
