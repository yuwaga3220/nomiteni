// web/src/app/api/admin/participants/swap/route.ts
// 参加者の初期位置を交換する
import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { requireScopedAdminTournament } from "@/lib/admin-scope";
import { broadcastState } from "@/lib/tournament-service";
export async function POST(req: Request) {

    const scoped = await requireScopedAdminTournament();
    if ("error" in scoped) return scoped.error;

    const body: unknown = await req.json();
    const parsed = z
    .object({ id1: z.number(), id2: z.number() })
    .safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const prisma = getPrisma();

    const participant1 = await prisma.participant.findFirst({ 
        where: {
            id: parsed.data.id1,
            tournamentId: scoped.tournament.id, 
        } 
    });
    const participant2 = await prisma.participant.findFirst({ 
        where: {
            id: parsed.data.id2,
            tournamentId: scoped.tournament.id, 
        } 
    });
    
    if (!participant1 || !participant2) {
        return NextResponse.json({ error: "参加者を選択してください。" }, { status: 404 });
    }
    if (parsed.data.id1 === parsed.data.id2) {
        return NextResponse.json({ error: "同一の参加者は交換できません。" }, { status: 400 });
    }

    const initialPosition1 = participant1.initialPosition ?? null;
    const initialPosition2 = participant2.initialPosition ?? null;

    const [updatedParticipant1, updatedParticipant2] = await prisma.$transaction(async (tx) => {
        await tx.participant.update({
            where: { id: parsed.data.id1 },
            data: { initialPosition: null },
        });
        const updated2 = await tx.participant.update({
            where: { id: parsed.data.id2 },
            data: { initialPosition: initialPosition1 },
        });
        const updated1 = await tx.participant.update({
            where: { id: parsed.data.id1 },
            data: { initialPosition: initialPosition2 },
        });
        return [updated1, updated2];
    });

    await broadcastState();
    return NextResponse.json({ participant1: updatedParticipant1, participant2: updatedParticipant2 });
}
