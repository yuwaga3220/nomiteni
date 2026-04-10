// web/src/context/NomiteniContext.tsx
// コンテキスト
"use client";

import { createContext, useContext, type Dispatch, type SetStateAction } from "react";
import type { AuthMode, CheckinState, Match, Me, PublicState, TournamentBrief, User } from "@/types";

export type NomiteniContextValue = {
  me: Me | null;
  setMe: Dispatch<SetStateAction<Me | null>>;
  state: PublicState | null;
  message: string;
  setMessage: Dispatch<SetStateAction<string>>;
  forceLoginCardsView: boolean;
  setForceLoginCardsView: Dispatch<SetStateAction<boolean>>;
  authModalState: AuthMode;
  setAuthModalState: Dispatch<SetStateAction<AuthMode>>;
  authEmail: string;
  setAuthEmail: Dispatch<SetStateAction<string>>;
  authPassword: string;
  setAuthPassword: Dispatch<SetStateAction<string>>;
  entryPasscode: string;
  setEntryPasscode: Dispatch<SetStateAction<string>>;
  entryTournament: TournamentBrief | null;
  setEntryTournament: Dispatch<SetStateAction<TournamentBrief | null>>;
  entryName: string;
  setEntryName: Dispatch<SetStateAction<string>>;
  entryParty: boolean;
  setEntryParty: Dispatch<SetStateAction<boolean>>;
  entryNote: string;
  setEntryNote: Dispatch<SetStateAction<string>>;
  adminPasscode: string;
  setAdminPasscode: Dispatch<SetStateAction<string>>;
  observerLoginPasscode: string;
  setObserverLoginPasscode: Dispatch<SetStateAction<string>>;
  createModalOpen: boolean;
  setCreateModalOpen: Dispatch<SetStateAction<boolean>>;
  createTournamentName: string;
  setCreateTournamentName: Dispatch<SetStateAction<string>>;
  createTournamentDate: string;
  setCreateTournamentDate: Dispatch<SetStateAction<string>>;
  createTournamentTimeSlot: string;
  setCreateTournamentTimeSlot: Dispatch<SetStateAction<string>>;
  createTournamentCourtCount: number;
  setCreateTournamentCourtCount: Dispatch<SetStateAction<number>>;
  createTournamentEntryPasscode: string;
  setCreateTournamentEntryPasscode: Dispatch<SetStateAction<string>>;
  createTournamentObserverPasscode: string;
  setCreateTournamentObserverPasscode: Dispatch<SetStateAction<string>>;
  observerSetPasscode: string;
  setObserverSetPasscode: Dispatch<SetStateAction<string>>;
  entrySetPasscode: string;
  setEntrySetPasscode: Dispatch<SetStateAction<string>>;
  tournamentName: string;
  setTournamentName: Dispatch<SetStateAction<string>>;
  tournamentDate: string;
  setTournamentDate: Dispatch<SetStateAction<string>>;
  tournamentTimeSlot: string;
  setTournamentTimeSlot: Dispatch<SetStateAction<string>>;
  courtCountInput: number;
  setCourtCountInput: Dispatch<SetStateAction<number>>;
  isLoginReady: boolean;
  isHeaderLoggedIn: boolean;
  active: PublicState["activeTournament"];
  assignableMatches: Match[];
  refresh: () => Promise<void>;
  playerName: (id: number | null) => string;
  matchStatusLabel: (status: Match["status"]) => string;
  checkinState: (u: User) => CheckinState;
  call: (fn: () => Promise<unknown>) => Promise<void>;
  ensureLoginCredentials: () => void;
  groupedRounds: Array<[number, Match[]]>;
  onHeaderLogout: () => void;
};

// コンテキストを作成
const NomiteniContext = createContext<NomiteniContextValue | null>(null);

// コンテキストを取得
export function useNomiteni() {
  const v = useContext(NomiteniContext);
  if (!v) throw new Error("useNomiteni must be used within NomiteniProvider");
  return v;
}

// コンテキストをエクスポート
export { NomiteniContext };
