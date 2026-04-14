"use client";

import type { AuthMode } from "@/types";

type HeaderAuthButtonsProps = {
  setAuthModalState: (mode: AuthMode) => void;
  isLoggedIn: boolean;
  loginEmail: string;
  onLogoutClick: () => void;
};

export function HeaderAuthButtons(props: HeaderAuthButtonsProps) {
  if (props.isLoggedIn) {
    return (
      <div className="headerActions">
        <button onClick={props.onLogoutClick}>ログアウト</button>
        <span>ログイン中: {props.loginEmail}</span>
      </div>
    );
  }

  return (
    <div className="headerActions">
      <button onClick={() => props.setAuthModalState("signup")}>アカウント登録</button>
      <button onClick={() => props.setAuthModalState("login")}>ログイン</button>
    </div>
  );
}
