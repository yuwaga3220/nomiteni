import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { createToken, toClientUser } from "@/lib/auth-server";
import { getPrisma } from "@/lib/prisma";
import { observerLoginSchema } from "@/lib/schemas";
import { getActiveTournament } from "@/lib/tournament-service";

export async function POST(req: Request) {
  const body: unknown = await req.json();
  const parsed = observerLoginSchema.safeParse(body);
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

  const activeTournament = await getActiveTournament();
  if (!activeTournament || !activeTournament.observerPasscode) {
    return NextResponse.json({ error: "観戦パスコードが未設定です。" }, { status: 401 });
  }
  if (parsed.data.passcode !== activeTournament.observerPasscode) {
    return NextResponse.json({ error: "観戦パスコードが違います。" }, { status: 401 });
  }

  const res = NextResponse.json({
    user: toClientUser({ ...user, role: UserRole.OBSERVER }),
  });
  res.cookies.set("nomiteni_token", createToken({ userId: user.id, role: UserRole.OBSERVER }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return res;
}
