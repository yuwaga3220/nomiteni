import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { createToken, toClientUser } from "@/lib/auth-server";
import { getPrisma } from "@/lib/prisma";
import { participantLoginSchema } from "@/lib/schemas";
import { broadcastState } from "@/lib/tournament-service";

export async function POST(req: Request) {
  const body: unknown = await req.json();
  const parsed = participantLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) {
    return NextResponse.json(
      { error: "該当するアカウントがありません。先にサインアップしてください。" },
      { status: 404 },
    );
  }
  if (user.password !== parsed.data.password) {
    return NextResponse.json({ error: "パスワードが違います。" }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { role: UserRole.PARTICIPANT },
  });

  const res = NextResponse.json({
    user: toClientUser({ ...user, role: UserRole.PARTICIPANT }),
  });
  res.cookies.set("nomiteni_token", createToken({ userId: user.id, role: UserRole.PARTICIPANT }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  await broadcastState();
  return res;
}
