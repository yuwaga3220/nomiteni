import { NextResponse } from "next/server";
import { createToken } from "@/lib/auth-server";
import { getPrisma } from "@/lib/prisma";
import { participantLoginSchema } from "@/lib/schemas";

// 汎用ログイン（登録済みアカウント確認）
export async function POST(req: Request) {
  const body: unknown = await req.json();
  const parsed = participantLoginSchema.safeParse(body); // ログイン入力をパース
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const prisma = getPrisma();
  // ユニークなメールアドレスのユーザーを取得
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) {
    return NextResponse.json(
      { error: "該当するアカウントがありません。先にサインアップしてください。" },
      { status: 404 },
    );
  }
  // パスワードが一致しない場合はエラーを返す
  if (user.password !== parsed.data.password) {
    return NextResponse.json({ error: "パスワードが違います。" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, userId: user.id });
  res.cookies.set("nomiteni_token", createToken({ userId: user.id, scope: "login" }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return res;
}
