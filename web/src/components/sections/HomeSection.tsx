// web/src/components/sections/HomeSection.tsx
// ホームセクション
// home-page.tsxから呼び出される
"use client";

import type { Tournament } from "@/types";
import { CreateTournamentModal } from "@/components/modals/CreateTournamentModal";
import { getStatusLabel } from "@/lib/status-label";

// ホームセクションのプロパティ
type HomeProps = {
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

// ホームセクションを返す
export function HomeSection(props: HomeProps) {
  return (
    <>
      
      <section className="subgrid loginGrid centeredCards">
        <div className="card">
          <h2>大会運営者はこちら</h2>
          <input
            placeholder="管理者パスワード（adm-***）を入力してください。"
            type="password"
            value={props.adminPasscode}
            onChange={(e) => props.setAdminPasscode(e.target.value)}
          />
          <button className="homeSectionButton roleAdminButton" onClick={props.onAdminLogin}>
            管理者ページへ
          </button>
        </div>

        <div className="card">
          <h2>現在の大会一覧</h2>
          {props.activeTournaments.length > 0 ? (
            <div className="list">
              {props.activeTournaments.map((tournament) => (
                <div key={tournament.id} className="listItem">
                  <span>
                    {tournament.name}({getStatusLabel(tournament.status)}) / 開催日: {tournament.eventDate || "-"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p>現在進行中/準備中の大会はありません。</p>
          )}
          <div className="topCreateTournament">
            <div className="row topActionRow">
              <button className="homeSectionButton roleCreateButton" onClick={props.onRequestCreateTournament}>
                大会を追加する
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <h2>試合観戦する</h2>
          <input
            placeholder="観戦パスコードを入力してください。"
            type="password"
            value={props.observerLoginPasscode}
            onChange={(e) => props.setObserverLoginPasscode(e.target.value)}
          />
          <button className="homeSectionButton roleObserverButton" onClick={props.onObserverLogin}>
            観戦ページへ
          </button>
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
