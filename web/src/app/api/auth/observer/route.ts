import { NextResponse } from "next/server";
import { z } from "zod";
import { createToken } from "@/lib/auth-server";
import { getActiveTournamentByObserverPasscode } from "@/lib/tournament-service";

const observerPasscodeSchema = z.object({
  passcode: z.string().min(1),
});

// 観戦パスコードだけで大会コンテキストに入る
export async function POST(req: Request) {
  const body: unknown = await req.json();
  const parsed = observerPasscodeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const tournament = await getActiveTournamentByObserverPasscode(parsed.data.passcode);
  if (!tournament) {
    return NextResponse.json({ error: "観戦パスコードが違います。" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, tournamentId: tournament.id });
  res.cookies.set(
    "nomiteni_token",
    createToken({ scope: "observer", tournamentId: tournament.id }),
    { httpOnly: true, sameSite: "lax", path: "/" },
  );
  return res;
}
