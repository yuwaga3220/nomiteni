// web/src/lib/session-cookie.ts
// セッションを取得し、ペイロードを返す

import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth-server";
import type { SessionPayload } from "@/lib/session.types";

export async function getSession(): Promise<SessionPayload | null> {
  
  const jar = await cookies(); // cookieからセッションを取得
  const token = jar.get("nomiteni_token")?.value; // セッショントークンを取得
  if (!token) return null;
  return verifySessionToken(token); // セッショントークンを検証してペイロードを返す
}
