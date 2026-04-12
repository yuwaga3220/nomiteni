import { NextResponse } from "next/server";
import { createToken, toClientUser } from "@/lib/auth-server";
import { getPrisma } from "@/lib/prisma";
import { getSession } from "@/lib/session-cookie";

// ホーム用: セッションを scope: login（tournamentId なし）に正規化
export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return NextResponse.json({ error: "ユーザーが見つかりません。" }, { status: 404 });
  }

  const atLoginHub = session.scope === "login" && session.tournamentId === undefined;
  if (atLoginHub) {
    return NextResponse.json({
      ok: true,
      user: toClientUser({ ...user, scope: "login" }),
    });
  }

  const res = NextResponse.json({
    ok: true,
    user: toClientUser({ ...user, scope: "login" }),
  });
  res.cookies.set("nomiteni_token", createToken({ userId: user.id, scope: "login" }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return res;
}
