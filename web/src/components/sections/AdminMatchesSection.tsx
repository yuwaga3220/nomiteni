// web/src/components/sections/AdminMatchesSection.tsx
// 管理者試合運営セクション
"use client";

import type { Match, PublicState } from "@/types";

// 試合運営セクションのプロパティ
type AdminMatchesProps = {
  state: PublicState | null;
  matches: Match[];
  playerName: (id: number | null) => string; // IDからプレイヤー名を取得
  onAssignCourt: (matchId: number, court: number) => void; // 試合をコートに割り当てる処理
  onStart: (matchId: number) => void; // 試合を開始する処理
  onWin: (matchId: number, winnerId: number | null) => void; // 試合を勝者にする処理
};

// 試合運営セクションを返す
export function AdminMatchesSection(props: AdminMatchesProps) {
  return (
    <section className="card">
      <h2>試合運営</h2>
      {props.matches.map((m) => (
        <div className="matchRow" key={m.id}>
          // 試合情報
          <span>
            R{m.round}M{m.position}: {props.playerName(m.player1Id)} vs {props.playerName(m.player2Id)}
          </span>
          // コート選択UI
          // コート番号を表示しつつ、変化すると割り当て関数が発火
          <select value={m.courtNumber ?? ""} onChange={(e) => props.onAssignCourt(m.id, Number(e.target.value))}>
            <option value="">コート選択</option>
            {Array.from({ length: props.state?.courtCount ?? 1 }).map((_, idx) => ( // コート数分の長さの配列を長さ
              <option key={idx + 1} value={idx + 1}>
                コート {idx + 1}
              </option>
            ))}
          </select>
          // 各種ボタン
          <button onClick={() => props.onStart(m.id)}>開始</button>
          <button onClick={() => props.onWin(m.id, m.player1Id)}>勝者: {props.playerName(m.player1Id)}</button>
          <button onClick={() => props.onWin(m.id, m.player2Id)}>勝者: {props.playerName(m.player2Id)}</button>
        </div>
      ))}
    </section>
  );
}
