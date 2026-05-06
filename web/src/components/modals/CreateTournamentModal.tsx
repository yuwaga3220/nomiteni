"use client";

type CreateTournamentModalProps = {
  isOpen: boolean;
  onClose: () => void;
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
};

export function CreateTournamentModal(props: CreateTournamentModalProps) {
  if (!props.isOpen) return null;

  return (
    <div className="modalOverlay" onClick={props.onClose}>
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
          placeholder="観戦パスコード"
          value={props.createTournamentObserverPasscode}
          onChange={(e) => props.setCreateTournamentObserverPasscode(e.target.value)}
        />
        <div className="row">
          <button onClick={props.onCreateTournament}>大会を追加する</button>
          <button onClick={props.onClose}>閉じる</button>
        </div>
      </div>
    </div>
  );
}
