import { NextResponse } from "next/server";
import { createToken, toClientUser } from "@/lib/auth-server";
import { getPrisma } from "@/lib/prisma";
import { entrySchema } from "@/lib/schemas";
import { requireAnySession } from "@/lib/session-guards";
import { broadcastState, findActiveTournamentByEntryPasscode } from "@/lib/tournament-service";

// 大会エントリー
export async function POST(req: Request) {
  const guard = await requireAnySession();
  if ("error" in guard) return guard.error;

  const body: unknown = await req.json();
  const parsed = entrySchema.safeParse(body);
  if (!parsed.success) { // 大会エントリースキーマをパースできない場合
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const tournament = await findActiveTournamentByEntryPasscode(parsed.data.tournamentPasscode);
  if (!tournament) {
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
  await prisma.userTournamentRole.upsert({
    where: {
      tournamentId_userId_role: {
        tournamentId: tournament.id,
        userId: guard.session.userId,
        role: "PARTICIPANT",
      },
    },
    create: {
      tournamentId: tournament.id,
      userId: guard.session.userId,
      role: "PARTICIPANT",
    },
    update: {},
  });
  
  await broadcastState(); // 状態をブロードキャスト
  const res = NextResponse.json({
    user: toClientUser({ ...user, scope: "participant" }),
  });
  res.cookies.set(
    "nomiteni_token",
    createToken({ userId: user.id, scope: "participant", tournamentId: tournament.id }),
    {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    },
  );
  return res;
}
