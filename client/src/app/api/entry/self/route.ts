import { NextResponse } from "next/server";
import { toClientUser } from "@/lib/auth-server";
import { getPrisma } from "@/lib/prisma";
import { entrySchema } from "@/lib/schemas";
import { requireParticipant } from "@/lib/session-guards";
import { broadcastState, getActiveTournament } from "@/lib/tournament-service";

export async function POST(req: Request) {
  const guard = await requireParticipant();
  if ("error" in guard) return guard.error;

  const body: unknown = await req.json();
  const parsed = entrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const activeTournament = await getActiveTournament();
  if (!activeTournament || !activeTournament.entryPasscode) {
    return NextResponse.json({ error: "大会エントリーパスコードが未設定です。" }, { status: 401 });
  }
  if (parsed.data.tournamentPasscode !== activeTournament.entryPasscode) {
    return NextResponse.json({ error: "大会エントリーパスコードが違います。" }, { status: 401 });
  }

  const prisma = getPrisma();
  const user = await prisma.user.update({
    where: { id: guard.session.userId },
    data: {
      name: parsed.data.name,
      partyJoin: parsed.data.partyJoin,
      note: parsed.data.note,
    },
  });
  await broadcastState();
  return NextResponse.json({ user: toClientUser(user) });
}
