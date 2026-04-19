import { NextResponse } from "next/server";
import { z } from "zod";
import { createToken, toClientUser } from "@/lib/auth-server";
import { getPrisma } from "@/lib/prisma";
import { getSession } from "@/lib/session-cookie";

const adminPasscodeSchema = z.object({
  passcode: z.string().min(1),
});

// 管理者パスコードで大会コンテキストに入る（アカウントログイン済み必須）
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "先にログインしてください。" }, { status: 401 });
  }

  const body: unknown = await req.json();
  const parsed = adminPasscodeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return NextResponse.json({ error: "ユーザーが見つかりません。" }, { status: 404 });
  }
  const tournament = await prisma.tournament.findUnique({ where: { adminPasscode: parsed.data.passcode } });
  if (!tournament) {
    return NextResponse.json({ error: "管理者パスコードが違います。" }, { status: 401 });
  }
  await prisma.userTournamentRole.upsert({
    where: {
      tournamentId_userId_role: {
        tournamentId: tournament.id,
        userId: user.id,
        role: "ADMIN",
      },
    },
    create: { tournamentId: tournament.id, userId: user.id, role: "ADMIN" },
    update: {},
  });

  const res = NextResponse.json({
    user: toClientUser({ ...user, scope: "admin" }),
    tournamentId: tournament.id,
  });
  res.cookies.set(
    "nomiteni_token",
    createToken({ userId: user.id, scope: "admin", tournamentId: tournament.id }),
    { httpOnly: true, sameSite: "lax", path: "/" },
  );
  return res;
}
