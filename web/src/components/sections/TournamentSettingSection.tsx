// web/src/components/sections/TournamentSettingSection.tsx
// 大会設定セクション
"use client";

import type { PublicState, Tournament, TournamentParticipant } from "@/types";
import { RegisterParticipantsSection } from "./RegisterParticipantsSection";

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
  onCreateParticipant: (name: string) => void;
  onUpdateParticipant: (id: number, name: string) => void;
  onDeleteParticipant: (id: number) => void;
};

// 大会設定セクション
export function TournamentSettingSection(props: TournamentSettingProps) {
  const isReady = (props.active?.status ?? "").toUpperCase() === "READY";

  // 管理者メニューセクションを返す
  return (
    <section className="grid2">
      <div className="card">
        <h2>大会設定</h2>
        <p>大会の設定を変更することができます。</p>
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
        <button className="saveTournamentSettingsButton" onClick={props.onSaveTournamentSettings}>
          大会設定を保存
        </button>
        
      </div>
      <RegisterParticipantsSection
        isReady={isReady}
        participants={props.participants}
        onCreateParticipant={props.onCreateParticipant}
        onUpdateParticipant={props.onUpdateParticipant}
        onDeleteParticipant={props.onDeleteParticipant}
      />
    </section>
  );
}
