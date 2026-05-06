"use client";

import { useEffect, useLayoutEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { api, getSocket } from "@/lib/client/api";
import type { Me, PublicState, TournamentParticipant } from "@/types";
import type { NomiteniBootstrapData } from "./types";

type Params = {
  initialData: NomiteniBootstrapData;
  me: Me | null;
  forceLoginCardsView: boolean;
  sessionTournamentId: number | null;
  isAdminSession: boolean;
  setMe: Dispatch<SetStateAction<Me | null>>;
  setIsLoggedIn: Dispatch<SetStateAction<boolean>>;
  setIsAdminSession: Dispatch<SetStateAction<boolean>>;
  setState: Dispatch<SetStateAction<PublicState | null>>;
  setSessionTournamentId: Dispatch<SetStateAction<number | null>>;
  setMessage: Dispatch<SetStateAction<string>>;
  setTournamentName: Dispatch<SetStateAction<string>>;
  setTournamentDate: Dispatch<SetStateAction<string>>;
  setTournamentTimeSlot: Dispatch<SetStateAction<string>>;
  setCourtCountInput: Dispatch<SetStateAction<number>>;
  setObserverSetPasscode: Dispatch<SetStateAction<string>>;
  setTournamentParticipants: Dispatch<SetStateAction<TournamentParticipant[]>>;
  active: PublicState["activeTournaments"][number] | null;
  pathname: string;
  router: AppRouterInstance;
};

export function useNomiteniEffects({
  initialData,
  me,
  forceLoginCardsView,
  sessionTournamentId,
  isAdminSession,
  setMe,
  setIsLoggedIn,
  setIsAdminSession,
  setState,
  setSessionTournamentId,
  setMessage,
  setTournamentName,
  setTournamentDate,
  setTournamentTimeSlot,
  setCourtCountInput,
  setObserverSetPasscode,
  setTournamentParticipants,
  active,
  pathname,
  router,
}: Params) {
  useEffect(() => {
    setMe(initialData.user);
    setIsLoggedIn(initialData.isLoggedIn);
    setIsAdminSession(initialData.isAdminSession);
    setState(initialData.state);
    setSessionTournamentId(initialData.sessionTournamentId);
  }, [
    initialData.user,
    initialData.isLoggedIn,
    initialData.isAdminSession,
    initialData.state,
    initialData.sessionTournamentId,
    setMe,
    setIsLoggedIn,
    setIsAdminSession,
    setState,
    setSessionTournamentId,
  ]);

  useEffect(() => {
    let cancelled = false;
    const socket = getSocket();
    const onState = (next: PublicState) => setState(next);
    const onConnectError = () => {
      if (cancelled) return;
      setMessage((prev) =>
        prev
          ? prev
          : "リアルタイム接続に失敗しています。ターミナルに「ポート 3000 は既に使われています」と出ていれば、古い Node（next dev など）を止めてから npm run dev を1つだけ起動してください。next dev だけが動いていると Socket.IO がなく、画面の自動更新も止まります。",
      );
    };
    socket.on("state:update", onState);
    socket.on("connect_error", onConnectError);
    socket.connect();
    return () => {
      cancelled = true;
      socket.off("state:update", onState);
      socket.off("connect_error", onConnectError);
      socket.disconnect();
    };
  }, [setState, setMessage]);

  useEffect(() => {
    setTournamentName(active?.name ?? "春シングルス大会");
    setTournamentDate(active?.eventDate ?? "");
    setTournamentTimeSlot(active?.timeSlot ?? "");
    setCourtCountInput(active?.courtCount ?? 2);
  }, [
    active?.name,
    active?.eventDate,
    active?.timeSlot,
    active?.courtCount,
    setTournamentName,
    setTournamentDate,
    setTournamentTimeSlot,
    setCourtCountInput,
  ]);

  useEffect(() => {
    if (!isAdminSession) return;
    api<{
      tournament: {
        name: string;
        eventDate: string | null;
        timeSlot: string | null;
        courtCount: number;
        observerPasscode: string | null;
      };
      participants: TournamentParticipant[];
    }>("/api/admin/tournaments/settings")
      .then(({ tournament, participants }) => {
        setTournamentName(tournament.name);
        setTournamentDate(tournament.eventDate ?? "");
        setTournamentTimeSlot(tournament.timeSlot ?? "");
        setCourtCountInput(tournament.courtCount);
        setObserverSetPasscode(tournament.observerPasscode ?? "");
        setTournamentParticipants(participants);
      })
      .catch(() => undefined);
  }, [
    isAdminSession,
    setTournamentName,
    setTournamentDate,
    setTournamentTimeSlot,
    setCourtCountInput,
    setObserverSetPasscode,
    setTournamentParticipants,
  ]);

  useLayoutEffect(() => {
    if (!me) {
      if (pathname === "/observer" && sessionTournamentId && !forceLoginCardsView) return;
      if (pathname !== "/") router.replace("/");
      return;
    }
    if (forceLoginCardsView) {
      if (pathname !== "/") router.replace("/");
      return;
    }
    if (isAdminSession) {
      if (pathname !== "/" && pathname !== "/admin") router.replace("/");
      return;
    }
    if (pathname !== "/") router.replace("/");
  }, [me, forceLoginCardsView, pathname, router, sessionTournamentId, isAdminSession]);
}
