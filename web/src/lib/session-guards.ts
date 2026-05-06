// web/src/lib/session-guards.ts
// セッションチェック

import { NextResponse } from "next/server";
import { getSession } from "@/lib/session-cookie";
import type { SessionPayload } from "@/lib/session.types";

type LoggedInSession = SessionPayload & { userId: number };

// ログイン済みセッション必須（スコープは問わない）
export async function requireAnySession(): Promise<{ session: LoggedInSession } | { error: NextResponse }> {
  const session = await getSession();
  if (!session?.userId) {
    return { error: NextResponse.json({ error: "ログインが必要です。" }, { status: 401 }) };
  }
  return { session: session as LoggedInSession };
}

// 管理者のみ実行できるセッション
export async function requireAdmin() {
  const guard = await requireAnySession();
  if ("error" in guard) return guard;
  const { session } = guard;
  if (session.scope !== "admin" || !session.tournamentId) {
    return { error: NextResponse.json({ error: "管理者のみ実行できます。" }, { status: 403 }) };
  }
  return { session };
}
