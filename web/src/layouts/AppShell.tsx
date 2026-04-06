// web/src/layouts/AppShell.tsx
// アプリケーションシェル（共通レイアウト）

"use client";

import type { ReactNode } from "react";
import { HeaderAuthButtons } from "@/components/AppSections";
import { useNomiteni } from "@/context/NomiteniContext";

// アプリケーションシェル（共通レイアウト）
export function AppShell({ children }: { children: ReactNode }) {
  // ユーザー情報と状態を取得
  const { me, isHeaderLoggedIn, authEmail, onHeaderLogout, setAuthMode, message } = useNomiteni();

  return (
    <main className="container">
      <header className="appHeader">
        <h1>テニサー大会運営サービス Nomiteni</h1>
        <HeaderAuthButtons
          setAuthMode={setAuthMode} // 認証モードを設定
          isLoginReady={isHeaderLoggedIn} // ログイン準備ができているか
          loginEmail={me?.email ?? authEmail} // ログインメールアドレス
          onLogoutClick={onHeaderLogout} // ログアウトクリック
        />
      </header>
      {message && <p className="message">{message}</p>}
      {children}
    </main>
  );
}
