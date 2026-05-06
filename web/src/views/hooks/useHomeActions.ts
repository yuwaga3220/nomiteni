"use client";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { AuthMode, Me } from "@/types";
import { useHomeAuthActions } from "./homeActions/useHomeAuthActions";
import { useHomeAccessActions } from "./homeActions/useHomeAccessActions";
import { useHomeTournamentCreationActions } from "./homeActions/useHomeTournamentCreationActions";

type UseHomeActionsParams = {
  router: AppRouterInstance;
  setMe: (me: Me | null) => void;
  setAuthModalState: (mode: AuthMode) => void;
  isLoggedIn: boolean;
  isLoginReady: boolean;
  setMessage: (message: string) => void;
  setForceLoginCardsView: (value: boolean) => void;
  call: (fn: () => Promise<unknown>) => Promise<void>;
  ensureLoginCredentials: () => void;
  refresh: () => Promise<void>;
  observerLoginPasscode: string;
  adminPasscode: string;
  createTournamentName: string;
  createTournamentDate: string;
  createTournamentTimeSlot: string;
  createTournamentCourtCount: number;
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

  const accessActions = useHomeAccessActions({
    router: params.router,
    setMe: params.setMe,
    setAuthModalState: params.setAuthModalState,
    isLoggedIn: params.isLoggedIn,
    isLoginReady: params.isLoginReady,
    setMessage: params.setMessage,
    setForceLoginCardsView: params.setForceLoginCardsView,
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
    createTournamentObserverPasscode: params.createTournamentObserverPasscode,
  });

  return {
    onLogin: authActions.onLogin,
    onSignup: authActions.onSignup,
    onRequestCreateTournament: tournamentCreationActions.onRequestCreateTournament,
    onCreateTournament: tournamentCreationActions.onCreateTournament,
    onObserverLogin: accessActions.onObserverLogin,
    onAdminLogin: accessActions.onAdminLogin,
  };
}
