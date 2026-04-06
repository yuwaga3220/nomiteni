import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { createToken, toClientUser } from "@/lib/auth-server";
import { getPrisma } from "@/lib/prisma";
import { observerLoginSchema } from "@/lib/schemas";
import { getActiveTournament } from "@/lib/tournament-service";

// 観戦者ログイン
export async function POST(req: Request) {
  const body: unknown = await req.json();
  const parsed = observerLoginSchema.safeParse(body);
  if (!parsed.success) { // 観戦者ログインスキーマをパースできない場合
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) { // ユーザーが存在しない場合
    return NextResponse.json(
      { error: "該当するアカウントがありません。先にサインアップしてください。" },
      { status: 404 },
    );
  }
  if (user.password !== parsed.data.password) { // パスワードが違う場合
    return NextResponse.json({ error: "パスワードが違います。" }, { status: 401 });
  }

  const activeTournament = await getActiveTournament(); // 現在の大会を取得
  if (!activeTournament || !activeTournament.observerPasscode) {
    return NextResponse.json({ error: "観戦パスコードが未設定です。" }, { status: 401 });
  }
  if (parsed.data.passcode !== activeTournament.observerPasscode) { // 観戦パスコードが違う場合
    return NextResponse.json({ error: "観戦パスコードが違います。" }, { status: 401 });
  }

  const res = NextResponse.json({ // レスポンスを返す
    user: toClientUser({ ...user, role: UserRole.OBSERVER }),
  });
  res.cookies.set("nomiteni_token", createToken({ userId: user.id, role: UserRole.OBSERVER }), { // トークンを設定
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return res;
}
