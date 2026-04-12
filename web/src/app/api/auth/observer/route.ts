import { NextResponse } from "next/server";
import { z } from "zod";
import { createToken, toClientUser } from "@/lib/auth-server";
import { getPrisma } from "@/lib/prisma";
import { getSession } from "@/lib/session-cookie";
import { getActiveTournamentByObserverPasscode } from "@/lib/tournament-service";

const observerPasscodeSchema = z.object({
  passcode: z.string().min(1),
});

// 観戦パスコードで大会コンテキストに入る（アカウントログイン済み必須）
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "先にログインしてください。" }, { status: 401 });
  }
  const body: unknown = await req.json();
  const parsed = observerPasscodeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const tournament = await getActiveTournamentByObserverPasscode(parsed.data.passcode);
  if (!tournament) {
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
        tournamentId: tournament.id,
        userId: user.id,
        role: "OBSERVER",
      },
    },
    create: {
      tournamentId: tournament.id,
      userId: user.id,
      role: "OBSERVER",
    },
    update: {},
  });

  const res = NextResponse.json({
    user: toClientUser({ ...user, scope: "observer" }),
  });
  res.cookies.set(
    "nomiteni_token",
    createToken({ userId: user.id, scope: "observer", tournamentId: tournament.id }),
    { httpOnly: true, sameSite: "lax", path: "/" },
  );
  return res;
}
