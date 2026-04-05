/**
 * アプリケーションシェル（共通レイアウト）
 */

"use client";

import type { ReactNode } from "react";
import { HeaderAuthButtons } from "@/components/AppSections";
import { useNomiteni } from "@/context/NomiteniContext";

export function AppShell({ children }: { children: ReactNode }) {
  const { me, isHeaderLoggedIn, authEmail, onHeaderLogout, setAuthMode, message } = useNomiteni();

  return (
    <main className="container">
      <header className="appHeader">
        <h1>テニサー大会運営サービス Nomiteni</h1>
        <HeaderAuthButtons
          setAuthMode={setAuthMode}
          isLoginReady={isHeaderLoggedIn}
          loginEmail={me?.email ?? authEmail}
          onLogoutClick={onHeaderLogout}
        />
      </header>
      {message && <p className="message">{message}</p>}
      {children}
    </main>
  );
}
