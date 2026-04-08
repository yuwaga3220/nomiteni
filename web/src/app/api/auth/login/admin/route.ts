import { NextResponse } from "next/server";
import { z } from "zod";
import { createToken, toClientUser } from "@/lib/auth-server";
import { getPrisma } from "@/lib/prisma";
import { getSession } from "@/lib/session-cookie";

const loginAdminSchema = z.object({
  passcode: z.string().min(1),
});

// 管理者ログイン（事前ログイン済みユーザー向け）
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "先にログインしてください。" }, { status: 401 });
  }

  const body: unknown = await req.json();
  const parsed = loginAdminSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return NextResponse.json({ error: "ユーザーが見つかりません。" }, { status: 404 });
  }

  const tournament = await prisma.tournament.findUnique({ where: { adminPasscode: parsed.data.passcode } });
  if (!tournament) {
    return NextResponse.json({ error: "管理者パスコードが違います。" }, { status: 401 });
  }
  await prisma.tournamentAdmin.upsert({
    where: { tournamentId_userId: { tournamentId: tournament.id, userId: user.id } },
    create: { tournamentId: tournament.id, userId: user.id },
    update: {},
  });

  const res = NextResponse.json({
    user: toClientUser({ ...user, scope: "admin" }),
  });
  res.cookies.set(
    "nomiteni_token",
    createToken({ userId: user.id, scope: "admin", tournamentId: tournament.id }),
    { httpOnly: true, sameSite: "lax", path: "/" },
  );
  return res;
}
