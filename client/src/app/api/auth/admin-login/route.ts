import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { createToken, toClientUser } from "@/lib/auth-server";
import { getPrisma } from "@/lib/prisma";
import { adminLoginSchema } from "@/lib/schemas";

export async function POST(req: Request) {
  const body: unknown = await req.json();
  const parsed = adminLoginSchema.safeParse(body);
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

  const tournament = await prisma.tournament.findUnique({ where: { adminPasscode: parsed.data.passcode } });
  if (!tournament) {
    return NextResponse.json({ error: "管理者パスコードが違います。" }, { status: 401 });
  }

  const res = NextResponse.json({
    user: toClientUser({ ...user, role: UserRole.ADMIN }),
  });
  res.cookies.set(
    "nomiteni_token",
    createToken({ userId: user.id, role: UserRole.ADMIN, tournamentId: tournament.id }),
    { httpOnly: true, sameSite: "lax", path: "/" },
  );
  return res;
}
