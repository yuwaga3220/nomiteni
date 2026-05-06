// web/src/views/admin-page.tsx
// 管理者ページ
"use client";

import { useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TournamentSettingSection, EditDrawSection, ManageTournamentSection, ObserveSection } from "@/components/AppSections";
import { useNomiteni } from "@/context/NomiteniContext";
import { useAdminActions } from "./hooks/useAdminActions";

// 管理者ページ
export function AdminPage() {
  // ルーターを取得
  const router = useRouter();
  // コンテキストを取得
  const {
    me,
    isAdminSession,
    forceLoginCardsView,
    state,
    active,
    tournamentName,
    setTournamentName,
    tournamentDate,
    setTournamentDate,
    tournamentTimeSlot,
    setTournamentTimeSlot,
    courtCountInput,
    setCourtCountInput,
    observerSetPasscode,
    setObserverSetPasscode,
    assignableMatches,
    playerName,
    groupedRounds,
    matchStatusLabel,
    tournamentParticipants,
    call,
  } = useNomiteni();

  const [selectedParticipantId1, setSelectedParticipantId1] = useState<number | null>(null);
  const [selectedParticipantId2, setSelectedParticipantId2] = useState<number | null>(null);

  const actions = useAdminActions({
    call,
    tournamentName,
    tournamentDate,
    tournamentTimeSlot,
    courtCountInput,
    observerSetPasscode,
    tournamentParticipants,
  });

  const allowed = Boolean(me && !forceLoginCardsView && isAdminSession);
  // 管理者ログインチェック
  useLayoutEffect(() => {
    if (!allowed) router.replace("/");
  }, [allowed, router]);

  // 管理者ログインチェック
  if (!allowed || !me) return null;

  // 管理者ページを返す
  return (
    <>
      <section className="card">
        <h2>管理者メニュー</h2>
        <br />
        <button onClick={() => router.push("/")}>ホームに戻る</button>
      </section>
      <TournamentSettingSection
        active={active}
        state={state}
        tournamentName={tournamentName}
        setTournamentName={setTournamentName}
        tournamentDate={tournamentDate}
        setTournamentDate={setTournamentDate}
        tournamentTimeSlot={tournamentTimeSlot}
        setTournamentTimeSlot={setTournamentTimeSlot}
        courtCountInput={courtCountInput}
        setCourtCountInput={setCourtCountInput}
        observerSetPasscode={observerSetPasscode}
        setObserverSetPasscode={setObserverSetPasscode}
        participants={tournamentParticipants}
        onSaveTournamentSettings={actions.onSaveTournamentSettings}
        onSetTournamentStatus={actions.onSetTournamentStatus}
        onCreateParticipant={actions.onCreateParticipant}
        onUpdateParticipant={actions.onUpdateParticipant}
        onDeleteParticipant={actions.onDeleteParticipant}
      />
      <EditDrawSection
        bracketSize={actions.bracketSize}
        bracketHeight={actions.bracketHeight}
        bracketRounds={actions.bracketRounds}
        tournamentStatus={active?.status}
        participants={tournamentParticipants}
        selectedParticipantId1={selectedParticipantId1}
        setSelectedParticipantId1={setSelectedParticipantId1}
        selectedParticipantId2={selectedParticipantId2}
        setSelectedParticipantId2={setSelectedParticipantId2}
        onSwapParticipants={actions.onSwapParticipants}
      />
      {active && (
        <ManageTournamentSection
          courtCount={active.courtCount ?? 1}
          matches={assignableMatches}
          playerName={playerName}
          onAssignCourt={actions.onAssignCourt}
          onStart={actions.onStart}
          onWin={actions.onWin}
        />
      )}
      <ObserveSection
        active={active}
        state={state}
        groupedRounds={groupedRounds}
        playerName={playerName}
        matchStatusLabel={matchStatusLabel}
      />
    </>
  );
}
