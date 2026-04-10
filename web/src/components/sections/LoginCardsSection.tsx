// web/src/components/sections/LoginCardsSection.tsx
// ログインカードセクション
// home-page.tsxから呼び出される
"use client";

import type { Tournament } from "@/types";

// ログインカードセクションのプロパティ
type LoginCardsProps = {
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
  onEntryTournament: () => void;
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
  activeTournament: Tournament | null | undefined;
};

// ログインカードセクションを返す
export function LoginCardsSection(props: LoginCardsProps) {
  // 大会を追加するボタン
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
          {props.activeTournament ? (
            <>
              <p>{props.activeTournament.name}({props.activeTournament.status}) / 開催日: {props.activeTournament.eventDate || "-"}</p>
            </>
          ) : (
            <p>現在進行中/準備中の大会はありません。</p>
          )}
        </div>
      </section>

      {props.createModalOpen && (
        <div className="modalOverlay" onClick={() => props.setCreateModalOpen(false)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <h2>大会を追加</h2>
            <input placeholder="大会名" value={props.createTournamentName} onChange={(e) => props.setCreateTournamentName(e.target.value)} />
            <input type="date" value={props.createTournamentDate} onChange={(e) => props.setCreateTournamentDate(e.target.value)} />
            <input
              placeholder="時間帯（例: 09:00-17:00）"
              value={props.createTournamentTimeSlot}
              onChange={(e) => props.setCreateTournamentTimeSlot(e.target.value)}
            />
            <input
              type="number"
              min={1}
              placeholder="コート数"
              value={props.createTournamentCourtCount}
              onChange={(e) => props.setCreateTournamentCourtCount(Number(e.target.value))}
            />
            <input
              type="password"
              placeholder="大会パスコード"
              value={props.createTournamentEntryPasscode}
              onChange={(e) => props.setCreateTournamentEntryPasscode(e.target.value)}
            />
            <input
              type="password"
              placeholder="観戦パスコード"
              value={props.createTournamentObserverPasscode}
              onChange={(e) => props.setCreateTournamentObserverPasscode(e.target.value)}
            />
            <div className="row">
              <button onClick={props.onCreateTournament}>大会を追加する</button>
              <button onClick={() => props.setCreateModalOpen(false)}>閉じる</button>
            </div>
          </div>
        </div>
      )}
      {props.entryModalOpen && (
        <div className="modalOverlay" onClick={() => props.setEntryModalOpen(false)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <h2>大会にエントリー</h2>
            <input
              placeholder="大会パスコード"
              type="password"
              value={props.tournamentPasscode}
              onChange={(e) => props.setTournamentPasscode(e.target.value)}
            />
            <input placeholder="選手名" value={props.entryName} onChange={(e) => props.setEntryName(e.target.value)} />
            <label>
              <input type="checkbox" checked={props.entryParty} onChange={(e) => props.setEntryParty(e.target.checked)} />
              飲み会に参加する
            </label>
            <textarea placeholder="意気込み" value={props.entryNote} onChange={(e) => props.setEntryNote(e.target.value)} />
            <div className="row">
              <button onClick={props.onEntryTournament}>エントリーする</button>
              <button onClick={() => props.setEntryModalOpen(false)}>閉じる</button>
            </div>
          </div>
        </div>
      )}
      {props.participantSelectModalOpen && (
        <div className="modalOverlay" onClick={() => props.setParticipantSelectModalOpen(false)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <h2>参加する大会を選択</h2>
            {props.participantTournaments.length > 0 ? (
              <div className="subgrid">
                {props.participantTournaments.map((t) => (
                  <button key={t.id} onClick={() => props.onSelectParticipantTournament(t.id)}>
                    {t.name} ({t.status}) / 開催日: {t.eventDate || "-"}
                  </button>
                ))}
              </div>
            ) : (
              <p>参加者として紐づく大会がありません。</p>
            )}
            <div className="row">
              <button onClick={() => props.setParticipantSelectModalOpen(false)}>閉じる</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
