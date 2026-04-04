/**
 * JWT・ユーザー JSON（API 用）
 */
import jwt from "jsonwebtoken";
import type { UserRole } from "@prisma/client";
import { JWT_SECRET } from "@/lib/config";
import type { SessionPayload } from "@/lib/session.types";

export function createToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "14d" });
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

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
  role: UserRole;
}) {
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
    role: user.role,
  };
}
