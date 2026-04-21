// web/src/views/admin-page.tsx
// 管理者ページ
"use client";

import { useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminManagementSection, AdminTournamentEditSection, AdminMatchesSection, RealtimeSection } from "@/components/AppSections";
import { useNomiteni } from "@/context/NomiteniContext";
import { useAdminActions } from "./hooks/useAdminActions";

// 管理者ページ
export function AdminPage() {
  // ルーターを取得
  const router = useRouter();
  // コンテキストを取得
  const {
    me,
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
    entrySetPasscode,
    setEntrySetPasscode,
    checkinState,
    assignableMatches,
    playerName,
    groupedRounds,
    matchStatusLabel,
    tournamentParticipants,
    call,
  } = useNomiteni();
  const actions = useAdminActions({
    call,
    tournamentName,
    tournamentDate,
    tournamentTimeSlot,
    courtCountInput,
    entrySetPasscode,
    observerSetPasscode,
    tournamentParticipants,
  });

  const allowed = Boolean(me && !forceLoginCardsView && me.role === "ADMIN");
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
      <AdminManagementSection
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
        entrySetPasscode={entrySetPasscode}
        setEntrySetPasscode={setEntrySetPasscode}
        checkinState={checkinState}
        onSaveTournamentSettings={actions.onSaveTournamentSettings}
        onSetTournamentStatus={actions.onSetTournamentStatus}
        onSetReady={actions.onSetReady}
        onSetAbsent={actions.onSetAbsent}
        onSetUnanswered={actions.onSetUnanswered}
      />
      <AdminTournamentEditSection
        bracketSize={actions.bracketSize}
        bracketHeight={actions.bracketHeight}
        bracketRounds={actions.bracketRounds}
      />
      {active && (
        <AdminMatchesSection
          courtCount={active.courtCount ?? 1}
          matches={assignableMatches}
          playerName={playerName}
          onAssignCourt={actions.onAssignCourt}
          onStart={actions.onStart}
          onWin={actions.onWin}
        />
      )}
      <RealtimeSection
        active={active}
        state={state}
        groupedRounds={groupedRounds}
        playerName={playerName}
        matchStatusLabel={matchStatusLabel}
        bracketSize={actions.bracketSize}
        bracketRounds={actions.bracketRounds}
      />
    </>
  );
}
