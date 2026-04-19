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
    authEmail,
    setAuthEmail,
    authPassword,
    setAuthPassword,
    entryPasscode,
    setEntryPasscode,
    entryName,
    setEntryName,
    entryParty,
    setEntryParty,
    entryNote,
    setEntryNote,
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
    createTournamentEntryPasscode,
    setCreateTournamentEntryPasscode,
    createTournamentObserverPasscode,
    setCreateTournamentObserverPasscode,
    activeTournaments,
    isLoginReady,
    setMessage,
    setEntryTournament,
    setForceLoginCardsView,
    call,
    ensureLoginCredentials,
    refresh,
  } = useNomiteni();

  const actions = useHomeActions({
    router,
    setAuthModalState,
    isLoginReady,
    setMessage,
    setEntryTournament,
    setForceLoginCardsView,
    call,
    ensureLoginCredentials,
    refresh,
    entryPasscode,
    setEntryPasscode,
    entryName,
    entryParty,
    entryNote,
    observerLoginPasscode,
    adminPasscode,
    createTournamentName,
    createTournamentDate,
    createTournamentTimeSlot,
    createTournamentCourtCount,
    createTournamentEntryPasscode,
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
        tournamentPasscode={entryPasscode}
        setTournamentPasscode={setEntryPasscode}
        entryName={entryName}
        setEntryName={setEntryName}
        entryParty={entryParty}
        setEntryParty={setEntryParty}
        entryNote={entryNote}
        setEntryNote={setEntryNote}
        adminPasscode={adminPasscode}
        setAdminPasscode={setAdminPasscode}
        observerLoginPasscode={observerLoginPasscode}
        setObserverLoginPasscode={setObserverLoginPasscode}
        entryModalOpen={actions.entryModalOpen}
        setEntryModalOpen={actions.setEntryModalOpen}
        participantSelectModalOpen={actions.participantSelectModalOpen}
        setParticipantSelectModalOpen={actions.setParticipantSelectModalOpen}
        participantTournaments={actions.participantTournaments}
        onSelectParticipantTournament={actions.onSelectParticipantTournament}
        onRequestCreateTournament={() => actions.onRequestCreateTournament(setCreateModalOpen)}
        onRequestEntryTournament={actions.onRequestEntryTournament}
        onEntryTournament={actions.onEntryTournament}
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
        createTournamentEntryPasscode={createTournamentEntryPasscode}
        setCreateTournamentEntryPasscode={setCreateTournamentEntryPasscode}
        createTournamentObserverPasscode={createTournamentObserverPasscode}
        setCreateTournamentObserverPasscode={setCreateTournamentObserverPasscode}
        activeTournaments={activeTournaments}
        onParticipantOpen={actions.onParticipantOpen}
        onObserverLogin={actions.onObserverLogin}
        onAdminLogin={actions.onAdminLogin}
      />
    </>
  );
}
