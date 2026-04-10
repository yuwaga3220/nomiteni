// web/src/components/sections/UserMenuSection.tsx
// ユーザーメニューセクション

"use client";

import { useState } from "react";
import type { Me, TournamentBrief } from "@/types";
import { useRouter } from "next/navigation";

// ユーザーメニューセクションのプロパティ
type UserMenuProps = {
  me: Me;
  entryTournament: TournamentBrief | null;
  entryName: string;
  setEntryName: (v: string) => void;
  entryParty: boolean;
  setEntryParty: (v: boolean) => void;
  entryNote: string;
  setEntryNote: (v: string) => void;
  onEntrySubmit: () => void;
  onCheckinJoin: () => void;
  onCheckinAbsent: () => void;
  onLogout: () => void;
};

// ユーザーメニューセクション
export function UserMenuSection(props: UserMenuProps) {
  const router = useRouter();
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  return (
    <section className="card">
      <h2>{props.me.role === "ADMIN" ? "管理者メニュー" : props.me.role === "PARTICIPANT" ? "参加者メニュー" : "観戦者メニュー"}</h2>
      <p>
        ログイン中: {props.me.name} ({props.me.email})
      </p>

      {props.me.role === "PARTICIPANT" && ( // 参加者の場合
        <div className="subgrid">
          <h3>大会エントリー</h3>
          {props.entryTournament ? (
            <p>
              対象大会: {props.entryTournament.name} ({props.entryTournament.status})
            </p>
          ) : (
            <p>対象大会情報を読み込めませんでした。ログアウトして再度エントリーしてください。</p>
          )}
          <button onClick={() => setEntryModalOpen(true)}>エントリー入力を開く</button>
          <h3>当日チェックイン</h3>
          <button onClick={props.onCheckinJoin}>参加する</button>
          <button onClick={props.onCheckinAbsent}>欠席する</button>
        </div>
      )}
      {/* 参加者の場合、エントリー入力モーダルを表示 */}
      {props.me.role === "PARTICIPANT" && entryModalOpen && (
        <div className="modalOverlay" onClick={() => setEntryModalOpen(false)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <h3>大会エントリー</h3>
            <input placeholder="選手名" value={props.entryName} onChange={(e) => props.setEntryName(e.target.value)} />
            <label>
              <input type="checkbox" checked={props.entryParty} onChange={(e) => props.setEntryParty(e.target.checked)} />
              飲み会に参加する
            </label>
            <textarea placeholder="意気込み" value={props.entryNote} onChange={(e) => props.setEntryNote(e.target.value)} />
            <div className="row">
              <button
                onClick={() => {
                  props.onEntrySubmit();
                  setEntryModalOpen(false);
                }}
              >
                エントリーする
              </button>
              <button onClick={() => setEntryModalOpen(false)}>閉じる</button>
            </div>
          </div>
        </div>
      )}
      <br />
      <button onClick={() => router.push("/")}>戻る</button>
    </section>
  );
}
