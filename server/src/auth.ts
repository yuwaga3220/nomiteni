import { UserRole } from "@prisma/client";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";

export type SessionPayload = { userId: number; role: UserRole; tournamentId?: number };

export type AuthHelpers = {
  createToken: (payload: SessionPayload) => string;
  readSession: (req: Request) => SessionPayload | null;
  requireAuth: (req: Request, res: Response) => SessionPayload | null;
  requireAdmin: (req: Request, res: Response) => SessionPayload | null;
  requireParticipant: (req: Request, res: Response) => SessionPayload | null;
};

export function createAuthHelpers(jwtSecret: string): AuthHelpers {
  function createToken(payload: SessionPayload): string {
    return jwt.sign(payload, jwtSecret, { expiresIn: "14d" });
  }

  function readSession(req: Request): SessionPayload | null {
    const token = req.cookies?.nomiteni_token;
    if (!token) return null;
    try {
      return jwt.verify(token, jwtSecret) as SessionPayload;
    } catch {
      return null;
    }
  }

  function requireAuth(req: Request, res: Response): SessionPayload | null {
    const session = readSession(req);
    if (!session) {
      res.status(401).json({ error: "ログインが必要です。" });
      return null;
    }
    return session;
  }

  function requireAdmin(req: Request, res: Response): SessionPayload | null {
    const session = requireAuth(req, res);
    if (!session) return null;
    if (session.role !== UserRole.ADMIN) {
      res.status(403).json({ error: "管理者のみ実行できます。" });
      return null;
    }
    return session;
  }

  function requireParticipant(req: Request, res: Response): SessionPayload | null {
    const session = requireAuth(req, res);
    if (!session) return null;
    if (session.role !== UserRole.PARTICIPANT) {
      res.status(403).json({ error: "参加者のみ実行できます。" });
      return null;
    }
    return session;
  }

  return { createToken, readSession, requireAuth, requireAdmin, requireParticipant };
}
