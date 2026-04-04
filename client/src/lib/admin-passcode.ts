import { randomBytes } from "crypto";
import type { PrismaClient } from "@prisma/client";

export async function issueUniqueAdminPasscode(prisma: PrismaClient): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const candidate = `adm-${randomBytes(4).toString("hex")}`;
    const exists = await prisma.tournament.findUnique({
      where: { adminPasscode: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
  }
  throw new Error("管理者パスコードの発行に失敗しました。");
}
