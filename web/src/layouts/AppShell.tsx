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
    <div className="appShell">
      <main className="container appMain">
        <header className="appHeader">
          <h1>
            <Link href="/" className="appTitleLink">
              ノミテニ
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
      <footer className="appFooter">
        <p className="appFooterText">Developed at Picnic Tennis Court</p>
        <div className="appFooterActions">
          <button type="button">Usage</button>
          <button type="button">Contact</button>
        </div>
      </footer>
    </div>
  );
}
