// web/src/lib/auth-server.ts
// JWT・ユーザー JSON（API 用）

import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@/lib/config";
import type { SessionPayload } from "@/lib/session.types";

// セッショントークンを作成
export function createToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "14d" });
}

// セッショントークンの正当性を検証し、有効なセッションペイロードを返す
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

// ユーザー情報をクライアントに返す
export function toClientUser(user: {
  id: number;
  email: string;
}) {
  return {
    id: user.id,
    email: user.email,
  };
}
