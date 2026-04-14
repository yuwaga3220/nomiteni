"use client";

type ParticipantTournament = {
  id: number;
  name: string;
  status: string;
  eventDate?: string | null;
};

type ParticipantSelectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  participantTournaments: ParticipantTournament[];
  onSelectParticipantTournament: (tournamentId: number) => void;
};

export function ParticipantSelectModal(props: ParticipantSelectModalProps) {
  if (!props.isOpen) return null;

  return (
    <div className="modalOverlay" onClick={props.onClose}>
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
          <button onClick={props.onClose}>閉じる</button>
        </div>
      </div>
    </div>
  );
}
