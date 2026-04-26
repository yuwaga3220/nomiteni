"use client";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { api } from "@/lib/client/api";
import type { AuthMode, Me } from "@/types";

type UseHomeRoleActionsParams = {
  router: AppRouterInstance;
  setMe: (me: Me | null) => void;
  setAuthModalState: (mode: AuthMode) => void;
  isLoginReady: boolean;
  setMessage: (message: string) => void;
  setForceLoginCardsView: (value: boolean) => void;
  call: (fn: () => Promise<unknown>) => Promise<void>;
  ensureLoginCredentials: () => void;
  observerLoginPasscode: string;
  adminPasscode: string;
};

export function useHomeRoleActions(params: UseHomeRoleActionsParams) {
  const openLoginModalWithMessage = () => {
    params.setMessage("まずはログインしてください。");
    params.setAuthModalState("login");
  };

  const onObserverLogin = () => {
    if (!params.isLoginReady) {
      openLoginModalWithMessage();
      return;
    }
    params.call(() => {
      params.ensureLoginCredentials();
      return api("/api/auth/observer", {
        method: "POST",
        body: JSON.stringify({ passcode: params.observerLoginPasscode }),
      });
    });
  };

  const onAdminLogin = () => {
    if (!params.isLoginReady) {
      openLoginModalWithMessage();
      return;
    }
    (async () => {
      try {
        params.ensureLoginCredentials();
        const result = await api<{ user: Me; tournamentId: number }>("/api/auth/admin", {
          method: "POST",
          body: JSON.stringify({ passcode: params.adminPasscode }),
        });
        // /admin 遷移前に role を即時反映し、ガードによる誤リダイレクトを防ぐ
        params.setMe(result.user);
        params.setForceLoginCardsView(false);
        params.router.replace("/admin");
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
