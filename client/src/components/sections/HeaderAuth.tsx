import type { AuthMode } from "../../types";

type HeaderAuthButtonsProps = {
  setAuthMode: (mode: AuthMode) => void;
  isLoginReady: boolean;
  loginEmail: string;
  onLogoutClick: () => void;
};

export function HeaderAuthButtons(props: HeaderAuthButtonsProps) {
  if (props.isLoginReady) {
    return (
      <div className="headerActions">
        <button onClick={props.onLogoutClick}>ログアウト</button>
        <span>ログイン中: {props.loginEmail}</span>
      </div>
    );
  }

  return (
    <div className="headerActions">
      <button onClick={() => props.setAuthMode("signup")}>アカウント登録</button>
      <button onClick={() => props.setAuthMode("login")}>ログイン</button>
    </div>
  );
}

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

export function AuthModal(props: AuthModalProps) {
  if (props.authMode === "none") return null;

  return (
    <div className="modalOverlay" onClick={() => props.setAuthMode("none")}>
      <div className="modalCard" onClick={(e) => e.stopPropagation()}>
        <h2>{props.authMode === "signup" ? "アカウント登録" : "ログイン情報入力"}</h2>
        <input placeholder="メールアドレス" value={props.authEmail} onChange={(e) => props.setAuthEmail(e.target.value)} />
        <input
          placeholder="パスワード"
          type="password"
          value={props.authPassword}
          onChange={(e) => props.setAuthPassword(e.target.value)}
        />
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
