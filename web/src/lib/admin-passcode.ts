// web/src/lib/admin-passcode.ts
// 管理者パスコードを発行

import { randomBytes } from "crypto"; // ランダムなバイト列を生成
import type { PrismaClient } from "@prisma/client"; // Prisma クライアント

// 管理者パスコードを発行
export async function issueUniqueAdminPasscode(prisma: PrismaClient): Promise<string> {
  for (let i = 0; i < 8; i++) {
    // 候補を生成
    const candidate = `adm-${randomBytes(4).toString("hex")}`;
    // 既存のパスコードに対してユニークか確認
    const exists = await prisma.tournament.findUnique({
      where: { adminPasscode: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
  }
  throw new Error("管理者パスコードの発行に失敗しました。");
}
