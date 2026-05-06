"use client";

import { TournamentParticipant } from "@/types";
import { TournamentBracketView, type BracketRoundView } from "./TournamentBracketView";

type EditDrawProps = {
  bracketSize: number;
  bracketHeight: number;
  bracketRounds: BracketRoundView[];
  tournamentStatus?: "READY" | "RUNNING" | "FINISHED";
  participants: TournamentParticipant[];
  onSwapParticipants: (id1: number | null, id2: number | null) => void;
  selectedParticipantId1: number | null;
  setSelectedParticipantId1: (id: number | null) => void;
  selectedParticipantId2: number | null;
  setSelectedParticipantId2: (id: number | null) => void;
};

// 管理者トーナメント編集セクションを返す
export function EditDrawSection(props: EditDrawProps) {
  const canChangeParticipantPosition = props.tournamentStatus === "READY";
  const canSwapParticipants = canChangeParticipantPosition
    && props.selectedParticipantId1 !== null
    && props.selectedParticipantId2 !== null
    && props.selectedParticipantId1 !== props.selectedParticipantId2;
  return (
    <section className="card">
      <h2>トーナメント編集</h2>
      <p>開始前の大会のドローを変更することができます。</p>
      <select
        value={props.selectedParticipantId1 ?? ""}
        onChange={(e) => props.setSelectedParticipantId1(
          e.target.value ? Number(e.target.value) : null
        )}
        disabled={!canChangeParticipantPosition}
      >
        <option value="">交換元の選手を選択</option>
        {props.participants.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        )) }
      </select>
      <select
        value={props.selectedParticipantId2 ?? ""}
        onChange={(e) => props.setSelectedParticipantId2(
          e.target.value ? Number(e.target.value) : null
        )}
        disabled={!canChangeParticipantPosition}
      >
        <option value="">交換先の選手を選択</option>
        {props.participants.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        )) }
      </select>
      <button onClick={() => props.onSwapParticipants(
        props.selectedParticipantId1,
        props.selectedParticipantId2
      )} disabled={!canSwapParticipants}>交換する</button>
      <TournamentBracketView
        bracketRounds={props.bracketRounds}
        showRoundHeaders={false}
        showMatchDescription={false}
      />
    </section>  )
}
