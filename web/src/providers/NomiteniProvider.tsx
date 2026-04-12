/**
 * プロバイダー（コンテキストの提供）
 * コンテキストは、アプリケーションの状態を管理するためのもの
 */

"use client";

import { useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api, getSocket } from "@/lib/client/api";
import type { AuthMode, CheckinState, Match, Me, PublicState, TournamentBrief, User } from "@/types";
import { NomiteniContext, type NomiteniContextValue } from "@/context/NomiteniContext";

// プロバイダーコンポーネント
export function NomiteniProvider({ children }: { children: ReactNode }) {
  // ルーターとパスを取得
  const router = useRouter();
  const pathname = usePathname();

  // ユーザー情報を管理
  const [me, setMe] = useState<Me | null>(null);
  // 状態を管理
  const [state, setState] = useState<PublicState | null>(null);
  const [message, setMessage] = useState<string>("");
  const [forceLoginCardsView, setForceLoginCardsView] = useState(false);

  const [authModalState, setAuthModalState] = useState<AuthMode>("none");
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

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // ログイン準備ができているかを管理
  const isLoginReady = Boolean(authEmail && authPassword);
  // ログイン中かどうかを管理
  const isHeaderLoggedIn = isLoggedIn;

  // ユーザーIDからユーザー情報を取得
  const usersById = useMemo(
    () => new Map((state?.users ?? []).map((u) => [u.id, u])),
    [state?.users],
  );
  // 現在開催中の大会を取得
  const active = state?.activeTournament ?? null;
  // 試合を割り当て可能な試合を取得
  const assignableMatches = (active?.matches ?? []).filter(
    (m) => m.status !== "COMPLETED" && m.player1Id && m.player2Id,
  );
  // 状態を更新
  const refresh = async () => {
    const [{ user, isLoggedIn }, data] = await Promise.all([
      api<{ user: Me | null; isLoggedIn: boolean }>("/api/auth/me"), // APIを呼び出し、ユーザー情報を取得
      api<PublicState>("/api/public/state"), // APIを呼び出し、状態を取得
    ]);
    setMe(user);
    setIsLoggedIn(isLoggedIn);
    setState(data);
    setCourtCountInput(data.courtCount);
    setMessage("");
  };

  // マウント時に接続を確立し、アンマウント時に接続を解除
  useEffect(() => {
    // キャンセルフラグを管理
    let cancelled = false;
    // 状態を更新
    void refresh().catch((e: Error) => {
      if (!cancelled) setMessage(e.message); // キャンセルフラグが立っていなければエラーメッセージを表示
    });
    const socket = getSocket(); // Socket.IOを取得
    const onState = (next: PublicState) => setState(next); // 状態を更新
    const onConnectError = () => { // 接続エラーを管理
      if (cancelled) return;
      setMessage((prev) =>
        prev
          ? prev
          : "リアルタイム接続に失敗しています。ターミナルに「ポート 3000 は既に使われています」と出ていれば、古い Node（next dev など）を止めてから npm run dev を1つだけ起動してください。next dev だけが動いていると Socket.IO がなく、画面の自動更新も止まります。",
      );
    };
    socket.on("state:update", onState); // 状態更新イベントを管理
    socket.on("connect_error", onConnectError); // 接続エラーイベントを管理
    socket.connect(); // Socket.IOを接続
    // アンマウント時に実行
    return () => {
      cancelled = true;
      socket.off("state:update", onState);
      socket.off("connect_error", onConnectError);
      socket.disconnect();
    };
  }, []); // マウント時に一度だけ実行

  // 参加者の情報を現在の値で更新
  useEffect(() => {
    if (me?.role === "PARTICIPANT") { // 参加者の場合
      setEntryName(me.name ?? "");
      setEntryParty(me.partyJoin);
      setEntryNote(me.note ?? "");
    }
  }, [me]); // ユーザー情報が変化したら

  // 大会情報を更新
  useEffect(() => {
    setTournamentName(active?.name ?? "春シングルス大会");
    setTournamentDate(active?.eventDate ?? "");
    setTournamentTimeSlot(active?.timeSlot ?? "");
    setCourtCountInput(active?.courtCount ?? state?.courtCount ?? 2);
  }, [active, state?.courtCount]); // 大会情報が変化したら

  // 管理者の情報を現在の値で更新
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
  }, [me?.role]); // ユーザー情報が変化したら

  // ロールに応じた許可パスへ誘導（ADMIN/OBSERVER はホーム / も利用可）
  useLayoutEffect(() => {
    if (!me) {
      // /me 取得前は /participant に留め、取得後にロールで振り分ける
      if (pathname === "/participant" && !forceLoginCardsView) return;
      if (pathname !== "/") router.replace("/");
      return;
    }
    if (forceLoginCardsView) {
      if (pathname !== "/") router.replace("/");
      return;
    }
    if (me.role === "ADMIN") {
      if (pathname !== "/" && pathname !== "/admin") router.replace("/");
      return;
    }
    if (me.role === "OBSERVER") {
      if (pathname !== "/" && pathname !== "/observer") router.replace("/");
      return;
    }
    if (me.role === "LOGIN") {
      if (pathname !== "/") router.replace("/");
      return;
    }
    // PARTICIPANT
    if (pathname !== "/" && pathname !== "/participant") router.replace("/");
  }, [me, forceLoginCardsView, pathname, router]);

  // プレイヤー名を取得
  const playerName = (id: number | null) => {
    if (!id) return "BYE"; // プレイヤーIDがない場合
    return usersById.get(id)?.name ?? `Player #${id}`; // プレイヤー名を取得
  };

  // 試合状態をラベル化
  const matchStatusLabel = (status: Match["status"]) => {
    if (status === "PENDING") return "待機"; // 待機状態
    if (status === "ASSIGNED") return "予備"; // 予備状態
    if (status === "IN_PROGRESS") return "試合中"; // 試合中状態
    return "終了"; // 終了状態
  };

  // 参加者のチェックイン状態を取得
  const checkinState = (u: User): CheckinState => {
    if (!u.checkedIn || u.canPlayToday === null) return "UNANSWERED";
    return u.canPlayToday ? "READY" : "ABSENT";
  };

  // 非同期関数を呼び出し、更新してメッセージを表示
  const call = async (fn: () => Promise<unknown>) => {
    try {
      await fn(); // 非同期関数を呼び出し
      await refresh(); // 状態を更新
      setMessage("更新しました。");
    } catch (e) {
      setMessage((e as Error).message);
    }
  };

  // メールとパスワードが入力されているかを確認
  const ensureLoginCredentials = () => {
    if (!authEmail || !authPassword) {
      throw new Error("まずはログインしてください。");
    }
  };

  // 試合をグループ化
  const groupedRounds = useMemo(() => {
    const map = new Map<number, Match[]>();
    for (const m of active?.matches ?? []) {
      map.set(m.round, [...(map.get(m.round) ?? []), m]);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [active?.matches]);

  // ヘッダーのログアウト
  const onHeaderLogout = () => {
    // 認証モードをリセット
    setAuthModalState("none");
    setAuthEmail("");
    setAuthPassword("");
    setEntryTournament(null);
    setCreateModalOpen(false);
    setForceLoginCardsView(false);
    if (me || isLoggedIn) {
      void call(() => api("/api/auth/logout", { method: "POST" }));
      return;
    }
    setMessage("ログイン情報をクリアしました。");
  };

  // コンテキストの値を設定
  const value: NomiteniContextValue = {
    me,
    setMe,
    state,
    message,
    setMessage,
    forceLoginCardsView,
    setForceLoginCardsView,
    authModalState,
    setAuthModalState,
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

  // コンテキストの値を提供
  return <NomiteniContext.Provider value={value}>{children}</NomiteniContext.Provider>; // コンテキストの値を提供
}
