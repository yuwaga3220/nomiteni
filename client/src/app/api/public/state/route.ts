import { NextResponse } from "next/server";
import { buildPublicState } from "@/lib/tournament-service";

export async function GET() {
  const data = await buildPublicState();
  return NextResponse.json(data);
}
