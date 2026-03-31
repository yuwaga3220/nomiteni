import { MatchStatus, TournamentStatus, UserRole } from "@prisma/client";
export function nextPowerOfTwo(n) {
    let v = 1;
    while (v < n)
        v *= 2;
    return v;
}
export function shuffle(items) {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
// コート数を取得
export function createTournamentService({ prisma, io, courtKey }) {
    async function getCourtCount() {
        const activeTournament = await getActiveTournament();
        if (activeTournament?.courtCount)
            return activeTournament.courtCount;
        const setting = await prisma.appSetting.findUnique({ where: { key: courtKey } });
        return Number(setting?.value ?? "2");
    }
    // 公開状態を構築
    async function buildPublicState() {
        const activeTournament = await prisma.tournament.findFirst({
            where: {
                status: { in: [TournamentStatus.DRAFT, TournamentStatus.RUNNING] },
            },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                eventDate: true,
                timeSlot: true,
                courtCount: true,
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
    return {
        getCourtCount,
        buildPublicState,
        getActiveTournament,
        broadcastState,
        attachWinnerToNext,
        resolveAutomaticMatches,
        updateTournamentStatus,
    };
}
