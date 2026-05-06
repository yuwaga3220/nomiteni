// web/src/views/home-page.tsx
// ホームページ
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthModal, HomeAccessSection } from "@/components/AppSections";
import { useNomiteni } from "@/context/NomiteniContext";
import { api } from "@/lib/client/api";
import { useHomeActions } from "./hooks/useHomeActions";

// ホームページ
export function HomePage() {
  // ルーターを取得
  const router = useRouter();
  // コンテキストを取得
  const {
    authModalState,
    setAuthModalState,
    setMe,
    authEmail,
    setAuthEmail,
    authPassword,
    setAuthPassword,
    adminPasscode,
    setAdminPasscode,
    observerLoginPasscode,
    setObserverLoginPasscode,
    createModalOpen,
    setCreateModalOpen,
    createTournamentName,
    setCreateTournamentName,
    createTournamentDate,
    setCreateTournamentDate,
    createTournamentTimeSlot,
    setCreateTournamentTimeSlot,
    createTournamentCourtCount,
    setCreateTournamentCourtCount,
    createTournamentObserverPasscode,
    setCreateTournamentObserverPasscode,
    activeTournaments,
    isLoginReady,
    setMessage,
    setForceLoginCardsView,
    call,
    ensureLoginCredentials,
    refresh,
  } = useNomiteni();

  const actions = useHomeActions({
    router,
    setMe,
    setAuthModalState,
    isLoginReady,
    setMessage,
    setForceLoginCardsView,
    call,
    ensureLoginCredentials,
    refresh,
    observerLoginPasscode,
    adminPasscode,
    createTournamentName,
    createTournamentDate,
    createTournamentTimeSlot,
    createTournamentCourtCount,
    createTournamentObserverPasscode,
    authEmail,
    authPassword,
  });

  // ホームに来たら、セッションを（scope: login、tournamentId なし）に揃える
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await api("/api/auth/session/home", { method: "POST" });
        if (!cancelled) await refresh();
      } catch {
        // 未ログインなどは無視
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- マウント時のみ
  }, []);

  // AuthModalとHomeAccessSectionを返す
  return (
    <>
      <AuthModal
        authModalState={authModalState}
        setAuthModalState={setAuthModalState}
        authEmail={authEmail}
        setAuthEmail={setAuthEmail}
        authPassword={authPassword}
        setAuthPassword={setAuthPassword}
        onLogin={actions.onLogin}
        onSignup={actions.onSignup}
      />
      <HomeAccessSection // ホームアクセスセクション
        adminPasscode={adminPasscode}
        setAdminPasscode={setAdminPasscode}
        observerLoginPasscode={observerLoginPasscode}
        setObserverLoginPasscode={setObserverLoginPasscode}
        onRequestCreateTournament={() => actions.onRequestCreateTournament(setCreateModalOpen)}
        onCreateTournament={() => {
          void actions.onCreateTournament(setCreateModalOpen);
        }}
        createModalOpen={createModalOpen}
        setCreateModalOpen={setCreateModalOpen}
        createTournamentName={createTournamentName}
        setCreateTournamentName={setCreateTournamentName}
        createTournamentDate={createTournamentDate}
        setCreateTournamentDate={setCreateTournamentDate}
        createTournamentTimeSlot={createTournamentTimeSlot}
        setCreateTournamentTimeSlot={setCreateTournamentTimeSlot}
        createTournamentCourtCount={createTournamentCourtCount}
        setCreateTournamentCourtCount={setCreateTournamentCourtCount}
        createTournamentObserverPasscode={createTournamentObserverPasscode}
        setCreateTournamentObserverPasscode={setCreateTournamentObserverPasscode}
        activeTournaments={activeTournaments}
        onObserverLogin={actions.onObserverLogin}
        onAdminLogin={actions.onAdminLogin}
      />
    </>
  );
}
