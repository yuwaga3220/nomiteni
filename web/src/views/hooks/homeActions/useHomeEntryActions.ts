"use client";

import { useState } from "react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { api } from "@/lib/client/api";
import type { AuthMode, TournamentBrief } from "@/types";

type UseHomeEntryActionsParams = {
  router: AppRouterInstance;
  setAuthModalState: (mode: AuthMode) => void;
  isLoginReady: boolean;
  setMessage: (message: string) => void;
  setEntryTournament: (tournament: TournamentBrief | null) => void;
  setForceLoginCardsView: (value: boolean) => void;
  ensureLoginCredentials: () => void;
  refresh: () => Promise<void>;
  entryPasscode: string;
  setEntryPasscode: (v: string) => void;
  entryName: string;
  entryParty: boolean;
  entryNote: string;
};

export function useHomeEntryActions(params: UseHomeEntryActionsParams) {
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [participantSelectModalOpen, setParticipantSelectModalOpen] = useState(false);
  const [participantTournaments, setParticipantTournaments] = useState<TournamentBrief[]>([]);

  const openLoginModalWithMessage = () => {
    params.setMessage("まずはログインしてください。");
    params.setAuthModalState("login");
  };

  const onRequestEntryTournament = () => {
    if (!params.isLoginReady) {
      openLoginModalWithMessage();
      return;
    }
    setEntryModalOpen(true);
  };

  const onEntryTournament = async () => {
    try {
      params.ensureLoginCredentials();
      if (!params.entryPasscode) throw new Error("大会パスコードを入力してください。");
      if (!params.entryName) throw new Error("選手名を入力してください。");
      await api("/api/entry/self", {
        method: "POST",
        body: JSON.stringify({
          tournamentPasscode: params.entryPasscode,
          name: params.entryName,
          partyJoin: params.entryParty,
          note: params.entryNote || undefined,
        }),
      });
      const preview = await api<{ tournament: TournamentBrief }>("/api/entry/preview", {
        method: "POST",
        body: JSON.stringify({ tournamentPasscode: params.entryPasscode }),
      });
      await params.refresh();
      params.setEntryTournament(preview.tournament);
      setEntryModalOpen(false);
      params.setForceLoginCardsView(false);
      params.router.replace(`/participant?tournamentId=${preview.tournament.id}`);
    } catch (e) {
      params.setMessage((e as Error).message);
    }
  };

  const onParticipantOpen = () => {
    if (!params.isLoginReady) {
      openLoginModalWithMessage();
      return;
    }
    (async () => {
      try {
        params.ensureLoginCredentials();
        params.setForceLoginCardsView(true);
        const result = await api<{ tournaments: TournamentBrief[] }>("/api/participant/tournaments");
        if (!result.tournaments.length) {
          throw new Error("参加者として紐づく大会がありません。管理者に参加者登録を依頼してください。");
        }
        setParticipantTournaments(result.tournaments);
        setParticipantSelectModalOpen(true);
      } catch (e) {
        params.setMessage((e as Error).message);
      }
    })();
  };

  const onSelectParticipantTournament = (tournamentId: number) => {
    const selected = participantTournaments.find((t) => t.id === tournamentId);
    if (!selected) return;
    (async () => {
      try {
        await api("/api/participant/select-tournament", {
          method: "POST",
          body: JSON.stringify({ tournamentId }),
        });
        await params.refresh();
        params.setEntryTournament(selected);
        params.setEntryPasscode(selected.entryPasscode ?? "");
        setParticipantSelectModalOpen(false);
        params.setForceLoginCardsView(false);
        params.router.replace(`/participant?tournamentId=${selected.id}`);
      } catch (e) {
        params.setMessage((e as Error).message);
      }
    })();
  };

  return {
    entryModalOpen,
    setEntryModalOpen,
    participantSelectModalOpen,
    setParticipantSelectModalOpen,
    participantTournaments,
    onRequestEntryTournament,
    onEntryTournament,
    onParticipantOpen,
    onSelectParticipantTournament,
  };
}
