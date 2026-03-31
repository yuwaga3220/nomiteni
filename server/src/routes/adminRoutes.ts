import { MatchStatus, TournamentStatus, UserRole } from "@prisma/client";
import type { Express, Request, Response } from "express";
import { randomBytes } from "crypto";
import { z } from "zod";
import { COURT_KEY } from "../config.js";
import { entryPasscodeSchema, observerPasscodeSchema, tournamentSettingsSchema } from "../schemas.js";
import { nextPowerOfTwo, shuffle } from "../services/tournamentService.js";
import type { RouteDeps } from "../types.js";

async function issueUniqueAdminPasscode(deps: RouteDeps): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const candidate = `adm-${randomBytes(4).toString("hex")}`;
    const exists = await deps.prisma.tournament.findUnique({ where: { adminPasscode: candidate }, select: { id: true } });
    if (!exists) return candidate;
  }
  throw new Error("管理者パスコードの発行に失敗しました。");
}

// 管理者ルートを登録
export function registerAdminRoutes(app: Express, deps: RouteDeps) {
  async function requireScopedTournament(req: Request, res: Response) {
    const session = deps.auth.requireAdmin(req, res);
    if (!session) return null;
    if (!session.tournamentId) {
      res.status(403).json({ error: "この管理者セッションには大会が紐づいていません。" });
      return null;
    }
    const tournament = await deps.prisma.tournament.findUnique({ where: { id: session.tournamentId } });
    if (!tournament) {
      res.status(404).json({ error: "該当する大会が見つかりません。" });
      return null;
    }
    return tournament;
  }

  // 大会設定を取得
  app.get("/api/admin/tournaments/settings", async (req, res) => {
    const activeTournament = await requireScopedTournament(req, res);
    if (!activeTournament) return;
    return res.json({
      tournament: {
        id: activeTournament.id,
        name: activeTournament.name,
        eventDate: activeTournament.eventDate,
        timeSlot: activeTournament.timeSlot,
        courtCount: activeTournament.courtCount,
        entryPasscode: activeTournament.entryPasscode,
        observerPasscode: activeTournament.observerPasscode,
      },
    });
  });

  app.get("/api/admin/participants", async (req, res) => {
    if (!deps.auth.requireAdmin(req, res)) return;
    const users = await deps.prisma.user.findMany({
      where: { role: UserRole.PARTICIPANT },
      orderBy: [{ createdAt: "asc" }],
    });
    res.json({ users });
  });

  // 参加者チェックイン
  app.post("/api/admin/participants/:id/checkin", async (req, res) => {
    if (!deps.auth.requireAdmin(req, res)) return;
    const id = Number(req.params.id);
    const parsed = z
      .object({ checkedIn: z.boolean(), canPlayToday: z.boolean().nullable() })
      .safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const target = await deps.prisma.user.findUnique({ where: { id } });
    if (!target || target.role !== UserRole.PARTICIPANT) {
      return res.status(404).json({ error: "参加者が見つかりません。" });
    }

    const user = await deps.prisma.user.update({
      where: { id },
      data: parsed.data,
    });
    await deps.tournamentService.broadcastState();
    return res.json({ user });
  });

  // コート数設定
  app.post("/api/admin/settings/courts", async (req, res) => {
    const activeTournament = await requireScopedTournament(req, res);
    if (!activeTournament) return;
    const parsed = z.object({ courtCount: z.number().int().min(1).max(32) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    await deps.prisma.tournament.update({
      where: { id: activeTournament.id },
      data: { courtCount: parsed.data.courtCount },
    });
    await deps.prisma.appSetting.upsert({
      where: { key: COURT_KEY },
      update: { value: String(parsed.data.courtCount) },
      create: { key: COURT_KEY, value: String(parsed.data.courtCount) },
    });
    await deps.tournamentService.broadcastState();
    res.json({ ok: true });
  });

  // 観戦者パスコード設定
  app.post("/api/admin/tournaments/observer-passcode", async (req, res) => {
    const activeTournament = await requireScopedTournament(req, res);
    if (!activeTournament) return;
    const parsed = observerPasscodeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    await deps.prisma.tournament.update({
      where: { id: activeTournament.id },
      data: { observerPasscode: parsed.data.passcode },
    });
    res.json({ ok: true });
  });

  // エントリーパスコード設定
  app.post("/api/admin/tournaments/entry-passcode", async (req, res) => {
    const activeTournament = await requireScopedTournament(req, res);
    if (!activeTournament) return;
    const parsed = entryPasscodeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    await deps.prisma.tournament.update({
      where: { id: activeTournament.id },
      data: { entryPasscode: parsed.data.passcode },
    });
    res.json({ ok: true });
  });

  // 大会作成
  app.post("/api/admin/tournaments", async (req, res) => {
    if (!deps.auth.requireAdmin(req, res)) return;
    const parsed = tournamentSettingsSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const runningTournament = await deps.prisma.tournament.findFirst({
      where: { status: TournamentStatus.RUNNING },
      orderBy: { createdAt: "desc" },
    });
    if (runningTournament) {
      return res.status(400).json({ error: "進行中の大会があるため、新規トーナメントは作成できません。" });
    }

    const players = await deps.prisma.user.findMany({
      where: { checkedIn: true, canPlayToday: true },
      select: { id: true },
    });

    await deps.prisma.tournament.updateMany({
      where: { status: TournamentStatus.DRAFT },
      data: { status: TournamentStatus.FINISHED },
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
    await deps.prisma.appSetting.upsert({
      where: { key: COURT_KEY },
      update: { value: String(parsed.data.courtCount) },
      create: { key: COURT_KEY, value: String(parsed.data.courtCount) },
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
    res.json({ tournamentId: tournament.id, adminPasscode: tournament.adminPasscode });
  });

  app.post("/api/admin/tournaments/settings", async (req, res) => {
    const activeTournament = await requireScopedTournament(req, res);
    if (!activeTournament) return;
    const parsed = tournamentSettingsSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    await deps.prisma.tournament.update({
      where: { id: activeTournament.id },
      data: {
        name: parsed.data.name,
        eventDate: parsed.data.eventDate ?? null,
        timeSlot: parsed.data.timeSlot ?? null,
        courtCount: parsed.data.courtCount,
        entryPasscode: parsed.data.entryPasscode,
        observerPasscode: parsed.data.observerPasscode,
      },
    });
    await deps.prisma.appSetting.upsert({
      where: { key: COURT_KEY },
      update: { value: String(parsed.data.courtCount) },
      create: { key: COURT_KEY, value: String(parsed.data.courtCount) },
    });
    await deps.tournamentService.broadcastState();
    res.json({ ok: true });
  });

  // 試合コート割り当て
  app.post("/api/admin/matches/:id/assign", async (req, res) => {
    const activeTournament = await requireScopedTournament(req, res);
    if (!activeTournament) return;
    const id = Number(req.params.id);
    const parsed = z.object({ courtNumber: z.number().int().min(1) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const current = await deps.prisma.match.findUnique({ where: { id } });
    if (!current || current.tournamentId !== activeTournament.id) return res.status(404).json({ error: "試合が見つかりません。" });
    const match = await deps.prisma.match.update({ where: { id }, data: { courtNumber: parsed.data.courtNumber, status: MatchStatus.ASSIGNED } });
    await deps.tournamentService.broadcastState();
    res.json({ match });
  });

  // 試合開始
  app.post("/api/admin/matches/:id/start", async (req, res) => {
    const activeTournament = await requireScopedTournament(req, res);
    if (!activeTournament) return;
    const id = Number(req.params.id);
    const current = await deps.prisma.match.findUnique({ where: { id } });
    if (!current || current.tournamentId !== activeTournament.id) return res.status(404).json({ error: "試合が見つかりません。" });
    const match = await deps.prisma.match.update({
      where: { id },
      data: { status: MatchStatus.IN_PROGRESS },
    });
    await deps.tournamentService.broadcastState();
    res.json({ match });
  });

  // 試合結果登録
  app.post("/api/admin/matches/:id/result", async (req, res) => {
    const activeTournament = await requireScopedTournament(req, res);
    if (!activeTournament) return;
    const id = Number(req.params.id);
    const parsed = z.object({ winnerId: z.number().int() }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const existing = await deps.prisma.match.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "試合が見つかりません。" });
    if (existing.tournamentId !== activeTournament.id) return res.status(404).json({ error: "試合が見つかりません。" });
    if (![existing.player1Id, existing.player2Id].includes(parsed.data.winnerId)) {
      return res.status(400).json({ error: "勝者は対戦者から選択してください。" });
    }

    const match = await deps.prisma.match.update({
      where: { id },
      data: {
        winnerId: parsed.data.winnerId,
        status: MatchStatus.COMPLETED,
        courtNumber: null,
      },
    });
    await deps.tournamentService.attachWinnerToNext(id);
    await deps.tournamentService.resolveAutomaticMatches(match.tournamentId);
    await deps.tournamentService.updateTournamentStatus(match.tournamentId);
    await deps.tournamentService.broadcastState();
    return res.json({ match });
  });
}
