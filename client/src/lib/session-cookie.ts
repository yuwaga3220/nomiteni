/**
 * Route Handler 用セッション（Cookie）
 */
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth-server";
import type { SessionPayload } from "@/lib/session.types";

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get("nomiteni_token")?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
