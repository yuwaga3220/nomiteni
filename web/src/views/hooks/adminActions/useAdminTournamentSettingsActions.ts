"use client";

import { api } from "@/lib/client/api";

type UseAdminTournamentSettingsActionsParams = {
  call: (fn: () => Promise<unknown>) => Promise<void>;
  tournamentName: string;
  tournamentDate: string;
  tournamentTimeSlot: string;
  courtCountInput: number;
  observerSetPasscode: string;
};

type TournamentStatus = "ENTRY" | "READY" | "RUNNING" | "FINISHED";

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
          observerPasscode: params.observerSetPasscode,
        }),
      }),
    );

  // 大会のstatusを更新
  const onSetTournamentStatus = (status: TournamentStatus) =>
    params.call(() =>
      api("/api/admin/tournaments/status", {
        method: "POST",
        body: JSON.stringify({ status }),
      }),
    );

  return {
    onSaveTournamentSettings,
    onSetTournamentStatus,
  };
}
