import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session-cookie";

export async function requireParticipant() {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "ログインが必要です。" }, { status: 401 }) };
  }
  if (session.role !== UserRole.PARTICIPANT) {
    return { error: NextResponse.json({ error: "参加者のみ実行できます。" }, { status: 403 }) };
  }
  return { session };
}

export async function requireAnySession() {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "ログインが必要です。" }, { status: 401 }) };
  }
  return { session };
}

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
