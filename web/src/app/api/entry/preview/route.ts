import { NextResponse } from "next/server";
import { entryPasscodeOnlySchema } from "@/lib/schemas";
import { requireAnySession } from "@/lib/session-guards";
import { findActiveTournamentByEntryPasscode } from "@/lib/tournament-service";

// 大会エントリーパスコードのみで大会情報を取得
export async function POST(req: Request) {
  const guard = await requireAnySession();
  if ("error" in guard) return guard.error;

  const body: unknown = await req.json();
  const parsed = entryPasscodeOnlySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const tournament = await findActiveTournamentByEntryPasscode(parsed.data.tournamentPasscode);
  if (!tournament) {
    return NextResponse.json({ error: "大会エントリーパスコードが違います。" }, { status: 401 });
  }

  return NextResponse.json({
    tournament: {
      id: tournament.id,
      name: tournament.name,
      status: tournament.status,
    },
  });
}
