"use client";

import { api } from "@/lib/client/api";

type UseAdminParticipantActionsParams = {
  call: (fn: () => Promise<unknown>) => Promise<void>;
};

// 参加者の初期位置を操作する
export function useAdminParticipantActions(params: UseAdminParticipantActionsParams) {
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
    onSwapParticipants,
  };
}
