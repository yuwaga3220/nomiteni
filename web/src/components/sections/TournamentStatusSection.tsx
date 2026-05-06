"use client";

import type { Tournament } from "@/types";
import { getStatusLabel } from "@/lib/status-label";

type TournamentStatus = "READY" | "RUNNING" | "FINISHED";

type TournamentStatusSectionProps = {
  active: Tournament | null | undefined;
  onSetTournamentStatus: (status: TournamentStatus) => void;
};

export function TournamentStatusSection(props: TournamentStatusSectionProps) {
  const isReady = (props.active?.status ?? "").toUpperCase() === "READY";
  const isRunning = (props.active?.status ?? "").toUpperCase() === "RUNNING";
  const isFinished = (props.active?.status ?? "").toUpperCase() === "FINISHED";

  return (
    <section className="card">
      <h2>大会状態</h2>
      <p>大会の状態を変更することができます。</p>
      {props.active ? (
        <div className="message">
          <strong>現在の状態: {getStatusLabel(props.active.status)}</strong>
        </div>
      ) : (
        <div className="statusText">大会が未作成です。</div>
      )}
      <div className="row">
        {isFinished && (
          <button onClick={() => props.onSetTournamentStatus("READY")}>
            大会を準備中にする
          </button>
        )}
        {isReady && (
          <button onClick={() => props.onSetTournamentStatus("RUNNING")}>
            大会を開始する
          </button>
        )}
        {isRunning && (
          <button onClick={() => props.onSetTournamentStatus("FINISHED")}>
            大会を終了する
          </button>
        )}
      </div>
    </section>
  );
}
