// web/src/layouts/AppShell.tsx
// アプリケーションシェル（共通レイアウト）

"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { HeaderAuthButtons } from "@/components/AppSections";
import { useNomiteni } from "@/context/NomiteniContext";

// アプリケーションシェル（共通レイアウト）
export function AppShell({ children }: { children: ReactNode }) {
  // ユーザー情報と状態を取得
  const { me, isLoggedIn, authEmail, onHeaderLogout, setAuthModalState, message } = useNomiteni();

  return (
    <main className="container">
      <header className="appHeader">
        <h1>
          <Link href="/" className="appTitleLink">
            テニサー大会運営サービス Nomiteni
          </Link>
        </h1>
        <HeaderAuthButtons
          setAuthModalState={setAuthModalState} // 認証モードを設定
          isLoggedIn={isLoggedIn} // ログイン状態
          loginEmail={me?.email ?? authEmail} // ログインメールアドレス
          onLogoutClick={onHeaderLogout} // ログアウトクリック
        />
      </header>
      {message && <p className="message">{message}</p>}
      {children}
    </main>
  );
}
