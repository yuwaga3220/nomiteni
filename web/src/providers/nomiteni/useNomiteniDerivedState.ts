"use client";

import { useMemo } from "react";
import type { Match, PublicState } from "@/types";
import { getStatusLabel } from "@/lib/status-label";

type Params = {
  state: PublicState | null;
  sessionTournamentId: number | null;
  authEmail: string;
  authPassword: string;
};

export function useNomiteniDerivedState({
  state,
  sessionTournamentId,
  authEmail,
  authPassword,
}: Params) {
  const participantsById = useMemo(
    () => new Map((state?.participants ?? []).map((participant) => [participant.id, participant])),
    [state?.participants],
  );

  const activeTournaments = useMemo(() => state?.activeTournaments ?? [], [state?.activeTournaments]);

  const active = useMemo(() => {
    if (sessionTournamentId) {
      return (
        activeTournaments.find((tournament) => tournament.id === sessionTournamentId)
        ?? activeTournaments[0]
        ?? null
      );
    }
    return activeTournaments[0] ?? null;
  }, [activeTournaments, sessionTournamentId]);

  const assignableMatches = useMemo(
    () => (active?.matches ?? []).filter((m) => m.status === "READY" || m.status === "RUNNING"),
    [active?.matches],
  );

  const groupedRounds = useMemo(() => {
    const map = new Map<number, Match[]>();
    for (const m of active?.matches ?? []) {
      map.set(m.round, [...(map.get(m.round) ?? []), m]);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [active?.matches]);

  const isLoginReady = Boolean(authEmail && authPassword);

  const playerName = (id: number | null) => {
    if (!id) return "BYE";
    return participantsById.get(id)?.name ?? `Player #${id}`;
  };

  const matchStatusLabel = (status: Match["status"]) => {
    return getStatusLabel(status);
  };

  return {
    activeTournaments,
    active,
    assignableMatches,
    groupedRounds,
    isLoginReady,
    playerName,
    matchStatusLabel,
  };
}
