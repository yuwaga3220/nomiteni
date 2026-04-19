// web/src/components/sections/HomeAccessSection.tsx
// ホームアクセスセクション
// home-page.tsxから呼び出される
"use client";

import type { Tournament } from "@/types";
import { ParticipantEntryModal } from "@/components/modals/ParticipantEntryModal";
import { CreateTournamentModal } from "@/components/modals/CreateTournamentModal";
import { ParticipantSelectModal } from "@/components/modals/ParticipantSelectModal";

// ホームアクセスセクションのプロパティ
type HomeAccessProps = {
  tournamentPasscode: string;
  setTournamentPasscode: (v: string) => void;
  entryName: string;
  setEntryName: (v: string) => void;
  entryParty: boolean;
  setEntryParty: (v: boolean) => void;
  entryNote: string;
  setEntryNote: (v: string) => void;
  adminPasscode: string;
  setAdminPasscode: (v: string) => void;
  observerLoginPasscode: string;
  setObserverLoginPasscode: (v: string) => void;
  onParticipantOpen: () => void;
  participantSelectModalOpen: boolean;
  setParticipantSelectModalOpen: (v: boolean) => void;
  participantTournaments: Array<{ id: number; name: string; status: string; eventDate?: string | null }>;
  onSelectParticipantTournament: (tournamentId: number) => void;
  onAdminLogin: () => void;
  onObserverLogin: () => void;
  onRequestCreateTournament: () => void;
  onRequestEntryTournament: () => void;
  entryModalOpen: boolean;
  setEntryModalOpen: (v: boolean) => void;
  onEntryTournament: () => Promise<void>;
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
  createTournamentEntryPasscode: string;
  setCreateTournamentEntryPasscode: (v: string) => void;
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
          <button className="bigCreateTournamentButton" onClick={props.onRequestEntryTournament}>
            大会にエントリーする
          </button>
        </div>
      </div>
      <section className="grid2 loginGrid">
        <div className="subgrid">
          <div className="card">
            <h2>エントリー済みの方はこちら</h2>
            <button onClick={props.onParticipantOpen}>大会用ページへ移動する</button>
          </div>

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
        createTournamentEntryPasscode={props.createTournamentEntryPasscode}
        setCreateTournamentEntryPasscode={props.setCreateTournamentEntryPasscode}
        createTournamentObserverPasscode={props.createTournamentObserverPasscode}
        setCreateTournamentObserverPasscode={props.setCreateTournamentObserverPasscode}
        onCreateTournament={props.onCreateTournament}
      />
      <ParticipantEntryModal
        isOpen={props.entryModalOpen}
        onClose={() => props.setEntryModalOpen(false)}
        tournamentPasscode={props.tournamentPasscode}
        setTournamentPasscode={props.setTournamentPasscode}
        entryName={props.entryName}
        setEntryName={props.setEntryName}
        entryParty={props.entryParty}
        setEntryParty={props.setEntryParty}
        entryNote={props.entryNote}
        setEntryNote={props.setEntryNote}
        onEntrySubmit={props.onEntryTournament}
      />
      <ParticipantSelectModal
        isOpen={props.participantSelectModalOpen}
        onClose={() => props.setParticipantSelectModalOpen(false)}
        participantTournaments={props.participantTournaments}
        onSelectParticipantTournament={props.onSelectParticipantTournament}
      />
    </>
  );
}
