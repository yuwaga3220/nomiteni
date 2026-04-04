import { NextResponse } from "next/server";
import { HttpError } from "@/lib/http-error";
import { tournamentSettingsSchema } from "@/lib/schemas";
import { jsonFromError } from "@/lib/route-utils";
import { requireAdmin } from "@/lib/session-guards";
import { createTournamentWithSettings } from "@/lib/tournament-create";

export async function POST(req: Request) {
  try {
    const guard = await requireAdmin();
    if ("error" in guard) return guard.error;

    const body: unknown = await req.json();
    const parsed = tournamentSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const result = await createTournamentWithSettings(parsed.data);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof HttpError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return jsonFromError(e);
  }
}
