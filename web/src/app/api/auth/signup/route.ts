import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/schemas";

// サインアップ
export async function POST(req: Request) {
  const body: unknown = await req.json();
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) { // サインアップスキーマをパースできない場合
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const prisma = getPrisma();
  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) { // メールアドレスが既に登録済みの場合
    return NextResponse.json({ error: "このメールアドレスは既に登録済みです。" }, { status: 400 });
  }

  const user = await prisma.user.create({ // ユーザーを作成
    data: {
      email: parsed.data.email,
      password: parsed.data.password,
    },
  });
  
  return NextResponse.json({ ok: true, userId: user.id }); // レスポンスを返す
}
