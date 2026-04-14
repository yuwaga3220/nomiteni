"use client";

import type { AuthMode } from "@/types";

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

export function AuthModal(props: AuthModalProps) {
  if (props.authModalState === "none") return null;

  if (props.authModalState === "signup") {
    return (
      <div className="modalOverlay" onClick={() => props.setAuthModalState("none")}>
        <div className="modalCard" onClick={(e) => e.stopPropagation()}>
          <h2>アカウント登録</h2>
          <input placeholder="メールアドレス" value={props.authEmail} onChange={(e) => props.setAuthEmail(e.target.value)} />
          <input
            placeholder="パスワード"
            type="password"
            value={props.authPassword}
            onChange={(e) => props.setAuthPassword(e.target.value)}
          />
          <div className="row">
            <button
              onClick={async () => {
                await props.onSignup();
                await props.onLogin();
              }}
            >
              登録する
            </button>
            <button onClick={() => props.setAuthModalState("none")}>閉じる</button>
          </div>
        </div>
      </div>
    );
  }

  if (props.authModalState === "login") {
    return (
      <div className="modalOverlay" onClick={() => props.setAuthModalState("none")}>
        <div className="modalCard" onClick={(e) => e.stopPropagation()}>
          <h2>ログイン情報入力</h2>
          <input placeholder="メールアドレス" value={props.authEmail} onChange={(e) => props.setAuthEmail(e.target.value)} />
          <input
            placeholder="パスワード"
            type="password"
            value={props.authPassword}
            onChange={(e) => props.setAuthPassword(e.target.value)}
          />
          <div className="row">
            <button onClick={props.onLogin}>ログインする</button>
            <button onClick={() => props.setAuthModalState("none")}>閉じる</button>
          </div>
        </div>
      </div>
    );
  }
}
