// ユーザー情報を取得(ログイン中のユーザー情報)

import { NextResponse } from "next/server";
import { toClientUser } from "@/lib/auth-server";
import { getPrisma } from "@/lib/prisma";
import { getSession } from "@/lib/session-cookie";

// ユーザー情報を取得
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null, isLoggedIn: false });

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return NextResponse.json({ user: null, isLoggedIn: false });

  return NextResponse.json({
    user: toClientUser({ ...user, scope: session.scope }),
    isLoggedIn: true,
  });
}
