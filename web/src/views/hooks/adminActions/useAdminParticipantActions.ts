"use client";

import { api } from "@/lib/client/api";

type UseAdminParticipantActionsParams = {
  call: (fn: () => Promise<unknown>) => Promise<void>;
};

// 参加者のステータスを設定する
export function useAdminParticipantActions(params: UseAdminParticipantActionsParams) {
  // 参加者を準備完了にする
  const onSetReady = (id: number) =>
    params.call(() =>
      api(`/api/admin/participants/${id}/checkin`, {
        method: "POST",
        body: JSON.stringify({ checkedIn: true, canPlayToday: true }),
      }),
    );

  // 参加者を不参加にする
  const onSetAbsent = (id: number) =>
    params.call(() =>
      api(`/api/admin/participants/${id}/checkin`, {
        method: "POST",
        body: JSON.stringify({ checkedIn: true, canPlayToday: false }),
      }),
    );

  // 参加者を未回答にする
  const onSetUnanswered = (id: number) =>
    params.call(() =>
      api(`/api/admin/participants/${id}/checkin`, {
        method: "POST",
        body: JSON.stringify({ checkedIn: false, canPlayToday: null }),
      }),
    );

  // 参加者の初期位置を交換する
  const onSwapParticipants = async (id1: number | null, id2: number | null) => {
    await params.call(() =>
      api(`/api/admin/participants/swap`, {
        method: "POST",
        body: JSON.stringify({ id1, id2 }),
      }),
    );
    window.location.reload();
  };
  return {
    onSetReady,
    onSetAbsent,
    onSetUnanswered,
    onSwapParticipants,
  };
}
