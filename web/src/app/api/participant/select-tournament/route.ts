import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createToken, toClientUser } from "@/lib/auth-server";
import { getPrisma } from "@/lib/prisma";
import { getSession } from "@/lib/session-cookie";

const selectTournamentSchema = z.object({
  tournamentId: z.number().int().positive(),
});

// エントリー済みの大会を選び、参加者のセッションに tournamentId だけを載せる
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "先にログインしてください。" }, { status: 401 });
  }

  if (session.scope !== "participant" && session.scope !== "login") {
    return NextResponse.json({ error: "参加者として進行してください。" }, { status: 403 });
  }

  const body: unknown = await req.json();
  const parsed = selectTournamentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // 該当大会の参加者ロールが存在するか確認
  const prisma = getPrisma();
  const role = await prisma.userTournamentRole.findUnique({
    where: {
      tournamentId_userId_role: {
        tournamentId: parsed.data.tournamentId,
        userId: session.userId,
        role: UserRole.PARTICIPANT,
      },
    },
  });
  if (!role) {
    return NextResponse.json({ error: "この大会の参加者ではありません。" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return NextResponse.json({ error: "ユーザーが見つかりません。" }, { status: 404 });
  }

  const res = NextResponse.json({
    user: toClientUser({ ...user, scope: "participant" }),
  });
  res.cookies.set(
    "nomiteni_token",
    createToken({
      userId: user.id,
      scope: "participant",
      tournamentId: parsed.data.tournamentId, // ここが重要
    }),
    { httpOnly: true, sameSite: "lax", path: "/" },
  );
  return res;
}
