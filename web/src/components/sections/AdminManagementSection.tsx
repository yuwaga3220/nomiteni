// web/src/components/sections/AdminManagementSection.tsx
// 管理者メニューセクション
"use client";

import type { PublicState, Tournament } from "@/types";

type TournamentStatus = "ENTRY" | "READY" | "RUNNING" | "FINISHED";

// 管理者メニューセクションのプロパティ
type AdminManagementProps = {
  active: Tournament | null | undefined;
  state: PublicState | null;
  tournamentName: string;
  setTournamentName: (v: string) => void;
  tournamentDate: string;
  setTournamentDate: (v: string) => void;
  tournamentTimeSlot: string;
  setTournamentTimeSlot: (v: string) => void;
  courtCountInput: number;
  setCourtCountInput: (v: number) => void;
  observerSetPasscode: string;
  setObserverSetPasscode: (v: string) => void;
  onSaveTournamentSettings: () => void;
  onSetTournamentStatus: (status: TournamentStatus) => void;
};

// 管理者メニューセクション
export function AdminManagementSection(props: AdminManagementProps) {
  const isEntry = (props.active?.status ?? "").toUpperCase() === "ENTRY";
  const isReady = (props.active?.status ?? "").toUpperCase() === "READY";
  const isRunning = (props.active?.status ?? "").toUpperCase() === "RUNNING";
  const isFinished = (props.active?.status ?? "").toUpperCase() === "FINISHED";

  // 管理者メニューセクションを返す
  return (
    <section className="grid2">
      <div className="card">
        <h2>大会管理</h2>
        {props.active && (
          <div className="message">
            <strong>現在の大会</strong>: {props.active.name} (ID: {props.active.id}) / 状態: {props.active.status}
          </div>
        )}
        <div className="row">
          <label>大会状態</label>
          <button
            onClick={() => props.onSetTournamentStatus("ENTRY")}
            disabled={!(isReady)}
          >
            ENTRY
          </button>
          <button
            onClick={() => props.onSetTournamentStatus("READY")}
            disabled={!(isEntry || isFinished)}
          >
            READY
          </button>
          <button
            onClick={() => props.onSetTournamentStatus("RUNNING")}
            disabled={!(isReady)}
          >
            RUNNING
          </button>
          <button
            onClick={() => props.onSetTournamentStatus("FINISHED")}
            disabled={!isRunning}
          >
            FINISHED
          </button>
        </div>
        <label>大会名</label>
        <input value={props.tournamentName} onChange={(e) => props.setTournamentName(e.target.value)} />
        <label>開催日</label>
        <input type="date" value={props.tournamentDate} onChange={(e) => props.setTournamentDate(e.target.value)} />
        <label>時間帯</label>
        <input
          placeholder="例: 09:00-17:00"
          value={props.tournamentTimeSlot}
          onChange={(e) => props.setTournamentTimeSlot(e.target.value)}
        />
        <label>コート数</label>
        <input type="number" min={1} value={props.courtCountInput} onChange={(e) => props.setCourtCountInput(Number(e.target.value))} />
        <label>観戦用パスコード</label>
        <input
          type="password"
          placeholder="観戦用パスコード"
          value={props.observerSetPasscode}
          onChange={(e) => props.setObserverSetPasscode(e.target.value)}
        />
        <button onClick={props.onSaveTournamentSettings}>大会設定を保存</button>
        
      </div>
    </section>
  );
}
