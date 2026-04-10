// web/src/components/sections/HeaderAuth.tsx
// ヘッダー認証ボタンセクション
"use client";

import type { AuthMode } from "@/types";

// ヘッダー認証ボタンセクションのプロパティ
type HeaderAuthButtonsProps = {
  setAuthModalState: (mode: AuthMode) => void;
  isHeaderLoggedIn: boolean;
  loginEmail: string;
  onLogoutClick: () => void;
};

// ヘッダー認証ボタンセクションを返す
export function HeaderAuthButtons(props: HeaderAuthButtonsProps) {
  // ログイン中の場合
  if (props.isHeaderLoggedIn) {
    return (
      <div className="headerActions">
        <button onClick={props.onLogoutClick}>ログアウト</button>
        <span>ログイン中: {props.loginEmail}</span>
      </div>
    );
  }

  // ログインしていない場合
  return (
    <div className="headerActions">
      <button onClick={() => props.setAuthModalState("signup")}>アカウント登録</button>
      <button onClick={() => props.setAuthModalState("login")}>ログイン</button>
    </div>
  );
}

// 認証モーダルセクションのプロパティ
type AuthModalProps = {
  authModalState: AuthMode;
  setAuthModalState: (mode: AuthMode) => void;
  authEmail: string;
  setAuthEmail: (v: string) => void;
  authPassword: string;
  setAuthPassword: (v: string) => void;
  onSignup: () => Promise<void>;
  onLogin: () => Promise<void>;
};

// 認証モーダルセクションを返す
export function AuthModal(props: AuthModalProps) {
  if (props.authModalState === "none") return null; // 認証モードでない場合は何も表示しない
  if (props.authModalState === "signup") { // アカウント登録モーダル
    return (
      <div className="modalOverlay" onClick={() => props.setAuthModalState("none")}>
        <div className="modalCard" onClick={(e) => e.stopPropagation()}>
          <h2>アカウント登録</h2>
          <input placeholder="メールアドレス"
            value={props.authEmail} 
            onChange={(e) => props.setAuthEmail(e.target.value)} 
          />
          <input
            placeholder="パスワード"
            type="password"
            value={props.authPassword}
            onChange={(e) => props.setAuthPassword(e.target.value)}
          />
          <div className="row">
            <button onClick={async () => {await props.onSignup(); await props.onLogin();}}>登録する</button>
            <button onClick={() => props.setAuthModalState("none")}>閉じる</button>
          </div>
      </div>
    </div>
    );
  }
  if (props.authModalState === "login") { // ログインモーダル
    return (
      <div className="modalOverlay" onClick={() => props.setAuthModalState("none")}>
        <div className="modalCard" onClick={(e) => e.stopPropagation()}>
          <h2>ログイン情報入力</h2>
          <input placeholder="メールアドレス"
            value={props.authEmail} 
            onChange={(e) => props.setAuthEmail(e.target.value)} 
          />
          <input
            placeholder="パスワード"
            type="password"
            value={props.authPassword}
            onChange={(e) => props.setAuthPassword(e.target.value)}
          />
          <div className="row">
            <button onClick={props.onLogin}>ログインする</button>
            <button onClick={() => {props.setAuthModalState("none")}}>閉じる</button>
          </div>
        </div>
      </div>
    );
  }
}
