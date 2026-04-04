/**
 * 管理者パスコードの発行
 */
import type { PrismaService } from "../prisma/prisma.service";
import { randomBytes } from "crypto";

export async function issueUniqueAdminPasscode(prisma: PrismaService): Promise<string> {
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
