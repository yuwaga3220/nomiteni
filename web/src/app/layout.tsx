import type { Metadata } from "next";
import { AppProviders } from "./providers";
import { toClientUser } from "@/lib/auth-server";
import { getPrisma } from "@/lib/prisma";
import { getSession } from "@/lib/session-cookie";
import { buildPublicState } from "@/lib/tournament-service";
import type { Me } from "@/types";
import "./globals.css";

// メタデータ
export const metadata: Metadata = {
  title: "Nomiteni — テニス大会運営",
  description: "テニスシングルス大会の運営・参加・観戦",
};

// ルートレイアウト
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const prisma = getPrisma();
  const publicState = await buildPublicState();

  let user: Me | null = null;
  let isLoggedIn = false;
  if (session) {
    const foundUser = await prisma.user.findUnique({ where: { id: session.userId } });
    if (foundUser) {
      user = toClientUser({ ...foundUser, scope: session.scope }) as Me;
      isLoggedIn = true;
    }
  }

  return (
    <html lang="ja">
      <body>
        <AppProviders
          initialData={{
            user,
            isLoggedIn,
            state: publicState,
            sessionTournamentId: session?.tournamentId ?? null,
          }}
        >
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
