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

    const user1 = await prisma.userTournamentRole.findUnique({ 
        where: { tournamentId_userId_role: { 
            tournamentId: scoped.tournament.id, 
            userId: parsed.data.id1, 
            role: "PARTICIPANT" 
        } } 
    });
    const user2 = await prisma.userTournamentRole.findUnique({ 
        where: { tournamentId_userId_role: { 
            tournamentId: scoped.tournament.id, 
            userId: parsed.data.id2, 
            role: "PARTICIPANT" 
        } } 
    });
    
    if (!user1 || !user2) {
        return NextResponse.json({ error: "参加者を選択してください。" }, { status: 404 });
    }
    if (parsed.data.id1 === parsed.data.id2) {
        return NextResponse.json({ error: "同一の参加者は交換できません。" }, { status: 400 });
    }

    const initialPosition1 = user1.initialPosition ?? null;
    const initialPosition2 = user2.initialPosition ?? null;

    const [userTournamentRole1, userTournamentRole2] = await prisma.$transaction(async (tx) => {
        const updated1ToNull = await tx.userTournamentRole.update({
            where: {
                tournamentId_userId_role: {
                    tournamentId: scoped.tournament.id,
                    userId: parsed.data.id1,
                    role: "PARTICIPANT",
                },
            },
            data: { initialPosition: null },
        });
        const updated2 = await tx.userTournamentRole.update({
            where: {
                tournamentId_userId_role: {
                    tournamentId: scoped.tournament.id,
                    userId: parsed.data.id2,
                    role: "PARTICIPANT",
                },
            },
            data: { initialPosition: initialPosition1 },
        });
        const updated1 = await tx.userTournamentRole.update({
            where: {
                tournamentId_userId_role: {
                    tournamentId: scoped.tournament.id,
                    userId: parsed.data.id1,
                    role: "PARTICIPANT",
                },
            },
            data: { initialPosition: initialPosition2 },
        });
        return [updated1, updated2];
    });

    await broadcastState();
    return NextResponse.json({ userTournamentRole1, userTournamentRole2 });
}