import type { Match, PublicState } from "../../types";

type AdminMatchesProps = {
  state: PublicState | null;
  matches: Match[];
  playerName: (id: number | null) => string;
  onAssignCourt: (matchId: number, court: number) => void;
  onStart: (matchId: number) => void;
  onWin: (matchId: number, winnerId: number | null) => void;
};

export function AdminMatchesSection(props: AdminMatchesProps) {
  return (
    <section className="card">
      <h2>試合運営</h2>
      {props.matches.map((m) => (
        <div className="matchRow" key={m.id}>
          <span>
            R{m.round}M{m.position}: {props.playerName(m.player1Id)} vs {props.playerName(m.player2Id)}
          </span>
          <select value={m.courtNumber ?? ""} onChange={(e) => props.onAssignCourt(m.id, Number(e.target.value))}>
            <option value="">コート選択</option>
            {Array.from({ length: props.state?.courtCount ?? 1 }).map((_, idx) => (
              <option key={idx + 1} value={idx + 1}>
                コート {idx + 1}
              </option>
            ))}
          </select>
          <button onClick={() => props.onStart(m.id)}>開始</button>
          <button onClick={() => props.onWin(m.id, m.player1Id)}>勝者: {props.playerName(m.player1Id)}</button>
          <button onClick={() => props.onWin(m.id, m.player2Id)}>勝者: {props.playerName(m.player2Id)}</button>
        </div>
      ))}
    </section>
  );
}
