"use client";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { api } from "@/lib/client/api";
import type { AuthMode, Me } from "@/types";

type UseHomeAccessActionsParams = {
  router: AppRouterInstance;
  setMe: (me: Me | null) => void;
  setAuthModalState: (mode: AuthMode) => void;
  isLoggedIn: boolean;
  isLoginReady: boolean;
  setMessage: (message: string) => void;
  setForceLoginCardsView: (value: boolean) => void;
  ensureLoginCredentials: () => void;
  observerLoginPasscode: string;
  adminPasscode: string;
};

export function useHomeAccessActions(params: UseHomeAccessActionsParams) {
  const openLoginModalWithMessage = () => {
    params.setMessage("まずはログインしてください。");
    params.setAuthModalState("login");
  };

  const onObserverLogin = () => {
    (async () => {
      try {
        if (!params.observerLoginPasscode) throw new Error("観戦パスコードを入力してください。");
        await api("/api/auth/observer", {
          method: "POST",
          body: JSON.stringify({ passcode: params.observerLoginPasscode }),
        });
        params.setForceLoginCardsView(false);
        window.location.href = "/observer";
      } catch (e) {
        params.setMessage((e as Error).message);
      }
    })();
  };

  const onAdminLogin = () => {
    if (!params.isLoggedIn && !params.isLoginReady) {
      openLoginModalWithMessage();
      return;
    }
    (async () => {
      try {
        if (!params.isLoggedIn) {
          params.ensureLoginCredentials();
        }
        const result = await api<{ user: Me; tournamentId: number }>("/api/auth/admin", {
          method: "POST",
          body: JSON.stringify({ passcode: params.adminPasscode }),
        });
        // /admin 遷移前にログインユーザーを即時反映し、ガードによる誤リダイレクトを防ぐ
        params.setMe(result.user);
        params.setForceLoginCardsView(false);
        window.location.href = "/admin";
      } catch (e) {
        params.setMessage((e as Error).message);
      }
    })();
  };

  return {
    onObserverLogin,
    onAdminLogin,
  };
}
