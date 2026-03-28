import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import http from "http";
import jwt from "jsonwebtoken";
import { PrismaClient, MatchStatus, TournamentStatus, UserRole } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { Server } from "socket.io";
import { z } from "zod";
const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "http://localhost:5174"],
        credentials: true,
    },
});
const PORT = Number(process.env.PORT ?? 4000);
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret";
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE ?? "admin123";
const COURT_KEY = "courtCount";
const allowedOrigins = Array.from(new Set([
    ...(process.env.CLIENT_ORIGIN?.split(",").map((v) => v.trim()).filter(Boolean) ?? []),
    "http://localhost:5173",
    "http://localhost:5174",
]));
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));
// JSON繝代・繧ｹ
app.use(express.json());
// 繧ｯ繝・く繝ｼ繝代・繧ｵ繝ｼ
app.use(cookieParser());
// 繝医・繧ｯ繝ｳ菴懈・
function createToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "14d" });
}
// 繧ｻ繝・す繝ｧ繝ｳ隱ｭ縺ｿ霎ｼ縺ｿ
function readSession(req) {
    const token = req.cookies?.nomiteni_token;
    if (!token)
        return null;
    try {
        return jwt.verify(token, JWT_SECRET);
    }
    catch {
        return null;
    }
}
function requireAuth(req, res) {
    const session = readSession(req);
    if (!session) {
        res.status(401).json({ error: "Request failed." });
        return null;
    }
    return session;
}
function requireAdmin(req, res) {
    const session = requireAuth(req, res);
    if (!session)
        return null;
    if (session.role !== UserRole.ADMIN) {
        res.status(403).json({ error: "Request failed." });
        return null;
    }
    return session;
}
function requireParticipant(req, res) {
    const session = requireAuth(req, res);
    if (!session)
        return null;
    if (session.role !== UserRole.PARTICIPANT) {
        res.status(403).json({ error: "Request failed." });
        return null;
    }
    return session;
}
const participantLoginSchema = z.object({
    email: z.email(),
});
const entrySchema = z.object({
    tournamentPasscode: z.string().min(1),
    name: z.string().min(1),
    partyJoin: z.boolean().default(false),
    note: z.string().max(300).optional(),
});
const selfCheckinSchema = z.object({
    canPlayToday: z.boolean(),
});
const adminLoginSchema = z.object({
    email: z.email(),
    passcode: z.string().min(1),
});
const observerLoginSchema = z.object({
    passcode: z.string().min(1),
});
const observerPasscodeSchema = z.object({
    passcode: z.string().min(4).max(64),
});
const entryPasscodeSchema = z.object({
    passcode: z.string().min(4).max(64),
});
function nextPowerOfTwo(n) {
    let v = 1;
    while (v < n)
        v *= 2;
    return v;
}
// 繧ｷ繝｣繝・ヵ繝ｫ縺吶ｋ
function shuffle(items) {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
async function getCourtCount() {
    const setting = await prisma.appSetting.findUnique({ where: { key: COURT_KEY } });
    return Number(setting?.value ?? "2");
}
async function buildPublicState() {
    const activeTournament = await prisma.tournament.findFirst({
        where: {
            status: { in: [TournamentStatus.DRAFT, TournamentStatus.RUNNING] },
        },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            status: true,
            matches: {
                orderBy: [{ round: "asc" }, { position: "asc" }],
                select: {
                    id: true,
                    tournamentId: true,
                    round: true,
                    position: true,
                    player1Id: true,
                    player2Id: true,
                    winnerId: true,
                    status: true,
                    courtNumber: true,
                },
            },
        },
    });
    const users = await prisma.user.findMany({
        where: { role: UserRole.PARTICIPANT },
        orderBy: [{ checkedIn: "desc" }, { name: "asc" }],
        select: {
            id: true,
            name: true,
            checkedIn: true,
            canPlayToday: true,
            partyJoin: true,
            note: true,
        },
    });
    const courtCount = await getCourtCount();
    return { users, activeTournament, courtCount };
}
async function getActiveTournament() {
    return prisma.tournament.findFirst({
        where: { status: { in: [TournamentStatus.DRAFT, TournamentStatus.RUNNING] } },
        orderBy: { createdAt: "desc" },
    });
}
async function broadcastState() {
    io.emit("state:update", await buildPublicState());
}
// 蜍晁・ｒ谺｡縺ｮ隧ｦ蜷医↓霑ｽ蜉縺吶ｋ
async function attachWinnerToNext(matchId) {
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match || !match.nextMatchId)
        return;
    const slot = match.position % 2 === 1 ? "player1Id" : "player2Id";
    await prisma.match.update({
        where: { id: match.nextMatchId },
        data: { [slot]: match.winnerId ?? null },
    });
}
// 閾ｪ蜍慕噪縺ｫ隧ｦ蜷医ｒ隗｣豎ｺ縺吶ｋ
async function resolveAutomaticMatches(tournamentId) {
    let changed = true;
    while (changed) {
        changed = false;
        const matches = await prisma.match.findMany({
            where: { tournamentId },
            include: { feeders: true },
            orderBy: [{ round: "asc" }, { position: "asc" }],
        });
        for (const match of matches) {
            if (match.status === MatchStatus.COMPLETED)
                continue;
            const players = [match.player1Id, match.player2Id].filter(Boolean);
            const feedersDone = match.round === 1 || match.feeders.every((f) => f.status === MatchStatus.COMPLETED);
            if (!feedersDone)
                continue;
            if (players.length === 0) {
                await prisma.match.update({
                    where: { id: match.id },
                    data: { status: MatchStatus.COMPLETED, winnerId: null, courtNumber: null },
                });
                await attachWinnerToNext(match.id);
                changed = true;
            }
            else if (players.length === 1) {
                await prisma.match.update({
                    where: { id: match.id },
                    data: { status: MatchStatus.COMPLETED, winnerId: players[0], courtNumber: null },
                });
                await attachWinnerToNext(match.id);
                changed = true;
            }
        }
    }
}
// 螟ｧ莨壹せ繝・・繧ｿ繧ｹ繧呈峩譁ｰ縺吶ｋ
async function updateTournamentStatus(tournamentId) {
    const finalMatch = await prisma.match.findFirst({
        where: { tournamentId },
        orderBy: [{ round: "desc" }, { position: "desc" }],
    });
    if (!finalMatch)
        return;
    if (finalMatch.status === MatchStatus.COMPLETED) {
        await prisma.tournament.update({
            where: { id: tournamentId },
            data: { status: TournamentStatus.FINISHED },
        });
    }
    else {
        await prisma.tournament.update({
            where: { id: tournamentId },
            data: { status: TournamentStatus.RUNNING },
        });
    }
}
app.get("/api/health", (_req, res) => res.json({ ok: true }));
// 繝ｭ繧ｰ繧､繝ｳ縺吶ｋ
app.post("/api/auth/login", async (req, res) => {
    const parsed = participantLoginSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const { email } = parsed.data;
    const user = await prisma.user.upsert({
        where: { email },
        update: { role: UserRole.PARTICIPANT },
        create: { email, role: UserRole.PARTICIPANT },
    });
    res.cookie("nomiteni_token", createToken({ userId: user.id, role: user.role }), {
        httpOnly: true,
        sameSite: "lax",
    });
    await broadcastState();
    return res.json({ user });
});
// 螟ｧ莨壹お繝ｳ繝医Μ繝ｼ縺吶ｋ
app.post("/api/entry/self", async (req, res) => {
    const session = requireParticipant(req, res);
    if (!session)
        return;
    const parsed = entrySchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const activeTournament = await getActiveTournament();
    if (!activeTournament || !activeTournament.entryPasscode) {
        return res.status(401).json({ error: "Request failed." });
    }
    if (parsed.data.tournamentPasscode !== activeTournament.entryPasscode) {
        return res.status(401).json({ error: "Request failed." });
    }
    const user = await prisma.user.update({
        where: { id: session.userId },
        data: {
            name: parsed.data.name,
            partyJoin: parsed.data.partyJoin,
            note: parsed.data.note,
        },
    });
    await broadcastState();
    return res.json({ user });
});
// 邂｡逅・・Ο繧ｰ繧､繝ｳ縺吶ｋ
app.post("/api/auth/admin-login", async (req, res) => {
    const parsed = adminLoginSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    if (parsed.data.passcode !== ADMIN_PASSCODE) {
        return res.status(401).json({ error: "Request failed." });
    }
    // 邂｡逅・・Θ繝ｼ繧ｶ繝ｼ繧剃ｽ懈・縺吶ｋ
    const user = await prisma.user.upsert({
        where: { email: parsed.data.email },
        update: { role: UserRole.ADMIN },
        create: { email: parsed.data.email, name: "管理者", role: UserRole.ADMIN },
    });
    res.cookie("nomiteni_token", createToken({ userId: user.id, role: user.role }), {
        httpOnly: true,
        sameSite: "lax",
    });
    return res.json({ user });
});
// 隕ｳ謌ｦ閠・Ο繧ｰ繧､繝ｳ縺吶ｋ
app.post("/api/auth/observer-login", async (req, res) => {
    const parsed = observerLoginSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const activeTournament = await getActiveTournament();
    if (!activeTournament || !activeTournament.observerPasscode) {
        return res.status(401).json({ error: "Request failed." });
    }
    if (parsed.data.passcode !== activeTournament.observerPasscode) {
        return res.status(401).json({ error: "Request failed." });
    }
    const user = await prisma.user.create({
        data: {
            email: `related-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@nomiteni.local`,
            name: "観戦者",
            role: UserRole.OBSERVER,
        },
    });
    res.cookie("nomiteni_token", createToken({ userId: user.id, role: user.role }), {
        httpOnly: true,
        sameSite: "lax",
    });
    return res.json({ user });
});
app.get("/api/auth/me", async (req, res) => {
    const session = readSession(req);
    if (!session)
        return res.json({ user: null });
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user)
        return res.json({ user: null });
    return res.json({ user });
});
app.post("/api/auth/logout", (_req, res) => {
    res.clearCookie("nomiteni_token");
    res.json({ ok: true });
});
app.get("/api/public/state", async (_req, res) => {
    res.json(await buildPublicState());
});
app.get("/api/settings", async (_req, res) => {
    res.json({ courtCount: await getCourtCount() });
});
// 閾ｪ蟾ｱ繝√ぉ繝・け繧､繝ｳ縺吶ｋ
app.post("/api/checkin/self", async (req, res) => {
    const session = requireParticipant(req, res);
    if (!session)
        return;
    const parsed = selfCheckinSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const user = await prisma.user.update({
        where: { id: session.userId },
        data: { checkedIn: true, canPlayToday: parsed.data.canPlayToday },
    });
    await broadcastState();
    return res.json({ user });
});
app.get("/api/admin/participants", async (req, res) => {
    if (!requireAdmin(req, res))
        return;
    const users = await prisma.user.findMany({
        where: { role: UserRole.PARTICIPANT },
        orderBy: [{ createdAt: "asc" }],
    });
    res.json({ users });
});
// 邂｡逅・・Θ繝ｼ繧ｶ繝ｼ繧偵メ繧ｧ繝・け繧､繝ｳ縺吶ｋ
app.post("/api/admin/participants/:id/checkin", async (req, res) => {
    if (!requireAdmin(req, res))
        return;
    const id = Number(req.params.id);
    const parsed = z
        .object({ checkedIn: z.boolean(), canPlayToday: z.boolean().nullable() })
        .safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target || target.role !== UserRole.PARTICIPANT) {
        return res.status(404).json({ error: "Request failed." });
    }
    const user = await prisma.user.update({
        where: { id },
        data: parsed.data,
    });
    await broadcastState();
    return res.json({ user });
});
app.post("/api/admin/settings/courts", async (req, res) => {
    if (!requireAdmin(req, res))
        return;
    const parsed = z.object({ courtCount: z.number().int().min(1).max(32) }).safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    await prisma.appSetting.upsert({
        where: { key: COURT_KEY },
        update: { value: String(parsed.data.courtCount) },
        create: { key: COURT_KEY, value: String(parsed.data.courtCount) },
    });
    await broadcastState();
    res.json({ ok: true });
});
app.post("/api/admin/tournaments/observer-passcode", async (req, res) => {
    if (!requireAdmin(req, res))
        return;
    const parsed = observerPasscodeSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const activeTournament = await getActiveTournament();
    if (!activeTournament)
        return res.status(400).json({ error: "Request failed." });
    await prisma.tournament.update({
        where: { id: activeTournament.id },
        data: { observerPasscode: parsed.data.passcode },
    });
    res.json({ ok: true });
});
app.post("/api/admin/tournaments/entry-passcode", async (req, res) => {
    if (!requireAdmin(req, res))
        return;
    const parsed = entryPasscodeSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const activeTournament = await getActiveTournament();
    if (!activeTournament)
        return res.status(400).json({ error: "Request failed." });
    await prisma.tournament.update({
        where: { id: activeTournament.id },
        data: { entryPasscode: parsed.data.passcode },
    });
    res.json({ ok: true });
});
// 螟ｧ莨壹ｒ菴懈・縺吶ｋ
app.post("/api/admin/tournaments", async (req, res) => {
    if (!requireAdmin(req, res))
        return;
    const parsed = z.object({ name: z.string().min(1) }).safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const runningTournament = await prisma.tournament.findFirst({
        where: { status: TournamentStatus.RUNNING },
        orderBy: { createdAt: "desc" },
    });
    if (runningTournament) {
        return res.status(400).json({ error: "Request failed." });
    }
    const players = await prisma.user.findMany({
        where: { checkedIn: true, canPlayToday: true },
        select: { id: true },
    });
    if (players.length < 2)
        return res.status(400).json({ error: "Request failed." });
    await prisma.tournament.updateMany({
        where: { status: TournamentStatus.DRAFT },
        data: { status: TournamentStatus.FINISHED },
    });
    const tournament = await prisma.tournament.create({
        data: { name: parsed.data.name, status: TournamentStatus.DRAFT, observerPasscode: null, entryPasscode: null },
    });
    const shuffled = shuffle(players.map((p) => p.id));
    const size = nextPowerOfTwo(shuffled.length);
    const rounds = Math.log2(size);
    const slots = [...shuffled];
    while (slots.length < size)
        slots.push(null);
    const createdIds = new Map();
    for (let round = 1; round <= rounds; round++) {
        const count = size / 2 ** round;
        for (let position = 1; position <= count; position++) {
            const createData = round === 1
                ? {
                    player1Id: slots[(position - 1) * 2],
                    player2Id: slots[(position - 1) * 2 + 1],
                }
                : {};
            const match = await prisma.match.create({
                data: {
                    tournamentId: tournament.id,
                    round,
                    position,
                    ...createData,
                },
            });
            createdIds.set(`${round}-${position}`, match.id);
        }
    }
    for (let round = 1; round < rounds; round++) {
        const count = size / 2 ** round;
        for (let position = 1; position <= count; position++) {
            const id = createdIds.get(`${round}-${position}`);
            const nextId = createdIds.get(`${round + 1}-${Math.ceil(position / 2)}`);
            await prisma.match.update({
                where: { id },
                data: { nextMatchId: nextId },
            });
        }
    }
    await resolveAutomaticMatches(tournament.id);
    await updateTournamentStatus(tournament.id);
    await broadcastState();
    res.json({ tournamentId: tournament.id });
});
app.post("/api/admin/matches/:id/assign", async (req, res) => {
    if (!requireAdmin(req, res))
        return;
    const id = Number(req.params.id);
    const parsed = z.object({ courtNumber: z.number().int().min(1) }).safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const match = await prisma.match.update({
        where: { id },
        data: { courtNumber: parsed.data.courtNumber, status: MatchStatus.ASSIGNED },
    });
    await broadcastState();
    res.json({ match });
});
app.post("/api/admin/matches/:id/start", async (req, res) => {
    if (!requireAdmin(req, res))
        return;
    const id = Number(req.params.id);
    const match = await prisma.match.update({
        where: { id },
        data: { status: MatchStatus.IN_PROGRESS },
    });
    await broadcastState();
    res.json({ match });
});
app.post("/api/admin/matches/:id/result", async (req, res) => {
    if (!requireAdmin(req, res))
        return;
    const id = Number(req.params.id);
    const parsed = z.object({ winnerId: z.number().int() }).safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const existing = await prisma.match.findUnique({ where: { id } });
    if (!existing)
        return res.status(404).json({ error: "Request failed." });
    if (![existing.player1Id, existing.player2Id].includes(parsed.data.winnerId)) {
        return res.status(400).json({ error: "Request failed." });
    }
    const match = await prisma.match.update({
        where: { id },
        data: {
            winnerId: parsed.data.winnerId,
            status: MatchStatus.COMPLETED,
            courtNumber: null,
        },
    });
    await attachWinnerToNext(id);
    await resolveAutomaticMatches(match.tournamentId);
    await updateTournamentStatus(match.tournamentId);
    await broadcastState();
    return res.json({ match });
});
io.on("connection", async (socket) => {
    socket.emit("state:update", await buildPublicState());
});
server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Nomiteni server listening on http://localhost:${PORT}`);
});
