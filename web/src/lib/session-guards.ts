// web/src/lib/session-guards.ts
// セッションチェック
import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session-cookie";

// 参加者のみ実行できるセッション
export async function requireParticipant() {
  // Cookie からセッションを取得
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "ログインが必要です。" }, { status: 401 }) };
  }
  if (session.role !== UserRole.PARTICIPANT) {
    return { error: NextResponse.json({ error: "参加者のみ実行できます。" }, { status: 403 }) };
  }
  return { session };
}

// 任意のセッション
export async function requireAnySession() {
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
  if (session.role !== UserRole.ADMIN) {
    return { error: NextResponse.json({ error: "管理者のみ実行できます。" }, { status: 403 }) };
  }
  return { session };
}
