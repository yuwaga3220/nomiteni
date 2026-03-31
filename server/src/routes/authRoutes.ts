import { TournamentStatus, UserRole } from "@prisma/client";
import type { Express } from "express";
import { randomBytes } from "crypto";
import {
  adminLoginSchema,
  entryPasscodeOnlySchema,
  entrySchema,
  observerLoginSchema,
  participantLoginSchema,
  selfCheckinSchema,
  signupSchema,
  tournamentSettingsSchema,
} from "../schemas.js";
import { nextPowerOfTwo, shuffle } from "../services/tournamentService.js";
import type { RouteDeps } from "../types.js";

// 管理者パスコードを発行
async function issueUniqueAdminPasscode(deps: RouteDeps): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const candidate = `adm-${randomBytes(4).toString("hex")}`;
    const exists = await deps.prisma.tournament.findUnique({
      where: { adminPasscode: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
  }
  throw new Error("管理者パスコードの発行に失敗しました。");
}

// ユーザー情報をクライアントに返す
function toClientUser(user: {
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

// サインアップ
export function registerAuthRoutes(app: Express, deps: RouteDeps) {
  app.post("/api/auth/signup", async (req, res) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const existing = await deps.prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) return res.status(400).json({ error: "このメールアドレスは既に登録済みです。" });

    const user = await deps.prisma.user.create({
      data: {
        email: parsed.data.email,
        password: parsed.data.password,
        role: UserRole.PARTICIPANT,
      },
    });
    return res.json({ ok: true, userId: user.id });
  });

  // ログイン
  app.post("/api/auth/login", async (req, res) => {
    const parsed = participantLoginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const user = await deps.prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user) {
      return res.status(404).json({ error: "該当するアカウントがありません。先にサインアップしてください。" });
    }
    if (user.password !== parsed.data.password) {
      return res.status(401).json({ error: "パスワードが違います。" });
    }

    await deps.prisma.user.update({
      where: { id: user.id },
      data: { role: UserRole.PARTICIPANT },
    });

    res.cookie("nomiteni_token", deps.auth.createToken({ userId: user.id, role: UserRole.PARTICIPANT }), {
      httpOnly: true,
      sameSite: "lax",
    });
    await deps.tournamentService.broadcastState();
    return res.json({ user: toClientUser({ ...user, role: UserRole.PARTICIPANT }) });
  });

  // エントリー
  app.post("/api/entry/self", async (req, res) => {
    const session = deps.auth.requireParticipant(req, res);
    if (!session) return;
    const parsed = entrySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const activeTournament = await deps.tournamentService.getActiveTournament();
    if (!activeTournament || !activeTournament.entryPasscode) {
      return res.status(401).json({ error: "大会エントリーパスコードが未設定です。" });
    }
    if (parsed.data.tournamentPasscode !== activeTournament.entryPasscode) {
      return res.status(401).json({ error: "大会エントリーパスコードが違います。" });
    }

    const user = await deps.prisma.user.update({
      where: { id: session.userId },
      data: {
        name: parsed.data.name,
        partyJoin: parsed.data.partyJoin,
        note: parsed.data.note,
      },
    });
    await deps.tournamentService.broadcastState();
    return res.json({ user: toClientUser(user) });
  });

  // 認証済みユーザーによる大会作成
  app.post("/api/tournaments/create", async (req, res) => {
    const session = deps.auth.requireAuth(req, res);
    if (!session) return;
    const parsed = tournamentSettingsSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const runningTournament = await deps.prisma.tournament.findFirst({
      where: { status: TournamentStatus.RUNNING },
      orderBy: { createdAt: "desc" },
    });
    if (runningTournament) {
      return res.status(400).json({ error: "進行中の大会があるため、新規トーナメントは作成できません。" });
    }

    await deps.prisma.tournament.updateMany({
      where: { status: TournamentStatus.DRAFT },
      data: { status: TournamentStatus.FINISHED },
    });

    const players = await deps.prisma.user.findMany({
      where: { checkedIn: true, canPlayToday: true },
      select: { id: true },
    });
    const tournament = await deps.prisma.tournament.create({
      data: {
        name: parsed.data.name,
        adminPasscode: await issueUniqueAdminPasscode(deps),
        eventDate: parsed.data.eventDate ?? null,
        timeSlot: parsed.data.timeSlot ?? null,
        courtCount: parsed.data.courtCount,
        status: TournamentStatus.DRAFT,
        observerPasscode: parsed.data.observerPasscode,
        entryPasscode: parsed.data.entryPasscode,
      },
    });

    if (players.length < 2) {
      await deps.tournamentService.broadcastState();
      return res.json({
        tournamentId: tournament.id,
        adminPasscode: tournament.adminPasscode,
        warning: "参加可能者が2名未満のため、対戦表はまだ作成されていません。",
      });
    }

    const shuffled = shuffle(players.map((p) => p.id));
    const size = nextPowerOfTwo(shuffled.length);
    const rounds = Math.log2(size);
    const slots: Array<number | null> = [...shuffled];
    while (slots.length < size) slots.push(null);

    const createdIds = new Map<string, number>();
    for (let round = 1; round <= rounds; round++) {
      const count = size / 2 ** round;
      for (let position = 1; position <= count; position++) {
        const createData =
          round === 1
            ? {
                player1Id: slots[(position - 1) * 2],
                player2Id: slots[(position - 1) * 2 + 1],
              }
            : {};
        const match = await deps.prisma.match.create({
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
        const id = createdIds.get(`${round}-${position}`)!;
        const nextId = createdIds.get(`${round + 1}-${Math.ceil(position / 2)}`)!;
        await deps.prisma.match.update({
          where: { id },
          data: { nextMatchId: nextId },
        });
      }
    }

    await deps.tournamentService.resolveAutomaticMatches(tournament.id);
    await deps.tournamentService.updateTournamentStatus(tournament.id);
    await deps.tournamentService.broadcastState();
    return res.json({ tournamentId: tournament.id, adminPasscode: tournament.adminPasscode });
  });

  // エントリー対象大会の確認
  app.post("/api/entry/preview", async (req, res) => {
    const session = deps.auth.requireParticipant(req, res);
    if (!session) return;
    const parsed = entryPasscodeOnlySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const activeTournament = await deps.tournamentService.getActiveTournament();
    if (!activeTournament || !activeTournament.entryPasscode) {
      return res.status(401).json({ error: "大会エントリーパスコードが未設定です。" });
    }
    if (parsed.data.tournamentPasscode !== activeTournament.entryPasscode) {
      return res.status(401).json({ error: "大会エントリーパスコードが違います。" });
    }

    return res.json({
      tournament: {
        id: activeTournament.id,
        name: activeTournament.name,
        status: activeTournament.status,
      },
    });
  });

  // 管理者ログイン
  app.post("/api/auth/admin-login", async (req, res) => {
    const parsed = adminLoginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const user = await deps.prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user) {
      return res.status(404).json({ error: "該当するアカウントがありません。先にサインアップしてください。" });
    }
    if (user.password !== parsed.data.password) {
      return res.status(401).json({ error: "パスワードが違います。" });
    }

    const tournament = await deps.prisma.tournament.findUnique({ where: { adminPasscode: parsed.data.passcode } });
    if (!tournament) return res.status(401).json({ error: "管理者パスコードが違います。" });

    res.cookie(
      "nomiteni_token",
      deps.auth.createToken({ userId: user.id, role: UserRole.ADMIN, tournamentId: tournament.id }),
      {
      httpOnly: true,
      sameSite: "lax",
      },
    );
    return res.json({ user: toClientUser({ ...user, role: UserRole.ADMIN }) });
  });

  // 観戦者ログイン
  app.post("/api/auth/observer-login", async (req, res) => {
    const parsed = observerLoginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const user = await deps.prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user) {
      return res.status(404).json({ error: "該当するアカウントがありません。先にサインアップしてください。" });
    }
    if (user.password !== parsed.data.password) {
      return res.status(401).json({ error: "パスワードが違います。" });
    }

    const activeTournament = await deps.tournamentService.getActiveTournament();
    if (!activeTournament || !activeTournament.observerPasscode) {
      return res.status(401).json({ error: "観戦パスコードが未設定です。" });
    }
    if (parsed.data.passcode !== activeTournament.observerPasscode) {
      return res.status(401).json({ error: "観戦パスコードが違います。" });
    }

    res.cookie("nomiteni_token", deps.auth.createToken({ userId: user.id, role: UserRole.OBSERVER }), {
      httpOnly: true,
      sameSite: "lax",
    });
    return res.json({ user: toClientUser({ ...user, role: UserRole.OBSERVER }) });
  });

  // ユーザー情報取得
  app.get("/api/auth/me", async (req, res) => {
    const session = deps.auth.readSession(req);
    if (!session) return res.json({ user: null });
    const user = await deps.prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) return res.json({ user: null });
    return res.json({ user: toClientUser({ ...user, role: session.role }) });
  });

  // ログアウト
  app.post("/api/auth/logout", (_req, res) => {
    res.clearCookie("nomiteni_token");
    res.json({ ok: true });
  });

  // 自己チェックイン
  app.post("/api/checkin/self", async (req, res) => {
    const session = deps.auth.requireParticipant(req, res);
    if (!session) return;
    const parsed = selfCheckinSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const user = await deps.prisma.user.update({
      where: { id: session.userId },
      data: { checkedIn: true, canPlayToday: parsed.data.canPlayToday },
    });
    await deps.tournamentService.broadcastState();
    return res.json({ user: toClientUser(user) });
  });
}
