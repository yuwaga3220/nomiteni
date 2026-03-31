import { UserRole } from "@prisma/client";
import jwt from "jsonwebtoken";
export function createAuthHelpers(jwtSecret) {
    function createToken(payload) {
        return jwt.sign(payload, jwtSecret, { expiresIn: "14d" });
    }
    function readSession(req) {
        const token = req.cookies?.nomiteni_token;
        if (!token)
            return null;
        try {
            return jwt.verify(token, jwtSecret);
        }
        catch {
            return null;
        }
    }
    function requireAuth(req, res) {
        const session = readSession(req);
        if (!session) {
            res.status(401).json({ error: "ログインが必要です。" });
            return null;
        }
        return session;
    }
    function requireAdmin(req, res) {
        const session = requireAuth(req, res);
        if (!session)
            return null;
        if (session.role !== UserRole.ADMIN) {
            res.status(403).json({ error: "管理者のみ実行できます。" });
            return null;
        }
        return session;
    }
    function requireParticipant(req, res) {
        const session = requireAuth(req, res);
        if (!session)
            return null;
        if (session.role !== UserRole.PARTICIPANT) {
            res.status(403).json({ error: "参加者のみ実行できます。" });
            return null;
        }
        return session;
    }
    return { createToken, readSession, requireAuth, requireAdmin, requireParticipant };
}
