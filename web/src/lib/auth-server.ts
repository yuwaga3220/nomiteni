// web/src/lib/auth-server.ts
// JWT・ユーザー JSON（API 用）

import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@/lib/config";
import type { SessionPayload, SessionScope } from "@/lib/session.types";

// セッショントークンを作成
export function createToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "14d" });
}

// セッショントークンを検証
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
  name: string | null;
  partyJoin: boolean;
  note: string | null;
  checkedIn: boolean;
  canPlayToday: boolean | null;
  createdAt: Date;
  updatedAt: Date;
  scope?: SessionScope;
}) {
  const role =
    user.scope === "admin" ? "ADMIN" : user.scope === "observer" ? "OBSERVER" : "PARTICIPANT";
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    partyJoin: user.partyJoin,
    note: user.note,
    checkedIn: user.checkedIn,
    canPlayToday: user.canPlayToday,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    role,
  };
}
