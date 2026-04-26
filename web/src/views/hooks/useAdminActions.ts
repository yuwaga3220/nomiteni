"use client";

import type { TournamentParticipant } from "@/types";
import { useAdminBracketPreview } from "./adminActions/useAdminBracketPreview";
import { useAdminTournamentSettingsActions } from "./adminActions/useAdminTournamentSettingsActions";
import { useAdminParticipantActions } from "./adminActions/useAdminParticipantActions";
import { useAdminMatchActions } from "./adminActions/useAdminMatchActions";

type UseAdminActionsParams = {
  call: (fn: () => Promise<unknown>) => Promise<void>;
  tournamentName: string;
  tournamentDate: string;
  tournamentTimeSlot: string;
  courtCountInput: number;
  entrySetPasscode: string;
  observerSetPasscode: string;
  tournamentParticipants: TournamentParticipant[];
};

// 管理者アクションを返す
export function useAdminActions(params: UseAdminActionsParams) {
  // ブラケットプレビューを取得
  const bracketPreview = useAdminBracketPreview({
    tournamentParticipants: params.tournamentParticipants,
  });

  const tournamentSettingsActions = useAdminTournamentSettingsActions({
    call: params.call,
    tournamentName: params.tournamentName,
    tournamentDate: params.tournamentDate,
    tournamentTimeSlot: params.tournamentTimeSlot,
    courtCountInput: params.courtCountInput,
    entrySetPasscode: params.entrySetPasscode,
    observerSetPasscode: params.observerSetPasscode,
  });

  const participantActions = useAdminParticipantActions({
    call: params.call,
  });

  const matchActions = useAdminMatchActions({
    call: params.call,
  });

  return {
    bracketSize: bracketPreview.bracketSize,
    bracketRounds: bracketPreview.bracketRounds,
    bracketHeight: bracketPreview.bracketHeight,
    onSaveTournamentSettings: tournamentSettingsActions.onSaveTournamentSettings,
    onSetTournamentStatus: tournamentSettingsActions.onSetTournamentStatus,
    onSetReady: participantActions.onSetReady,
    onSetAbsent: participantActions.onSetAbsent,
    onSetUnanswered: participantActions.onSetUnanswered,
    onAssignCourt: matchActions.onAssignCourt,
    onStart: matchActions.onStart,
    onWin: matchActions.onWin,
    onSwapParticipants: participantActions.onSwapParticipants,
  };
}
