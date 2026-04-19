// web/src/views/admin-page.tsx
// 管理者ページ
"use client";

import { useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminManagementSection, AdminMatchesSection, RealtimeSection } from "@/components/AppSections";
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
        <p>足の数: {actions.bracketSize}</p>
        <section className="tournamentBracket" style={{ height: actions.bracketHeight }}>
          {actions.bracketRounds.map((round) => (
            <div
              key={round.title}
              className={`tournamentBracketRound ${round.isSemifinal ? "isSemifinalRound" : ""}`}
            >
              <h3>{round.title}</h3>
              <div
                className="tournamentBracketMatches"
                style={{ gap: `${round.matchGap}px`, padding: `${round.verticalPadding}px 0` }}
              >
                {round.matches.map((match, index) => (
                  <div
                    key={`${round.title}-${index}`}
                    className={`tournamentBracketMatch ${round.isFinal ? "isFinalMatch" : ""}`}
                  >
                    <div className="tournamentBracketSlot">{match.topLabel}</div>
                    <div className="tournamentBracketSlot">{match.bottomLabel}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
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
