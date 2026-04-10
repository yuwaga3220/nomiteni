// web/src/views/participant-page.tsx
// 参加者ページ
"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RealtimeSection } from "@/components/AppSections";
import { useNomiteni } from "@/context/NomiteniContext";
import { api } from "@/lib/client/api";
import type { Match, PublicState } from "@/types";

// 参加者ページ
export function ParticipantPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<PublicState | null>(null);

  const { me, isHeaderLoggedIn, forceLoginCardsView, setMessage, matchStatusLabel } = useNomiteni();

  const tournamentId = Number(searchParams.get("tournamentId"));
  const allowed = Boolean(!forceLoginCardsView && (me?.role === "PARTICIPANT" || isHeaderLoggedIn));

  // 参加者ページのログインチェック
  useLayoutEffect(() => {
    if (!allowed) router.replace("/");
  }, [allowed, router]);

  // 参加者ページのデータを取得
  useEffect(() => {
    if (!allowed) return;
    if (!Number.isFinite(tournamentId) || tournamentId <= 0) {
      setMessage("大会が選択されていません。ホームから参加大会を選んでください。");
      router.replace("/");
      return;
    }
    api<PublicState>(`/api/participant/realtime?tournamentId=${tournamentId}`) // 参加者ページのデータを取得
      .then((res) => setState(res))
      .catch((e: Error) => setMessage(e.message));
  }, [allowed, tournamentId, router, setMessage]);

  const usersById = useMemo(() => new Map((state?.users ?? []).map((u) => [u.id, u])), [state?.users]); // 参加者をIDで取得
  const playerName = (id: number | null) => {
    if (!id) return "BYE";
    return usersById.get(id)?.name ?? `Player #${id}`;
  };
  const groupedRounds = useMemo(() => { // 試合をグループ化
    const map = new Map<number, Match[]>();
    for (const m of state?.activeTournament?.matches ?? []) {
      map.set(m.round, [...(map.get(m.round) ?? []), m]);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [state?.activeTournament?.matches]);

  if (!allowed) return null;

  return (
    <RealtimeSection
      active={state?.activeTournament}
      state={state}
      groupedRounds={groupedRounds}
      playerName={playerName}
      matchStatusLabel={matchStatusLabel}
    />
  );
}
