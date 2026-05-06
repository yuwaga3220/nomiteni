"use client";

import { api } from "@/lib/client/api";
import type { AuthMode } from "@/types";

type UseHomeAuthActionsParams = {
  call: (fn: () => Promise<unknown>) => Promise<void>;
  setMessage: (message: string) => void;
  setAuthModalState: (mode: AuthMode) => void;
  authEmail: string;
  authPassword: string;
};

export function useHomeAuthActions(params: UseHomeAuthActionsParams) {
  const onLogin = async () => {
    await params.call(async () => {
      if (!params.authEmail || !params.authPassword) {
        params.setMessage("ログイン用のメールアドレスとパスワードを入力してください。");
        return;
      }
      await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: params.authEmail, password: params.authPassword }),
      });
      params.setMessage("ログイン情報を入力しました。管理者パスコードで管理画面へ進んでください。");
      params.setAuthModalState("none");
    });
  };

  const onSignup = () =>
    params.call(async () => {
      if (!params.authEmail || !params.authPassword) {
        throw new Error("サインアップ用のメールアドレスとパスワードを入力してください。");
      }
      await api("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email: params.authEmail, password: params.authPassword }),
      });
      params.setAuthModalState("none");
    });

  return {
    onLogin,
    onSignup,
  };
}
