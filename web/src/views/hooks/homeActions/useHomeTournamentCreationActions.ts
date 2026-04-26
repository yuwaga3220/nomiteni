"use client";

import type { AuthMode } from "@/types";
import { api } from "@/lib/client/api";

type UseHomeTournamentCreationActionsParams = {
  setAuthModalState: (mode: AuthMode) => void;
  isLoginReady: boolean;
  setMessage: (message: string) => void;
  setForceLoginCardsView: (value: boolean) => void;
  ensureLoginCredentials: () => void;
  refresh: () => Promise<void>;
  createTournamentName: string;
  createTournamentDate: string;
  createTournamentTimeSlot: string;
  createTournamentCourtCount: number;
  createTournamentEntryPasscode: string;
  createTournamentObserverPasscode: string;
};

export function useHomeTournamentCreationActions(params: UseHomeTournamentCreationActionsParams) {
  const onRequestCreateTournament = (setCreateModalOpen: (v: boolean) => void) => {
    if (!params.isLoginReady) {
      params.setMessage("まずはログインしてください。");
      params.setAuthModalState("login");
      return;
    }
    setCreateModalOpen(true);
  };

  const onCreateTournament = async (setCreateModalOpen: (v: boolean) => void) => {
    try {
      params.ensureLoginCredentials();
      if (!params.createTournamentName) throw new Error("大会名を入力してください。");
      if (!params.createTournamentEntryPasscode || !params.createTournamentObserverPasscode) {
        throw new Error("大会/観戦パスコードを入力してください。");
      }
      const created = await api<{ tournamentId: number; adminPasscode: string }>("/api/tournaments/create", {
        method: "POST",
        body: JSON.stringify({
          name: params.createTournamentName,
          eventDate: params.createTournamentDate || null,
          timeSlot: params.createTournamentTimeSlot || null,
          courtCount: params.createTournamentCourtCount,
          entryPasscode: params.createTournamentEntryPasscode,
          observerPasscode: params.createTournamentObserverPasscode,
        }),
      });
      await params.refresh();
      params.setForceLoginCardsView(true);
      setCreateModalOpen(false);
      params.setMessage(`大会を追加しました。管理者パスコード: ${created.adminPasscode} をメモしてください。`);
    } catch (e) {
      params.setMessage((e as Error).message);
    }
  };

  return {
    onRequestCreateTournament,
    onCreateTournament,
  };
}
