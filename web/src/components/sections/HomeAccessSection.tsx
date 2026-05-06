// web/src/components/sections/HomeAccessSection.tsx
// ホームアクセスセクション
// home-page.tsxから呼び出される
"use client";

import type { Tournament } from "@/types";
import { CreateTournamentModal } from "@/components/modals/CreateTournamentModal";

// ホームアクセスセクションのプロパティ
type HomeAccessProps = {
  adminPasscode: string;
  setAdminPasscode: (v: string) => void;
  observerLoginPasscode: string;
  setObserverLoginPasscode: (v: string) => void;
  onAdminLogin: () => void;
  onObserverLogin: () => void;
  onRequestCreateTournament: () => void;
  createModalOpen: boolean;
  setCreateModalOpen: (v: boolean) => void;
  createTournamentName: string;
  setCreateTournamentName: (v: string) => void;
  createTournamentDate: string;
  setCreateTournamentDate: (v: string) => void;
  createTournamentTimeSlot: string;
  setCreateTournamentTimeSlot: (v: string) => void;
  createTournamentCourtCount: number;
  setCreateTournamentCourtCount: (v: number) => void;
  createTournamentObserverPasscode: string;
  setCreateTournamentObserverPasscode: (v: string) => void;
  onCreateTournament: () => void;
  activeTournaments: Tournament[];
};

// ホームアクセスセクションを返す
export function HomeAccessSection(props: HomeAccessProps) {
  return (
    <>
      <div className="topCreateTournament">
        <div className="row topActionRow">
          <button className="bigCreateTournamentButton" onClick={props.onRequestCreateTournament}>
            大会を追加する
          </button>
        </div>
      </div>
      <section className="grid2 loginGrid">
        <div className="subgrid">
          <div className="card">
            <h2>リアルタイムで試合観戦する</h2>
            <input
              placeholder="観戦パスコード"
              type="password"
              value={props.observerLoginPasscode}
              onChange={(e) => props.setObserverLoginPasscode(e.target.value)}
            />
            <button onClick={props.onObserverLogin}>リアルタイム観戦する</button>
          </div>

          <div className="card">
            <h2>大会運営者はこちら</h2>
            <input
              placeholder="運営パスコード"
              type="password"
              value={props.adminPasscode}
              onChange={(e) => props.setAdminPasscode(e.target.value)}
            />
            <button onClick={props.onAdminLogin}>管理画面へ</button>
          </div>
        </div>

        <div className="card">
          <h2>現在の大会状況</h2>
          {props.activeTournaments.length > 0 ? (
            <div className="list">
              {props.activeTournaments.map((tournament) => (
                <div key={tournament.id} className="listItem">
                  <span>
                    {tournament.name}({tournament.status}) / 開催日: {tournament.eventDate || "-"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p>現在進行中/準備中の大会はありません。</p>
          )}
        </div>
      </section>

      <CreateTournamentModal
        isOpen={props.createModalOpen}
        onClose={() => props.setCreateModalOpen(false)}
        createTournamentName={props.createTournamentName}
        setCreateTournamentName={props.setCreateTournamentName}
        createTournamentDate={props.createTournamentDate}
        setCreateTournamentDate={props.setCreateTournamentDate}
        createTournamentTimeSlot={props.createTournamentTimeSlot}
        setCreateTournamentTimeSlot={props.setCreateTournamentTimeSlot}
        createTournamentCourtCount={props.createTournamentCourtCount}
        setCreateTournamentCourtCount={props.setCreateTournamentCourtCount}
        createTournamentObserverPasscode={props.createTournamentObserverPasscode}
        setCreateTournamentObserverPasscode={props.setCreateTournamentObserverPasscode}
        onCreateTournament={props.onCreateTournament}
      />
    </>
  );
}
