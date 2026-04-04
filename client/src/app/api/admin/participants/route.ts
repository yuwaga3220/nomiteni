import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session-guards";

export async function GET() {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const prisma = getPrisma();
  const users = await prisma.user.findMany({
    where: { role: UserRole.PARTICIPANT },
    orderBy: [{ createdAt: "asc" }],
  });
  return NextResponse.json({ users });
}
