"use client";

import { useEffect, useState } from "react";
import type { TournamentParticipant } from "@/types";

type RegisterParticipantsSectionProps = {
  isReady: boolean;
  participants: TournamentParticipant[];
  onCreateParticipant: (name: string) => void;
  onUpdateParticipant: (id: number, name: string) => void;
  onDeleteParticipant: (id: number) => void;
};

export function RegisterParticipantsSection(props: RegisterParticipantsSectionProps) {
  const [newParticipantName, setNewParticipantName] = useState("");
  const [participantNames, setParticipantNames] = useState<Record<number, string>>({});

  useEffect(() => {
    setParticipantNames(Object.fromEntries(props.participants.map((participant) => [participant.id, participant.name])));
  }, [props.participants]);

  return (
    <div className="card">
      <h2>参加者登録</h2>
      <div className="row">
        <input
          placeholder="参加者名"
          value={newParticipantName}
          onChange={(e) => setNewParticipantName(e.target.value)}
          disabled={!props.isReady}
        />
        <button
          onClick={() => {
            props.onCreateParticipant(newParticipantName);
            setNewParticipantName("");
          }}
          disabled={!props.isReady || !newParticipantName.trim()}
        >
          登録
        </button>
      </div>
      <div className="list">
        {props.participants.map((participant) => (
          <div key={participant.id} className="listItem">
            <input
              value={participantNames[participant.id] ?? participant.name}
              onChange={(e) =>
                setParticipantNames((current) => ({
                  ...current,
                  [participant.id]: e.target.value,
                }))
              }
              disabled={!props.isReady}
            />
            <button
              onClick={() =>
                props.onUpdateParticipant(participant.id, participantNames[participant.id] ?? participant.name)
              }
              disabled={!props.isReady || !(participantNames[participant.id] ?? participant.name).trim()}
            >
              更新
            </button>
            <button
              className="roleDeleteButton"
              onClick={() => props.onDeleteParticipant(participant.id)}
              disabled={!props.isReady}
            >
              削除
            </button>
          </div>
        ))}
        {props.participants.length === 0 && <div className="statusText">参加者はまだ登録されていません</div>}
      </div>
    </div>
  );
}
