import { NextResponse } from "next/server";
import { toClientUser } from "@/lib/auth-server";
import { getPrisma } from "@/lib/prisma";
import { getSession } from "@/lib/session-cookie";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null });

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user: toClientUser({ ...user, role: session.role }) });
}
