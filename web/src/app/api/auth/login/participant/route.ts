import { NextResponse } from "next/server";
import { createToken, toClientUser } from "@/lib/auth-server";
import { getPrisma } from "@/lib/prisma";
import { getSession } from "@/lib/session-cookie";
import { broadcastState } from "@/lib/tournament-service";

// 参加者ログイン（事前ログイン済みユーザー向け）
export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "先にログインしてください。" }, { status: 401 });
  }

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return NextResponse.json({ error: "ユーザーが見つかりません。" }, { status: 404 });
  }

  const res = NextResponse.json({
    user: toClientUser({ ...user, scope: "participant" }),
  });
  res.cookies.set("nomiteni_token", createToken({ userId: user.id, scope: "participant" }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  await broadcastState();
  return res;
}
