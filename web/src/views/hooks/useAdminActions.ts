"use client";

import { api } from "@/lib/client/api";

type UseAdminActionsParams = {
  call: (fn: () => Promise<unknown>) => Promise<void>;
  tournamentName: string;
  tournamentDate: string;
  tournamentTimeSlot: string;
  courtCountInput: number;
  entrySetPasscode: string;
  observerSetPasscode: string;
};

export function useAdminActions(params: UseAdminActionsParams) {
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

  const onSetReady = (id: number) =>
    params.call(() =>
      api(`/api/admin/participants/${id}/checkin`, {
        method: "POST",
        body: JSON.stringify({ checkedIn: true, canPlayToday: true }),
      }),
    );

  const onSetAbsent = (id: number) =>
    params.call(() =>
      api(`/api/admin/participants/${id}/checkin`, {
        method: "POST",
        body: JSON.stringify({ checkedIn: true, canPlayToday: false }),
      }),
    );

  const onSetUnanswered = (id: number) =>
    params.call(() =>
      api(`/api/admin/participants/${id}/checkin`, {
        method: "POST",
        body: JSON.stringify({ checkedIn: false, canPlayToday: null }),
      }),
    );

  const onAssignCourt = (matchId: number, courtNumber: number) =>
    params.call(() =>
      api(`/api/admin/matches/${matchId}/assign`, {
        method: "POST",
        body: JSON.stringify({ courtNumber }),
      }),
    );

  const onStart = (matchId: number) => params.call(() => api(`/api/admin/matches/${matchId}/start`, { method: "POST" }));

  const onWin = (matchId: number, winnerId: number | null) =>
    params.call(() =>
      api(`/api/admin/matches/${matchId}/result`, {
        method: "POST",
        body: JSON.stringify({ winnerId }),
      }),
    );

  return {
    onSaveTournamentSettings,
    onSetReady,
    onSetAbsent,
    onSetUnanswered,
    onAssignCourt,
    onStart,
    onWin,
  };
}
