import { NextResponse } from "next/server";
import { entryPasscodeOnlySchema } from "@/lib/schemas";
import { requireParticipant } from "@/lib/session-guards";
import { getActiveTournament } from "@/lib/tournament-service";

export async function POST(req: Request) {
  const guard = await requireParticipant();
  if ("error" in guard) return guard.error;

  const body: unknown = await req.json();
  const parsed = entryPasscodeOnlySchema.safeParse(body);
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

  return NextResponse.json({
    tournament: {
      id: activeTournament.id,
      name: activeTournament.name,
      status: activeTournament.status,
    },
  });
}
