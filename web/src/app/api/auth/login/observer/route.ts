// web/src/app/api/auth/login/observer/route.ts
// 観戦者ログイン（事前ログイン済みユーザー向け）

import { NextResponse } from "next/server";
import { z } from "zod";
import { createToken, toClientUser } from "@/lib/auth-server";
import { getPrisma } from "@/lib/prisma";
import { getSession } from "@/lib/session-cookie";
import { getActiveTournament } from "@/lib/tournament-service";

const loginObserverSchema = z.object({
  passcode: z.string().min(1),
});

// 観戦者ログイン（事前ログイン済みユーザー向け）
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "先にログインしてください。" }, { status: 401 });
  }

  const body: unknown = await req.json();
  const parsed = loginObserverSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const activeTournament = await getActiveTournament();
  if (!activeTournament || !activeTournament.observerPasscode) { // 観戦パスコードが未設定の場合はエラーを返す
    return NextResponse.json({ error: "観戦パスコードが未設定です。" }, { status: 401 });
  }
  if (parsed.data.passcode !== activeTournament.observerPasscode) { // 観戦パスコードが違う場合はエラーを返す
    return NextResponse.json({ error: "観戦パスコードが違います。" }, { status: 401 });
  }

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return NextResponse.json({ error: "ユーザーが見つかりません。" }, { status: 404 });
  }

  await prisma.userTournamentRole.upsert({
    where: {
      tournamentId_userId_role: {
        tournamentId: activeTournament.id,
        userId: user.id,
        role: "OBSERVER",
      },
    },
    create: {
      tournamentId: activeTournament.id,
      userId: user.id,
      role: "OBSERVER",
    },
    update: {},
  });
  
  const res = NextResponse.json({
    user: toClientUser({ ...user, scope: "observer" }),
  });
  res.cookies.set("nomiteni_token", createToken({ userId: user.id, scope: "observer" }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return res;
}
