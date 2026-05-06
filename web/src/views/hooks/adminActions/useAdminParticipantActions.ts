"use client";

import { api } from "@/lib/client/api";

type UseAdminParticipantActionsParams = {
  call: (fn: () => Promise<unknown>) => Promise<void>;
};

// 参加者の初期位置を操作する
export function useAdminParticipantActions(params: UseAdminParticipantActionsParams) {
  const reloadAfterMutation = async (fn: () => Promise<unknown>) => {
    await params.call(fn);
    window.location.reload();
  };

  const onCreateParticipant = (name: string) =>
    reloadAfterMutation(() =>
      api("/api/admin/participants", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    );

  const onUpdateParticipant = (id: number, name: string) =>
    reloadAfterMutation(() =>
      api(`/api/admin/participants/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      }),
    );

  const onDeleteParticipant = (id: number) =>
    reloadAfterMutation(() =>
      api(`/api/admin/participants/${id}`, {
        method: "DELETE",
      }),
    );

  // 参加者の初期位置を交換する
  const onSwapParticipants = async (id1: number | null, id2: number | null) => {
    await reloadAfterMutation(() =>
      api(`/api/admin/participants/swap`, {
        method: "POST",
        body: JSON.stringify({ id1, id2 }),
      }),
    );
  };
  return {
    onCreateParticipant,
    onUpdateParticipant,
    onDeleteParticipant,
    onSwapParticipants,
  };
}
