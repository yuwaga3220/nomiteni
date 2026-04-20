"use client";

import { api } from "@/lib/client/api";

type UseAdminTournamentSettingsActionsParams = {
  call: (fn: () => Promise<unknown>) => Promise<void>;
  tournamentName: string;
  tournamentDate: string;
  tournamentTimeSlot: string;
  courtCountInput: number;
  entrySetPasscode: string;
  observerSetPasscode: string;
};

// 大会設定を保存する
export function useAdminTournamentSettingsActions(params: UseAdminTournamentSettingsActionsParams) {
  const onSaveTournamentSettings = () =>
    params.call(() =>
      api("/api/admin/tournaments/settings", {
        method: "POST",
        body: JSON.stringify({
          name: params.tournamentName,
          eventDate: params.tournamentDate || null,
          timeSlot: params.tournamentTimeSlot || null,
          courtCount: params.courtCountInput,
          entryPasscode: params.entrySetPasscode,
          observerPasscode: params.observerSetPasscode,
        }),
      }),
    );

  return {
    onSaveTournamentSettings,
  };
}
