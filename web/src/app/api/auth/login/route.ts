import { NextResponse } from "next/server";
import { createToken } from "@/lib/auth-server";
import { getPrisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/schemas";

// ログイン
export async function POST(req: Request) {
  const body: unknown = await req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const prisma = getPrisma();
  // メアドが一致するユーザーを取得
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) {
    return NextResponse.json(
      { error: "該当するアカウントがありません。先にサインアップしてください。" },
      { status: 404 },
    );
  }
  // パスワード認証
  if (user.password !== parsed.data.password) {
    return NextResponse.json({ error: "パスワードが違います。" }, { status: 401 });
  }
  // 認証成功時にトークンを発行
  const res = NextResponse.json({ ok: true, userId: user.id });
  res.cookies.set("nomiteni_token", createToken({ userId: user.id, scope: "login" }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  // レスポンスを返す
  return res;
}
