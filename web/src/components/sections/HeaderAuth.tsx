// web/src/components/sections/HeaderAuth.tsx
// ヘッダー認証ボタンセクション
"use client";

import type { AuthMode } from "@/types";

// ヘッダー認証ボタンセクションのプロパティ
type HeaderAuthButtonsProps = {
  setAuthMode: (mode: AuthMode) => void;
  isLoginReady: boolean;
  loginEmail: string;
  onLogoutClick: () => void;
};

// ヘッダー認証ボタンセクションを返す
export function HeaderAuthButtons(props: HeaderAuthButtonsProps) {
  // ログイン中の場合
  if (props.isLoginReady) {
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
      <button onClick={() => props.setAuthMode("signup")}>アカウント登録</button>
      <button onClick={() => props.setAuthMode("login")}>ログイン</button>
    </div>
  );
}

// 認証モーダルセクションのプロパティ
type AuthModalProps = {
  authMode: AuthMode;
  setAuthMode: (mode: AuthMode) => void;
  authEmail: string;
  setAuthEmail: (v: string) => void;
  authPassword: string;
  setAuthPassword: (v: string) => void;
  onSignup: () => void;
  onLogin: () => void;
};

// 認証モーダルセクションを返す
export function AuthModal(props: AuthModalProps) {
  // 認証モードがない場合は何も表示しない
  if (props.authMode === "none") return null;
  // 認証モーダルセクションを返す
  return (
    <div className="modalOverlay" onClick={() => props.setAuthMode("none")}> // モーダル外クリックしたら認証モード解除
      <div className="modalCard" onClick={(e) => e.stopPropagation()}> // モーダル内クリックしても親に伝えない
        <h2>{props.authMode === "signup" ? "アカウント登録" : "ログイン情報入力"}</h2>
        // メールアドレス入力
        <input placeholder="メールアドレス"
          value={props.authEmail} 
          onChange={(e) => props.setAuthEmail(e.target.value)} 
        />
        // パスワード入力
        <input
          placeholder="パスワード"
          type="password"
          value={props.authPassword}
          onChange={(e) => props.setAuthPassword(e.target.value)}
        />
        // ボタン表示
        <div className="row">
          {props.authMode === "signup" ? (
            <button onClick={props.onSignup}>登録する</button>
          ) : (
            <>
              <button onClick={props.onLogin}>ログインする</button>
            </>
          )}
          <button onClick={() => props.setAuthMode("none")}>閉じる</button>
        </div>
      </div>
    </div>
  );
}
