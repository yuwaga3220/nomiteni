"use client";

import { TournamentParticipant } from "@/types";
import { TournamentBracketView, type BracketRoundView } from "./TournamentBracketView";

type AdminTournamentEditProps = {
  bracketSize: number;
  bracketHeight: number;
  bracketRounds: BracketRoundView[];
  tournamentStatus?: "ENTRY" | "READY" | "RUNNING" | "FINISHED";
  participants: TournamentParticipant[];
  selectedParticipantId: number | null;
  setSelectedParticipantId: (id: number | null) => void;
};

// 管理者トーナメント編集セクションを返す
export function AdminTournamentEditSection(props: AdminTournamentEditProps) {
  const canChangeParticipantPosition = props.tournamentStatus === "READY";

  return (
    <section className="card">
      <h2>トーナメント編集</h2>
      <label>選手選択</label>
      <select
        value={props.selectedParticipantId ?? ""}
        onChange={(e) => props.setSelectedParticipantId(
          e.target.value ? Number(e.target.value) : null
        )}
        disabled={!canChangeParticipantPosition}
      >
        <option value="">交換する選手を選択</option>
        {props.participants.map((p) => (
          <option key={p.userId} value={p.userId}>
            {p.name}
          </option>
        )) }     
      </select>
      <select
        value={props.selectedParticipantId ?? ""}
        onChange={(e) => props.setSelectedParticipantId(
          e.target.value ? Number(e.target.value) : null
        )}
        disabled={!canChangeParticipantPosition}
      >
        <option value="">交換する選手を選択</option>
        {props.participants.map((p) => (
          <option key={p.userId} value={p.userId}>
            {p.name}
          </option>
        )) }     
      </select>
      <TournamentBracketView
        bracketRounds={props.bracketRounds}
        showRoundHeaders={false}
        showMatchDescription={false}
      />
    </section>  )
}