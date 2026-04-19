// web/src/components/sections/RealtimeSection.tsx
// リアルタイム進行表示セクション
"use client";

import type { Match, PublicState, Tournament } from "@/types";

type RealtimeProps = {
  active: Tournament | null | undefined;
  state: PublicState | null;
  groupedRounds: Array<[number, Match[]]>;
  playerName: (id: number | null) => string;
  matchStatusLabel: (status: Match["status"]) => string;
};

// リアルタイム進行表示セクション
export function RealtimeSection(props: RealtimeProps) {
  return (
    <section className="card">
      <h2>リアルタイム進行表示</h2>
      <p>コート数: {props.active?.courtCount ?? "-"}</p>
      <p>大会: {props.active ? `${props.active.name} (${props.active.status})` : "未作成"}</p>
      <h3>現在の試合</h3>
      <div className="list">
        {(props.active?.matches ?? [])
          .filter((m) => m.status === "ASSIGNED" || m.status === "IN_PROGRESS")
          .map((m) => (
            <div key={m.id} className="listItem">
              <span>
                コート{m.courtNumber}: {props.playerName(m.player1Id)} vs {props.playerName(m.player2Id)}
              </span>
              <strong>{props.matchStatusLabel(m.status)}</strong>
            </div>
          ))}
      </div>
      <h3>トーナメント表</h3>
      <div className="rounds">
        {props.groupedRounds.map(([round, matches]) => (
          <div key={round} className="round">
            <h4>{round}回戦</h4>
            {matches.map((m) => (
              <div key={m.id} className="bracketCard">
                <div className={m.winnerId === m.player1Id ? "winner" : ""}>{props.playerName(m.player1Id)}</div>
                <div className={m.winnerId === m.player2Id ? "winner" : ""}>{props.playerName(m.player2Id)}</div>
                <small>{props.matchStatusLabel(m.status)}</small>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
