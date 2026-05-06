// web/src/components/sections/TournamentSettingSection.tsx
// 大会設定セクション
"use client";

import { useEffect, useState } from "react";
import type { PublicState, Tournament, TournamentParticipant } from "@/types";

type TournamentStatus = "READY" | "RUNNING" | "FINISHED";

// 管理者メニューセクションのプロパティ
type TournamentSettingProps = {
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
  participants: TournamentParticipant[];
  onSaveTournamentSettings: () => void;
  onSetTournamentStatus: (status: TournamentStatus) => void;
  onCreateParticipant: (name: string) => void;
  onUpdateParticipant: (id: number, name: string) => void;
  onDeleteParticipant: (id: number) => void;
};

// 大会設定セクション
export function TournamentSettingSection(props: TournamentSettingProps) {
  const [newParticipantName, setNewParticipantName] = useState("");
  const [participantNames, setParticipantNames] = useState<Record<number, string>>({});
  const isReady = (props.active?.status ?? "").toUpperCase() === "READY";
  const isRunning = (props.active?.status ?? "").toUpperCase() === "RUNNING";
  const isFinished = (props.active?.status ?? "").toUpperCase() === "FINISHED";

  useEffect(() => {
    setParticipantNames(Object.fromEntries(props.participants.map((participant) => [participant.id, participant.name])));
  }, [props.participants]);

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
            onClick={() => props.onSetTournamentStatus("READY")}
            disabled={!isFinished}
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
      <div className="card">
        <h2>参加者登録</h2>
        <div className="row">
          <input
            placeholder="参加者名"
            value={newParticipantName}
            onChange={(e) => setNewParticipantName(e.target.value)}
            disabled={!isReady}
          />
          <button
            onClick={() => {
              props.onCreateParticipant(newParticipantName);
              setNewParticipantName("");
            }}
            disabled={!isReady || !newParticipantName.trim()}
          >
            登録
          </button>
        </div>
        <div className="list">
          {props.participants.map((participant) => (
            <div key={participant.id} className="listItem">
              <input
                value={participantNames[participant.id] ?? participant.name}
                onChange={(e) =>
                  setParticipantNames((current) => ({
                    ...current,
                    [participant.id]: e.target.value,
                  }))
                }
                disabled={!isReady}
              />
              <button
                onClick={() => props.onUpdateParticipant(participant.id, participantNames[participant.id] ?? participant.name)}
                disabled={!isReady || !(participantNames[participant.id] ?? participant.name).trim()}
              >
                更新
              </button>
              <button onClick={() => props.onDeleteParticipant(participant.id)} disabled={!isReady}>
                削除
              </button>
            </div>
          ))}
          {props.participants.length === 0 && <div className="statusText">参加者はまだ登録されていません</div>}
        </div>
      </div>
    </section>
  );
}
