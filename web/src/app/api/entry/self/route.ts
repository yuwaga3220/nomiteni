import { NextResponse } from "next/server";
import { toClientUser } from "@/lib/auth-server";
import { getPrisma } from "@/lib/prisma";
import { entrySchema } from "@/lib/schemas";
import { requireParticipant } from "@/lib/session-guards";
import { broadcastState, getActiveTournament } from "@/lib/tournament-service";

// 大会エントリー
export async function POST(req: Request) {
  const guard = await requireParticipant(); // 参加者ガードを取得
  if ("error" in guard) return guard.error;

  const body: unknown = await req.json();
  const parsed = entrySchema.safeParse(body);
  if (!parsed.success) { // 大会エントリースキーマをパースできない場合
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const activeTournament = await getActiveTournament();
  if (!activeTournament || !activeTournament.entryPasscode) { // 大会エントリーパスコードが未設定の場合
    return NextResponse.json({ error: "大会エントリーパスコードが未設定です。" }, { status: 401 });
  }
  if (parsed.data.tournamentPasscode !== activeTournament.entryPasscode) { // 大会エントリーパスコードが違う場合
    return NextResponse.json({ error: "大会エントリーパスコードが違います。" }, { status: 401 });
  }

  const prisma = getPrisma();
  const user = await prisma.user.update({ // ユーザーを更新
    where: { id: guard.session.userId },
    data: {
      name: parsed.data.name,
      partyJoin: parsed.data.partyJoin,
      note: parsed.data.note,
    },
  });
  await broadcastState(); // 状態をブロードキャスト
  return NextResponse.json({ user: toClientUser(user) });
}
