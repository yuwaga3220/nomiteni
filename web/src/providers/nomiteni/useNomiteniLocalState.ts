"use client";

import { useState } from "react";
import type { AuthMode, TournamentParticipant } from "@/types";
import type { NomiteniBootstrapData, NomiteniLocalState } from "./types";

export function useNomiteniLocalState(initialData: NomiteniBootstrapData): NomiteniLocalState {
  const [me, setMe] = useState(initialData.user);
  const [state, setState] = useState(initialData.state);
  const [message, setMessage] = useState("");
  const [forceLoginCardsView, setForceLoginCardsView] = useState(false);

  const [authModalState, setAuthModalState] = useState<AuthMode>("none");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [adminPasscode, setAdminPasscode] = useState("");
  const [observerLoginPasscode, setObserverLoginPasscode] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createTournamentName, setCreateTournamentName] = useState("新規大会");
  const [createTournamentDate, setCreateTournamentDate] = useState("");
  const [createTournamentTimeSlot, setCreateTournamentTimeSlot] = useState("");
  const [createTournamentCourtCount, setCreateTournamentCourtCount] = useState(2);
  const [createTournamentObserverPasscode, setCreateTournamentObserverPasscode] = useState("");
  const [observerSetPasscode, setObserverSetPasscode] = useState("");
  const [tournamentParticipants, setTournamentParticipants] = useState<TournamentParticipant[]>([]);
  const [tournamentName, setTournamentName] = useState("春シングルス大会");
  const [tournamentDate, setTournamentDate] = useState("");
  const [tournamentTimeSlot, setTournamentTimeSlot] = useState("");
  const [courtCountInput, setCourtCountInput] = useState(2);

  const [isLoggedIn, setIsLoggedIn] = useState(initialData.isLoggedIn);
  const [isAdminSession, setIsAdminSession] = useState(initialData.isAdminSession);
  const [sessionTournamentId, setSessionTournamentId] = useState<number | null>(
    initialData.sessionTournamentId,
  );

  return {
    me,
    setMe,
    state,
    setState,
    message,
    setMessage,
    forceLoginCardsView,
    setForceLoginCardsView,
    authModalState,
    setAuthModalState,
    authEmail,
    setAuthEmail,
    authPassword,
    setAuthPassword,
    adminPasscode,
    setAdminPasscode,
    observerLoginPasscode,
    setObserverLoginPasscode,
    createModalOpen,
    setCreateModalOpen,
    createTournamentName,
    setCreateTournamentName,
    createTournamentDate,
    setCreateTournamentDate,
    createTournamentTimeSlot,
    setCreateTournamentTimeSlot,
    createTournamentCourtCount,
    setCreateTournamentCourtCount,
    createTournamentObserverPasscode,
    setCreateTournamentObserverPasscode,
    observerSetPasscode,
    setObserverSetPasscode,
    tournamentParticipants,
    setTournamentParticipants,
    tournamentName,
    setTournamentName,
    tournamentDate,
    setTournamentDate,
    tournamentTimeSlot,
    setTournamentTimeSlot,
    courtCountInput,
    setCourtCountInput,
    isLoggedIn,
    setIsLoggedIn,
    isAdminSession,
    setIsAdminSession,
    sessionTournamentId,
    setSessionTournamentId,
  };
}
