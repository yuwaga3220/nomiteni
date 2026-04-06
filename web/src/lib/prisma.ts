// web/src/lib/prisma.ts
// Prisma クライアントを取得
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Prisma クライアントを取得
export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    // SQLite アダプタを作成
    const adapter = new PrismaBetterSqlite3({
      url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
    });
    // Prisma クライアントを作成
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  return globalForPrisma.prisma;
}
