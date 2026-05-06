"use client";

import { api } from "@/lib/client/api";

type UseAdminMatchActionsParams = {
  call: (fn: () => Promise<unknown>) => Promise<void>;
};

// 試合のステータスを設定する
export function useAdminMatchActions(params: UseAdminMatchActionsParams) {
  // 試合をコートに割り当てる
  const onAssignCourt = (matchId: number, courtNumber: number) =>
    params.call(() =>
      api(`/api/admin/matches/${matchId}/assign`, {
        method: "POST",
        body: JSON.stringify({ courtNumber }),
      }),
    );

  // 試合を開始する
  const onStart = (matchId: number) =>
    params.call(() =>
      api(`/api/admin/matches/${matchId}/start`, {
        method: "POST",
      }),
    );

  // 進行中の試合を準備中へ戻す
  const onBackToReady = (matchId: number) =>
    params.call(() =>
      api(`/api/admin/matches/${matchId}/ready`, {
        method: "POST",
      }),
    );

  // 試合を勝者にする
  const onWin = (matchId: number, winnerId: number | null) =>
    params.call(() =>
      api(`/api/admin/matches/${matchId}/result`, {
        method: "POST",
        body: JSON.stringify({ winnerId }),
      }),
    );

  return {
    onAssignCourt,
    onStart,
    onBackToReady,
    onWin,
  };
}
