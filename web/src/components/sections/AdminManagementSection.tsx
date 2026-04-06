// web/src/components/sections/AdminManagementSection.tsx
// 管理者メニューセクション
"use client";

import type { CheckinState, PublicState, Tournament, User } from "@/types";

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
  entrySetPasscode: string;
  setEntrySetPasscode: (v: string) => void;
  checkinState: (u: User) => CheckinState;
  onSaveTournamentSettings: () => void;
  onSetReady: (userId: number) => void;
  onSetAbsent: (userId: number) => void;
  onSetUnanswered: (userId: number) => void;
};

// 管理者メニューセクション
export function AdminManagementSection(props: AdminManagementProps) {
  // 管理者メニューセクションを返す
  return (
    <section className="grid2">
      <div className="card">
        <h2>大会管理</h2>
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
        <label>エントリー用パスコード</label>
        <input
          type="password"
          placeholder="エントリー用パスコード"
          value={props.entrySetPasscode}
          onChange={(e) => props.setEntrySetPasscode(e.target.value)}
        />
        <label>観戦用パスコード</label>
        <input
          type="password"
          placeholder="観戦用パスコード"
          value={props.observerSetPasscode}
          onChange={(e) => props.setObserverSetPasscode(e.target.value)}
        />
        <button onClick={props.onSaveTournamentSettings}>大会設定を保存</button>
        {props.active && (
          <div className="message">
            <strong>現在の大会</strong>: {props.active.name} (ID: {props.active.id})
          </div>
        )}
      </div>

      <div className="card">
        <h2>参加者チェックイン（管理者操作）</h2>
        <div className="list">
          {(props.state?.users ?? []).map((u) => (
            <div key={u.id} className="listItem">
              <span>{u.name}</span>
              <button className={props.checkinState(u) === "READY" ? "activeStateButton" : "inactiveStateButton"} onClick={() => props.onSetReady(u.id)}>
                チェックイン済
              </button>
              <button className={props.checkinState(u) === "ABSENT" ? "activeStateButton" : "inactiveStateButton"} onClick={() => props.onSetAbsent(u.id)}>
                不参加（def）
              </button>
              <button
                className={props.checkinState(u) === "UNANSWERED" ? "activeStateButton" : "inactiveStateButton"}
                onClick={() => props.onSetUnanswered(u.id)}
              >
                未回答
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
