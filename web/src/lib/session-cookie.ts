// web/src/lib/session-cookie.ts
// Route Handler 用セッション（Cookie）

import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth-server";
import type { SessionPayload } from "@/lib/session.types";

// Route Handler 用セッション（Cookie）を取得
export async function getSession(): Promise<SessionPayload | null> {
  // Cookie からセッションを取得
  const jar = await cookies();
  const token = jar.get("nomiteni_token")?.value;
  // セッションがない場合
  if (!token) return null;
  // セッションを検証
  return verifySessionToken(token);
}
