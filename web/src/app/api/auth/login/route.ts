import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { createToken, toClientUser } from "@/lib/auth-server";
import { getPrisma } from "@/lib/prisma";
import { participantLoginSchema } from "@/lib/schemas";
import { broadcastState } from "@/lib/tournament-service";

// 参加者ログイン
export async function POST(req: Request) {
  const body: unknown = await req.json();
  const parsed = participantLoginSchema.safeParse(body); // 参加者ログインスキーマをパース
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const prisma = getPrisma(); // Prismaを取得
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

  await prisma.user.update({ // ユーザーを更新
    where: { id: user.id },
    data: { role: UserRole.PARTICIPANT },
  });

  const res = NextResponse.json({ // レスポンスを返す
    user: toClientUser({ ...user, role: UserRole.PARTICIPANT }),
  });
  res.cookies.set("nomiteni_token", createToken({ userId: user.id, role: UserRole.PARTICIPANT }), { // トークンを設定
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  await broadcastState(); // 状態をブロードキャスト
  return res;
}
