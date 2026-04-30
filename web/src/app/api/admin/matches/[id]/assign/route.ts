// web/src/app/api/admin/matches/[id]/assign/route.ts
// 試合をコートに割り当てる
import { MatchStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireScopedAdminTournament } from "@/lib/admin-scope";
import { getPrisma } from "@/lib/prisma";
import { broadcastState } from "@/lib/tournament-service";

type RouteContext = { params: Promise<{ id: string }> };

// 試合をコートに割り当てる
export async function POST(req: Request, ctx: RouteContext) {
  // 管理者ログインチェック
  const scoped = await requireScopedAdminTournament();
  if ("error" in scoped) return scoped.error;

  // 試合IDを取得
  const { id: idParam } = await ctx.params;
  const id = Number(idParam);
  // リクエストボディをパース
  const body: unknown = await req.json();
  // コート番号をパース
  const parsed = z.object({ courtNumber: z.number().int().min(1) }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Prismaを取得
  const prisma = getPrisma();
  // 試合を取得
  const current = await prisma.match.findUnique({ where: { id } });
  if (!current || current.tournamentId !== scoped.tournament.id) {
    return NextResponse.json({ error: "試合が見つかりません。" }, { status: 404 });
  }
  // 試合をコートに割り当てる
  const match = await prisma.match.update({
    where: { id },
    data: { courtNumber: parsed.data.courtNumber, status: MatchStatus.READY },
  });
  // 試合をブロードキャスト
  await broadcastState();
  return NextResponse.json({ match });
}
