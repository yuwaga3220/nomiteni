"use client";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { AuthMode, Me, TournamentBrief } from "@/types";
import { useHomeAuthActions } from "./homeActions/useHomeAuthActions";
import { useHomeEntryActions } from "./homeActions/useHomeEntryActions";
import { useHomeRoleActions } from "./homeActions/useHomeRoleActions";
import { useHomeTournamentCreationActions } from "./homeActions/useHomeTournamentCreationActions";

type UseHomeActionsParams = {
  router: AppRouterInstance;
  setMe: (me: Me | null) => void;
  setAuthModalState: (mode: AuthMode) => void;
  isLoginReady: boolean;
  setMessage: (message: string) => void;
  setEntryTournament: (tournament: TournamentBrief | null) => void;
  setForceLoginCardsView: (value: boolean) => void;
  call: (fn: () => Promise<unknown>) => Promise<void>;
  ensureLoginCredentials: () => void;
  refresh: () => Promise<void>;
  entryPasscode: string;
  setEntryPasscode: (v: string) => void;
  entryName: string;
  entryParty: boolean;
  entryNote: string;
  observerLoginPasscode: string;
  adminPasscode: string;
  createTournamentName: string;
  createTournamentDate: string;
  createTournamentTimeSlot: string;
  createTournamentCourtCount: number;
  createTournamentEntryPasscode: string;
  createTournamentObserverPasscode: string;
  authEmail: string;
  authPassword: string;
};

export function useHomeActions(params: UseHomeActionsParams) {
  const authActions = useHomeAuthActions({
    call: params.call,
    setMessage: params.setMessage,
    setAuthModalState: params.setAuthModalState,
    authEmail: params.authEmail,
    authPassword: params.authPassword,
  });

  const entryActions = useHomeEntryActions({
    router: params.router,
    setAuthModalState: params.setAuthModalState,
    isLoginReady: params.isLoginReady,
    setMessage: params.setMessage,
    setEntryTournament: params.setEntryTournament,
    setForceLoginCardsView: params.setForceLoginCardsView,
    ensureLoginCredentials: params.ensureLoginCredentials,
    refresh: params.refresh,
    entryPasscode: params.entryPasscode,
    setEntryPasscode: params.setEntryPasscode,
    entryName: params.entryName,
    entryParty: params.entryParty,
    entryNote: params.entryNote,
  });

  const roleActions = useHomeRoleActions({
    router: params.router,
    setMe: params.setMe,
    setAuthModalState: params.setAuthModalState,
    isLoginReady: params.isLoginReady,
    setMessage: params.setMessage,
    setForceLoginCardsView: params.setForceLoginCardsView,
    call: params.call,
    ensureLoginCredentials: params.ensureLoginCredentials,
    observerLoginPasscode: params.observerLoginPasscode,
    adminPasscode: params.adminPasscode,
  });

  const tournamentCreationActions = useHomeTournamentCreationActions({
    setAuthModalState: params.setAuthModalState,
    isLoginReady: params.isLoginReady,
    setMessage: params.setMessage,
    setForceLoginCardsView: params.setForceLoginCardsView,
    ensureLoginCredentials: params.ensureLoginCredentials,
    refresh: params.refresh,
    createTournamentName: params.createTournamentName,
    createTournamentDate: params.createTournamentDate,
    createTournamentTimeSlot: params.createTournamentTimeSlot,
    createTournamentCourtCount: params.createTournamentCourtCount,
    createTournamentEntryPasscode: params.createTournamentEntryPasscode,
    createTournamentObserverPasscode: params.createTournamentObserverPasscode,
  });

  return {
    entryModalOpen: entryActions.entryModalOpen,
    setEntryModalOpen: entryActions.setEntryModalOpen,
    participantSelectModalOpen: entryActions.participantSelectModalOpen,
    setParticipantSelectModalOpen: entryActions.setParticipantSelectModalOpen,
    participantTournaments: entryActions.participantTournaments,
    onLogin: authActions.onLogin,
    onSignup: authActions.onSignup,
    onRequestCreateTournament: tournamentCreationActions.onRequestCreateTournament,
    onRequestEntryTournament: entryActions.onRequestEntryTournament,
    onEntryTournament: entryActions.onEntryTournament,
    onCreateTournament: tournamentCreationActions.onCreateTournament,
    onParticipantOpen: entryActions.onParticipantOpen,
    onSelectParticipantTournament: entryActions.onSelectParticipantTournament,
    onObserverLogin: roleActions.onObserverLogin,
    onAdminLogin: roleActions.onAdminLogin,
  };
}
