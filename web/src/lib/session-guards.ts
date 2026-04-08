// web/src/lib/session-guards.ts
// セッションチェック

import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getSession } from "@/lib/session-cookie";

// 任意のセッション
export async function requireAnySession() {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "ログインが必要です。" }, { status: 401 }) };
  }
  return { session };
}

// 参加者のみ実行できるセッション
export async function requireParticipant() {
  // Cookie からセッションを取得
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "ログインが必要です。" }, { status: 401 }) };
  }
  return { session };
}

// 管理者のみ実行できるセッション
export async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "ログインが必要です。" }, { status: 401 }) };
  }
  if (session.scope !== "admin" || !session.tournamentId) {
    return { error: NextResponse.json({ error: "管理者のみ実行できます。" }, { status: 403 }) };
  }
  const prisma = getPrisma();
  const admin = await prisma.tournamentAdmin.findUnique({
    where: { tournamentId_userId: { tournamentId: session.tournamentId, userId: session.userId } },
  });
  if (!admin) {
    return { error: NextResponse.json({ error: "管理者権限がありません。" }, { status: 403 }) };
  }
  return { session };
}
