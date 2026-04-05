// web/src/app/api/admin/participants/route.ts
// 参加者一覧を取得する
import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session-guards";

// 参加者一覧を取得する
export async function GET() {
  // 管理者ログインチェック
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  // 参加者一覧を取得
  const prisma = getPrisma();
  const users = await prisma.user.findMany({
    where: { role: UserRole.PARTICIPANT },
    orderBy: [{ createdAt: "asc" }],
  });
  // 参加者一覧を返す
  return NextResponse.json({ users });
}
