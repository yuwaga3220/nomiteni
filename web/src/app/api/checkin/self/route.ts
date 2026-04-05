import { NextResponse } from "next/server";
import { toClientUser } from "@/lib/auth-server";
import { getPrisma } from "@/lib/prisma";
import { selfCheckinSchema } from "@/lib/schemas";
import { requireParticipant } from "@/lib/session-guards";
import { broadcastState } from "@/lib/tournament-service";

export async function POST(req: Request) {
  const guard = await requireParticipant();
  if ("error" in guard) return guard.error;

  const body: unknown = await req.json();
  const parsed = selfCheckinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const prisma = getPrisma();
  const user = await prisma.user.update({
    where: { id: guard.session.userId },
    data: { checkedIn: true, canPlayToday: parsed.data.canPlayToday },
  });
  await broadcastState();
  return NextResponse.json({ user: toClientUser(user) });
}
