/**
 * プロバイダー（コンテキストの提供）
 * コンテキストは、アプリケーションの状態を管理するためのもの
 */

"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/client/api";
import { NomiteniContext, type NomiteniContextValue } from "@/context/NomiteniContext";
import { useNomiteniLocalState } from "./nomiteni/useNomiteniLocalState";
import { useNomiteniDerivedState } from "./nomiteni/useNomiteniDerivedState";
import { useNomiteniEffects } from "./nomiteni/useNomiteniEffects";
import type { NomiteniBootstrapData } from "./nomiteni/types";

export type { NomiteniBootstrapData } from "./nomiteni/types";

// プロバイダーコンポーネント
export function NomiteniProvider({
  children,
  initialData,
}: {
  children: ReactNode;
  initialData: NomiteniBootstrapData;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const localState = useNomiteniLocalState(initialData);
  const {
    activeTournaments,
    active,
    assignableMatches,
    groupedRounds,
    isLoginReady,
    playerName,
    matchStatusLabel,
  } = useNomiteniDerivedState({
    state: localState.state,
    sessionTournamentId: localState.sessionTournamentId,
    authEmail: localState.authEmail,
    authPassword: localState.authPassword,
  });

  const refresh = async () => {
    router.refresh();
    localState.setMessage("");
  };

  useNomiteniEffects({
    initialData,
    me: localState.me,
    forceLoginCardsView: localState.forceLoginCardsView,
    sessionTournamentId: localState.sessionTournamentId,
    isAdminSession: localState.isAdminSession,
    setMe: localState.setMe,
    setIsLoggedIn: localState.setIsLoggedIn,
    setIsAdminSession: localState.setIsAdminSession,
    setState: localState.setState,
    setSessionTournamentId: localState.setSessionTournamentId,
    setMessage: localState.setMessage,
    setTournamentName: localState.setTournamentName,
    setTournamentDate: localState.setTournamentDate,
    setTournamentTimeSlot: localState.setTournamentTimeSlot,
    setCourtCountInput: localState.setCourtCountInput,
    setObserverSetPasscode: localState.setObserverSetPasscode,
    setTournamentParticipants: localState.setTournamentParticipants,
    active,
    pathname,
    router,
  });

  // 非同期関数を呼び出し、更新してメッセージを表示
  const call = async (fn: () => Promise<unknown>) => {
    try {
      await fn(); // 非同期関数を呼び出し
      await refresh(); // 状態を更新
      localState.setMessage("更新しました。");
    } catch (e) {
      localState.setMessage((e as Error).message);
    }
  };

  // メールとパスワードが入力されているかを確認
  const ensureLoginCredentials = () => {
    if (!localState.authEmail || !localState.authPassword) {
      throw new Error("まずはログインしてください。");
    }
  };

  // ヘッダーのログアウト
  const onHeaderLogout = () => {
    localState.setAuthModalState("none");
    localState.setAuthEmail("");
    localState.setAuthPassword("");
    localState.setCreateModalOpen(false);
    localState.setForceLoginCardsView(false);
    if (localState.me || localState.isLoggedIn) {
      void call(() => api("/api/auth/logout", { method: "POST" }));
      return;
    }
    localState.setMessage("ログイン情報をクリアしました。");
  };

  // コンテキストの値を設定
  const value: NomiteniContextValue = {
    me: localState.me,
    setMe: localState.setMe,
    state: localState.state,
    message: localState.message,
    setMessage: localState.setMessage,
    forceLoginCardsView: localState.forceLoginCardsView,
    setForceLoginCardsView: localState.setForceLoginCardsView,
    authModalState: localState.authModalState,
    setAuthModalState: localState.setAuthModalState,
    authEmail: localState.authEmail,
    setAuthEmail: localState.setAuthEmail,
    authPassword: localState.authPassword,
    setAuthPassword: localState.setAuthPassword,
    adminPasscode: localState.adminPasscode,
    setAdminPasscode: localState.setAdminPasscode,
    observerLoginPasscode: localState.observerLoginPasscode,
    setObserverLoginPasscode: localState.setObserverLoginPasscode,
    createModalOpen: localState.createModalOpen,
    setCreateModalOpen: localState.setCreateModalOpen,
    createTournamentName: localState.createTournamentName,
    setCreateTournamentName: localState.setCreateTournamentName,
    createTournamentDate: localState.createTournamentDate,
    setCreateTournamentDate: localState.setCreateTournamentDate,
    createTournamentTimeSlot: localState.createTournamentTimeSlot,
    setCreateTournamentTimeSlot: localState.setCreateTournamentTimeSlot,
    createTournamentCourtCount: localState.createTournamentCourtCount,
    setCreateTournamentCourtCount: localState.setCreateTournamentCourtCount,
    createTournamentObserverPasscode: localState.createTournamentObserverPasscode,
    setCreateTournamentObserverPasscode: localState.setCreateTournamentObserverPasscode,
    observerSetPasscode: localState.observerSetPasscode,
    setObserverSetPasscode: localState.setObserverSetPasscode,
    tournamentName: localState.tournamentName,
    setTournamentName: localState.setTournamentName,
    tournamentDate: localState.tournamentDate,
    setTournamentDate: localState.setTournamentDate,
    tournamentTimeSlot: localState.tournamentTimeSlot,
    setTournamentTimeSlot: localState.setTournamentTimeSlot,
    courtCountInput: localState.courtCountInput,
    setCourtCountInput: localState.setCourtCountInput,
    isLoggedIn: localState.isLoggedIn,
    isAdminSession: localState.isAdminSession,
    sessionTournamentId: localState.sessionTournamentId,
    isLoginReady,
    activeTournaments,
    active,
    assignableMatches,
    refresh,
    playerName,
    matchStatusLabel,
    call,
    ensureLoginCredentials,
    groupedRounds,
    tournamentParticipants: localState.tournamentParticipants,
    onHeaderLogout,
  };

  // コンテキストの値を提供
  return <NomiteniContext.Provider value={value}>{children}</NomiteniContext.Provider>; // コンテキストの値を提供
}
