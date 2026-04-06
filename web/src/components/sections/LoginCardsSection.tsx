// web/src/components/sections/LoginCardsSection.tsx
// ログインカードセクション
// home-page.tsxから呼び出される
"use client";

import type { Tournament } from "@/types";

// ログインカードセクションのプロパティ
type LoginCardsProps = {
  tournamentPasscode: string;
  setTournamentPasscode: (v: string) => void;
  adminPasscode: string;
  setAdminPasscode: (v: string) => void;
  observerLoginPasscode: string;
  setObserverLoginPasscode: (v: string) => void;
  onParticipantLogin: () => void;
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
        <button className="bigCreateTournamentButton" onClick={props.onRequestCreateTournament}>
          大会を追加する
        </button>
      </div>
      // ログインカードセクション
      <section className="grid2 loginGrid">
        <div className="subgrid">
          // 参加者ログインカード
          <div className="card">
            <h2>参加者</h2>
            <input
              placeholder="大会パスコード"
              type="password"
              value={props.tournamentPasscode}
              onChange={(e) => props.setTournamentPasscode(e.target.value)}
            />
            <button onClick={props.onParticipantLogin}>確定（エントリー情報を入力する）</button>
          </div>

          // 観戦者ログインカード
          <div className="card">
            <h2>観戦者</h2>
            <input
              placeholder="観戦パスコード"
              type="password"
              value={props.observerLoginPasscode}
              onChange={(e) => props.setObserverLoginPasscode(e.target.value)}
            />
            <button onClick={props.onObserverLogin}>リアルタイム観戦する</button>
          </div>

          // 管理者ログインカード
          <div className="card">
            <h2>管理者</h2>
            <input
              placeholder="管理者パスコード"
              type="password"
              value={props.adminPasscode}
              onChange={(e) => props.setAdminPasscode(e.target.value)}
            />
            <button onClick={props.onAdminLogin}>管理画面へ</button>
          </div>
        </div>

        // 現在の大会状況カード
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

      // 大会を追加するモーダル
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
    </>
  );
}
