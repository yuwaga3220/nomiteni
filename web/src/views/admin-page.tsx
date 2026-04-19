// web/src/views/admin-page.tsx
// 管理者ページ
"use client";

import { useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminManagementSection, AdminMatchesSection, RealtimeSection } from "@/components/AppSections";
import { useNomiteni } from "@/context/NomiteniContext";
import type { TournamentParticipant } from "@/types";
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
  });

  const allowed = Boolean(me && !forceLoginCardsView && me.role === "ADMIN");
  // 管理者ログインチェック
  useLayoutEffect(() => {
    if (!allowed) router.replace("/");
  }, [allowed, router]);

  // 管理者ログインチェック
  if (!allowed || !me) return null;

  const bracketSize = Math.max(1, 2 ** Math.ceil(Math.log2(Math.max(1, tournamentParticipants.length))));
  const half = Math.max(1, bracketSize / 2);
  const normalized = tournamentParticipants
    .map((participant) => ({
      ...participant,
      normalizedPosition: participant.initialPosition ?? Number.MAX_SAFE_INTEGER,
    }))
    .sort((a, b) => {
      if (a.normalizedPosition !== b.normalizedPosition) return a.normalizedPosition - b.normalizedPosition;
      return a.userId - b.userId;
    });
  const leftParticipants = normalized.filter((participant) => participant.normalizedPosition <= half);
  const rightParticipants = normalized.filter((participant) => participant.normalizedPosition > half);

  const renderParticipant = (participant: TournamentParticipant & { normalizedPosition: number }) => (
    <div key={participant.userId} className="listItem">
      <span>
        #{participant.initialPosition ?? "-"} {participant.name}
      </span>
    </div>
  );

  // 管理者ページを返す
  return (
    <>
      <section className="card">
        <h2>管理者メニュー</h2>
        <p>
          ログイン中: {me.name} ({me.email})
        </p>
        <br />
        <button onClick={() => router.push("/")}>戻る</button>
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
        onSetReady={actions.onSetReady}
        onSetAbsent={actions.onSetAbsent}
        onSetUnanswered={actions.onSetUnanswered}
      />
      <section className="card">
        <h2>トーナメント編集</h2>
        <p>足の数: {bracketSize}（左右しきい値: {half}）</p>
        <section className="grid2">
          <div>
            <h3>左側</h3>
            <div className="list">{leftParticipants.map((participant) => renderParticipant(participant))}</div>
          </div>
          <div>
            <h3>右側</h3>
            <div className="list">{rightParticipants.map((participant) => renderParticipant(participant))}</div>
          </div>
        </section>
      </section>
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
      />
    </>
  );
}
