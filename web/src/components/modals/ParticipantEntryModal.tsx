"use client";

type ParticipantEntryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  tournamentPasscode: string;
  setTournamentPasscode: (v: string) => void;
  entryName: string;
  setEntryName: (v: string) => void;
  entryParty: boolean;
  setEntryParty: (v: boolean) => void;
  entryNote: string;
  setEntryNote: (v: string) => void;
  onEntrySubmit: () => Promise<void>;
};

export function ParticipantEntryModal(props: ParticipantEntryModalProps) {
  if (!props.isOpen) return null;

  return (
    <div className="modalOverlay" onClick={props.onClose}>
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
          <button
            onClick={async () => {
              await props.onEntrySubmit();
            }}
          >
            エントリーする
          </button>
          <button onClick={props.onClose}>閉じる</button>
        </div>
      </div>
    </div>
  );
}
