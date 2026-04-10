import { NextResponse } from "next/server";
import { createToken, toClientUser } from "@/lib/auth-server";
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
  await prisma.userTournamentRole.upsert({ // ユーザーの大会役割を更新
    where: {
      tournamentId_userId_role: {
        tournamentId: activeTournament.id,
        userId: guard.session.userId,
        role: "PARTICIPANT",
      },
    },
    create: {
      tournamentId: activeTournament.id,
      userId: guard.session.userId,
      role: "PARTICIPANT",
    },
    update: {},
  });
  
  await broadcastState(); // 状態をブロードキャスト
  const res = NextResponse.json({
    user: toClientUser({ ...user, scope: "participant" }),
  });
  res.cookies.set("nomiteni_token", createToken({ userId: user.id, scope: "participant" }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return res;
}
