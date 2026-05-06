// web/src/components/sections/TournamentManagementSection.tsx
// 大会運営セクション
"use client";

import type { Match } from "@/types";

// 試合運営セクションのプロパティ
type TournamentManagementProps = {
  courtCount: number;
  matches: Match[];
  playerName: (id: number | null) => string; // IDからプレイヤー名を取得
  onAssignCourt: (matchId: number, court: number) => void; // 試合をコートに割り当てる処理
  onStart: (matchId: number) => void; // 試合を開始する処理
  onWin: (matchId: number, winnerId: number | null) => void; // 試合を勝者にする処理
};

// 大会運営セクションを返す
export function TournamentManagementSection(props: TournamentManagementProps) {
  const readyMatches = props.matches.filter((m) => m.status === "READY");
  const runningMatches = props.matches.filter((m) => m.status === "RUNNING");

  const renderMatchRow = (m: Match) => (
    <div className="matchRow" key={m.id}>
      <span>
        R{m.round}M{m.position}: {props.playerName(m.player1Id)} vs {props.playerName(m.player2Id)}
      </span>
      <select value={m.courtNumber ?? ""} onChange={(e) => props.onAssignCourt(m.id, Number(e.target.value))}>
        <option value="">コート選択</option>
        {Array.from({ length: Math.max(1, props.courtCount) }).map((_, idx) => (
          <option key={idx + 1} value={idx + 1}>
            コート {idx + 1}
          </option>
        ))}
      </select>
      <button onClick={() => props.onStart(m.id)} disabled={!m.player1Id || !m.player2Id}>
        開始
      </button>
      <button onClick={() => props.onWin(m.id, m.player1Id)} disabled={!m.player1Id}>
        勝者: {props.playerName(m.player1Id)}
      </button>
      <button onClick={() => props.onWin(m.id, m.player2Id)} disabled={!m.player2Id}>
        勝者: {props.playerName(m.player2Id)}
      </button>
    </div>
  );

  return (
    <section className="card">
      <h2>試合運営</h2>
      <p>試合を開始したり、勝者を選択したりすることができます。</p>
      <h3>READY</h3>
      {readyMatches.length === 0 && <div className="statusText">READYの試合はありません</div>}
      {readyMatches.map(renderMatchRow)}
      <h3>RUNNING</h3>
      {runningMatches.length === 0 && <div className="statusText">RUNNINGの試合はありません</div>}
      {runningMatches.map(renderMatchRow)}
    </section>
  );
}
