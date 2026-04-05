/**
 * プロバイダー（コンテキストの提供）
 * コンテキストは、アプリケーションの状態を管理するためのものです。
 * コンテキストは、アプリケーションの状態を管理するためのものです。
 */

"use client";

import { useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api, getSocket } from "@/lib/api";
import type { AuthMode, CheckinState, Match, Me, PublicState, TournamentBrief, User } from "@/types";
import { NomiteniContext, type NomiteniContextValue } from "@/context/NomiteniContext";

export function NomiteniProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [me, setMe] = useState<Me | null>(null);
  const [state, setState] = useState<PublicState | null>(null);
  const [message, setMessage] = useState<string>("");
  const [forceLoginCardsView, setForceLoginCardsView] = useState(false);

  const [authMode, setAuthMode] = useState<AuthMode>("none");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [entryPasscode, setEntryPasscode] = useState("");
  const [entryTournament, setEntryTournament] = useState<TournamentBrief | null>(null);
  const [entryName, setEntryName] = useState("");
  const [entryParty, setEntryParty] = useState(false);
  const [entryNote, setEntryNote] = useState("");

  const [adminPasscode, setAdminPasscode] = useState("");
  const [observerLoginPasscode, setObserverLoginPasscode] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createTournamentName, setCreateTournamentName] = useState("新規大会");
  const [createTournamentDate, setCreateTournamentDate] = useState("");
  const [createTournamentTimeSlot, setCreateTournamentTimeSlot] = useState("");
  const [createTournamentCourtCount, setCreateTournamentCourtCount] = useState(2);
  const [createTournamentEntryPasscode, setCreateTournamentEntryPasscode] = useState("");
  const [createTournamentObserverPasscode, setCreateTournamentObserverPasscode] = useState("");
  const [observerSetPasscode, setObserverSetPasscode] = useState("");
  const [entrySetPasscode, setEntrySetPasscode] = useState("");
  const [tournamentName, setTournamentName] = useState("春シングルス大会");
  const [tournamentDate, setTournamentDate] = useState("");
  const [tournamentTimeSlot, setTournamentTimeSlot] = useState("");
  const [courtCountInput, setCourtCountInput] = useState(2);
  const isLoginReady = Boolean(authEmail && authPassword);
  const isHeaderLoggedIn = Boolean(me) || isLoginReady;

  const usersById = useMemo(
    () => new Map((state?.users ?? []).map((u) => [u.id, u])),
    [state?.users],
  );
  const active = state?.activeTournament ?? null;
  const assignableMatches = (active?.matches ?? []).filter(
    (m) => m.status !== "COMPLETED" && m.player1Id && m.player2Id,
  );

  const refresh = async () => {
    const [{ user }, data] = await Promise.all([
      api<{ user: Me | null }>("/api/auth/me"),
      api<PublicState>("/api/public/state"),
    ]);
    setMe(user);
    setState(data);
    setCourtCountInput(data.courtCount);
    setMessage("");
  };

  useEffect(() => {
    let cancelled = false;
    void refresh().catch((e: Error) => {
      if (!cancelled) setMessage(e.message);
    });

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
  }, []);

  useEffect(() => {
    if (me?.role === "PARTICIPANT") {
      setEntryName(me.name ?? "");
      setEntryParty(me.partyJoin);
      setEntryNote(me.note ?? "");
    }
  }, [me]);

  useEffect(() => {
    setTournamentName(active?.name ?? "春シングルス大会");
    setTournamentDate(active?.eventDate ?? "");
    setTournamentTimeSlot(active?.timeSlot ?? "");
    setCourtCountInput(active?.courtCount ?? state?.courtCount ?? 2);
  }, [active, state?.courtCount]);

  useEffect(() => {
    if (me?.role !== "ADMIN") return;
    api<{
      tournament: {
        name: string;
        eventDate: string | null;
        timeSlot: string | null;
        courtCount: number;
        entryPasscode: string | null;
        observerPasscode: string | null;
      };
    }>("/api/admin/tournaments/settings")
      .then(({ tournament }) => {
        setTournamentName(tournament.name);
        setTournamentDate(tournament.eventDate ?? "");
        setTournamentTimeSlot(tournament.timeSlot ?? "");
        setCourtCountInput(tournament.courtCount);
        setEntrySetPasscode(tournament.entryPasscode ?? "");
        setObserverSetPasscode(tournament.observerPasscode ?? "");
      })
      .catch(() => undefined);
  }, [me?.role]);

  useLayoutEffect(() => {
    if (!me) {
      if (pathname !== "/") router.replace("/");
      return;
    }
    if (forceLoginCardsView) {
      if (pathname !== "/") router.replace("/");
      return;
    }
    const target =
      me.role === "PARTICIPANT" ? "/participant" : me.role === "ADMIN" ? "/admin" : "/observer";
    if (pathname !== target) router.replace(target);
  }, [me, forceLoginCardsView, pathname, router]);

  const playerName = (id: number | null) => {
    if (!id) return "BYE";
    return usersById.get(id)?.name ?? `Player #${id}`;
  };

  const matchStatusLabel = (status: Match["status"]) => {
    if (status === "PENDING") return "待機";
    if (status === "ASSIGNED") return "予備";
    if (status === "IN_PROGRESS") return "試合中";
    return "終了";
  };

  const checkinState = (u: User): CheckinState => {
    if (!u.checkedIn || u.canPlayToday === null) return "UNANSWERED";
    return u.canPlayToday ? "READY" : "ABSENT";
  };

  const call = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      await refresh();
      setMessage("更新しました。");
    } catch (e) {
      setMessage((e as Error).message);
    }
  };

  const ensureLoginCredentials = () => {
    if (!authEmail || !authPassword) {
      throw new Error("まずはログインしてください。");
    }
  };

  const groupedRounds = useMemo(() => {
    const map = new Map<number, Match[]>();
    for (const m of active?.matches ?? []) {
      map.set(m.round, [...(map.get(m.round) ?? []), m]);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [active?.matches]);

  const onHeaderLogout = () => {
    setAuthMode("none");
    setAuthEmail("");
    setAuthPassword("");
    setEntryTournament(null);
    setCreateModalOpen(false);
    setForceLoginCardsView(false);
    if (me) {
      void call(() => api("/api/auth/logout", { method: "POST" }));
      return;
    }
    setMessage("ログイン情報をクリアしました。");
  };

  const value: NomiteniContextValue = {
    me,
    setMe,
    state,
    message,
    setMessage,
    forceLoginCardsView,
    setForceLoginCardsView,
    authMode,
    setAuthMode,
    authEmail,
    setAuthEmail,
    authPassword,
    setAuthPassword,
    entryPasscode,
    setEntryPasscode,
    entryTournament,
    setEntryTournament,
    entryName,
    setEntryName,
    entryParty,
    setEntryParty,
    entryNote,
    setEntryNote,
    adminPasscode,
    setAdminPasscode,
    observerLoginPasscode,
    setObserverLoginPasscode,
    createModalOpen,
    setCreateModalOpen,
    createTournamentName,
    setCreateTournamentName,
    createTournamentDate,
    setCreateTournamentDate,
    createTournamentTimeSlot,
    setCreateTournamentTimeSlot,
    createTournamentCourtCount,
    setCreateTournamentCourtCount,
    createTournamentEntryPasscode,
    setCreateTournamentEntryPasscode,
    createTournamentObserverPasscode,
    setCreateTournamentObserverPasscode,
    observerSetPasscode,
    setObserverSetPasscode,
    entrySetPasscode,
    setEntrySetPasscode,
    tournamentName,
    setTournamentName,
    tournamentDate,
    setTournamentDate,
    tournamentTimeSlot,
    setTournamentTimeSlot,
    courtCountInput,
    setCourtCountInput,
    isLoginReady,
    isHeaderLoggedIn,
    active,
    assignableMatches,
    refresh,
    playerName,
    matchStatusLabel,
    checkinState,
    call,
    ensureLoginCredentials,
    groupedRounds,
    onHeaderLogout,
  };

  return <NomiteniContext.Provider value={value}>{children}</NomiteniContext.Provider>;
}
