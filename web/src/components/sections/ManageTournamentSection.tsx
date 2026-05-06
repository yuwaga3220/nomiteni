// web/src/components/sections/ManageTournamentSection.tsx
// 大会運営セクション
"use client";

import type { Match } from "@/types";
import { getStatusLabel } from "@/lib/status-label";

// 試合運営セクションのプロパティ
type ManageTournamentProps = {
  courtCount: number;
  matches: Match[];
  playerName: (id: number | null) => string; // IDからプレイヤー名を取得
  onAssignCourt: (matchId: number, court: number) => void; // 試合をコートに割り当てる処理
  onStart: (matchId: number) => void; // 試合を開始する処理
  onBackToReady: (matchId: number) => void; // 試合を準備中へ戻す処理
  onWin: (matchId: number, winnerId: number | null) => void; // 試合を勝者にする処理
};

// 大会運営セクションを返す
export function ManageTournamentSection(props: ManageTournamentProps) {
  const readyMatches = props.matches.filter((m) => m.status === "READY");
  const runningMatches = props.matches.filter((m) => m.status === "RUNNING");

  const renderReadyMatchRow = (m: Match) => (
    <div className="matchRow" key={m.id}>
      <span className="matchRowLabel">
        {m.round}回戦 第{m.position}試合: {props.playerName(m.player1Id)} vs {props.playerName(m.player2Id)}
      </span>
      <select value={m.courtNumber ?? ""} onChange={(e) => props.onAssignCourt(m.id, Number(e.target.value))}>
        <option value="">コート選択</option>
        {Array.from({ length: Math.max(1, props.courtCount) }).map((_, idx) => (
          <option key={idx + 1} value={idx + 1}>
            コート {idx + 1}
          </option>
        ))}
      </select>
      <button onClick={() => props.onStart(m.id)} disabled={!m.player1Id || !m.player2Id || !m.courtNumber}>
        開始
      </button>
    </div>
  );

  const renderRunningMatchRow = (m: Match) => (
    <div className="matchRow" key={m.id}>
      <span className="matchRowLabel">
        {m.round}回戦 第{m.position}試合: {props.playerName(m.player1Id)} vs {props.playerName(m.player2Id)}
      </span>
      
      <button onClick={() => props.onWin(m.id, m.player1Id)} disabled={!m.player1Id}>
        勝者: {props.playerName(m.player1Id)}
      </button>
      <button onClick={() => props.onWin(m.id, m.player2Id)} disabled={!m.player2Id}>
        勝者: {props.playerName(m.player2Id)}
      </button>
      <button className="roleBackToReadyButton" onClick={() => props.onBackToReady(m.id)}>
        準備中に戻す
      </button>

    </div>
  );

  return (
    <section className="card">
      <h2>試合運営</h2>
      <p>試合を開始したり、勝者を選択したりすることができます。</p>
      <h3>{getStatusLabel("READY")}</h3>
      {readyMatches.length === 0 && <div className="statusText">{getStatusLabel("READY")}の試合はありません。</div>}
      {readyMatches.map(renderReadyMatchRow)}
      <h3>{getStatusLabel("RUNNING")}</h3>
      {runningMatches.length === 0 && <div className="statusText">{getStatusLabel("RUNNING")}の試合はありません。</div>}
      {runningMatches.map(renderRunningMatchRow)}
    </section>
  );
}
