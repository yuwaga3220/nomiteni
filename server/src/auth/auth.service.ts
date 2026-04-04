/**
 * 認証サービス（認証の操作）
 */
import { Injectable } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import type { Request } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import type { SessionPayload } from "./session.types";

@Injectable()
export class AuthService {
  createToken(payload: SessionPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "14d" });
  }

  readSession(req: Request): SessionPayload | null {
    const token = req.cookies?.nomiteni_token;
    if (!token) return null;
    try {
      return jwt.verify(token, JWT_SECRET) as SessionPayload;
    } catch {
      return null;
    }
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
