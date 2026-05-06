// web/src/components/sections/ObserveSection.tsx
// 観戦表示セクション
"use client";

import { useMemo } from "react";
import type { Match, PublicState, Tournament } from "@/types";
import { getStatusLabel } from "@/lib/status-label";
import { TournamentBracketView, type BracketRoundView } from "./TournamentBracketView";

type ObserveProps = {
  active: Tournament | null | undefined;
  state: PublicState | null;
  groupedRounds: Array<[number, Match[]]>;
  playerName: (id: number | null) => string;
  matchStatusLabel: (status: Match["status"]) => string;
  bracketRounds?: BracketRoundView[];
};

// 観戦表示セクション
export function ObserveSection(props: ObserveProps) {
  const {
    active,
    bracketRounds: providedBracketRounds,
    groupedRounds,
    matchStatusLabel,
    playerName,
  } = props;
  const tournamentMatches = useMemo(
    () => active?.matches ?? groupedRounds.flatMap(([, matches]) => matches),
    [active?.matches, groupedRounds],
  );

  const runningMatches = useMemo(
    () => tournamentMatches.filter((m) => m.status === "RUNNING"),
    [tournamentMatches],
  );

  const groupedRoundsSorted = useMemo(
    () =>
      [...groupedRounds]
        .sort((a, b) => a[0] - b[0])
        .map(([round, matches]) => [round, [...matches].sort((a, b) => a.position - b.position)] as const),
    [groupedRounds],
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
            : `${round}回戦`;
      const isFinal = roundIndex === totalRounds - 1;
      const isSemifinal = roundIndex === totalRounds - 2;
      const matchViews = matches.map((match) => ({
        topLabel: playerName(match.player1Id),
        bottomLabel: playerName(match.player2Id),
        topId: match.player1Id,
        bottomId: match.player2Id,
        winnerId: match.winnerId,
      }));

      return { title, matches: matchViews, isFinal, isSemifinal, matchGap: 0, verticalPadding: 0 };
    });
  }, [groupedRoundsSorted, playerName]);

  const displayBracketRounds = providedBracketRounds ?? bracketRounds;

  return (
    <section className="card">
      <h2>トーナメント進行状態</h2>
      <p>現在の大会の進行状態をリアルタイムに表示します。このセクションは誰でも閲覧できます。</p>
      <p>大会： {active ? `${active.name} (${getStatusLabel(active.status)})` : "未作成"}</p>
      <p>コート数： {active?.courtCount ?? "-"}</p>
      <h3>進行中の試合</h3>
      <div className="list">
        {runningMatches.length === 0 && <div className="statusText">現在進行中の試合はありません。</div>}
        {runningMatches.map((m) => (
          <div key={m.id} className="listItem">
            <span>
              コート{m.courtNumber}: {playerName(m.player1Id)} vs {playerName(m.player2Id)}
            </span>
            <strong>{matchStatusLabel(m.status)}</strong>
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
