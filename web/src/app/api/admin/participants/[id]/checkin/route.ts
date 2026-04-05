// web/src/app/api/admin/participants/[id]/checkin/route.ts
// 参加者をチェックインする
import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { requireScopedAdminTournament } from "@/lib/admin-scope";
import { broadcastState } from "@/lib/tournament-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: RouteContext) {
  
  const scoped = await requireScopedAdminTournament();
  if ("error" in scoped) return scoped.error;

  const { id: idParam } = await ctx.params;
  const id = Number(idParam);
  const body: unknown = await req.json();
  const parsed = z
    .object({ checkedIn: z.boolean(), canPlayToday: z.boolean().nullable() })
    .safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const prisma = getPrisma();
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target || target.role !== UserRole.PARTICIPANT) {
    return NextResponse.json({ error: "参加者が見つかりません。" }, { status: 404 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: parsed.data,
  });
  await broadcastState();
  return NextResponse.json({ user });
}
