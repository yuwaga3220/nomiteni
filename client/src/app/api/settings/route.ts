import { NextResponse } from "next/server";
import { getCourtCount } from "@/lib/tournament-service";

export async function GET() {
  return NextResponse.json({ courtCount: await getCourtCount() });
}
