import type { Metadata } from "next";
import { AppProviders } from "./providers";
import "./globals.css";

// メタデータ
export const metadata: Metadata = {
  title: "Nomiteni — テニス大会運営",
  description: "テニスシングルス大会の運営・参加・観戦",
};

// ルートレイアウト
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
