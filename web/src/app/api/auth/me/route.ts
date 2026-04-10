// ユーザー情報を取得(ログイン中のユーザー情報)

import { NextResponse } from "next/server";
import { toClientUser } from "@/lib/auth-server";
import { getPrisma } from "@/lib/prisma";
import { getSession } from "@/lib/session-cookie";

// ユーザー情報を取得
export async function GET() {
  const session = await getSession(); // セッションを取得
  if (!session) return NextResponse.json({ user: null, isLoggedIn: false }); // セッションがない場合は何も返さない
  if (session.scope === "login") return NextResponse.json({ user: null, isLoggedIn: true }); // ログイン中の場合は何も返さない

  const prisma = getPrisma(); // Prismaを取得
  const user = await prisma.user.findUnique({ where: { id: session.userId } }); // ユーザーを取得
  if (!user) return NextResponse.json({ user: null, isLoggedIn: false });
  return NextResponse.json({ user: toClientUser({ ...user, scope: session.scope }), isLoggedIn: true }); // ユーザー情報を返す
}
