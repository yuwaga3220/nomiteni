// web/src/components/sections/RealtimeSection.tsx
// リアルタイム進行表示セクション
"use client";

import { useMemo } from "react";
import type { Match, PublicState, Tournament } from "@/types";
import { TournamentBracketView, type BracketRoundView } from "./TournamentBracketView";

type RealtimeProps = {
  active: Tournament | null | undefined;
  state: PublicState | null;
  groupedRounds: Array<[number, Match[]]>;
  playerName: (id: number | null) => string;
  matchStatusLabel: (status: Match["status"]) => string;
  bracketSize?: number;
  bracketRounds?: BracketRoundView[];
};

// リアルタイム進行表示セクション
export function RealtimeSection(props: RealtimeProps) {
  const tournamentMatches = useMemo(
    () => props.active?.matches ?? props.groupedRounds.flatMap(([, matches]) => matches),
    [props.active?.matches, props.groupedRounds],
  );

  const inProgressMatches = useMemo(
    () => tournamentMatches.filter((m) => m.status === "ASSIGNED" || m.status === "IN_PROGRESS"),
    [tournamentMatches],
  );

  const groupedRoundsSorted = useMemo(
    () =>
      [...props.groupedRounds]
        .sort((a, b) => a[0] - b[0])
        .map(([round, matches]) => [round, [...matches].sort((a, b) => a.position - b.position)] as const),
    [props.groupedRounds],
  );

  const bracketRounds = useMemo<BracketRoundView[]>(() => {
    const totalRounds = groupedRoundsSorted.length;
    if (!totalRounds) return [];

    return groupedRoundsSorted.map(([round, matches], roundIndex) => {
      const title =
        roundIndex === totalRounds - 1
          ? "決勝"
          : roundIndex === totalRounds - 2
            ? "準決勝"
            : `R${round}`;
      const isFinal = roundIndex === totalRounds - 1;
      const isSemifinal = roundIndex === totalRounds - 2;
      const matchViews = matches.map((match) => ({
        topLabel: props.playerName(match.player1Id),
        bottomLabel: props.playerName(match.player2Id),
      }));

      return { title, matches: matchViews, isFinal, isSemifinal, matchGap: 0, verticalPadding: 0 };
    });
  }, [groupedRoundsSorted, props.playerName]);

  const fallbackBracketSize = useMemo(() => {
    const firstRoundMatchCount = groupedRoundsSorted[0]?.[1].length ?? 0;
    return Math.max(1, firstRoundMatchCount * 2);
  }, [groupedRoundsSorted]);
  const displayBracketRounds = props.bracketRounds ?? bracketRounds;
  const displayBracketSize = props.bracketSize ?? fallbackBracketSize;

  return (
    <section className="card">
      <h2>トーナメント進行状態</h2>
      <p>大会： {props.active ? `${props.active.name} (${props.active.status})` : "未作成"}</p>
      <p>コート数： {props.active?.courtCount ?? "-"}</p>
      <h3>進行中の試合</h3>
      <div className="list">
        {inProgressMatches.length === 0 && <div className="statusText">現在進行中の試合はありません</div>}
        {inProgressMatches.map((m) => (
          <div key={m.id} className="listItem">
            <span>
              コート{m.courtNumber}: {props.playerName(m.player1Id)} vs {props.playerName(m.player2Id)}
            </span>
            <strong>{props.matchStatusLabel(m.status)}</strong>
          </div>
        ))}
      </div>
      <h3>トーナメント表</h3>
      <TournamentBracketView
        bracketRounds={displayBracketRounds}
        showRoundHeaders={true}
        showMatchDescription={true}
      />
    </section>
  );
}
