/**
 * プロバイダー（コンテキストの提供）
 * コンテキストは、アプリケーションの状態を管理するためのもの
 */

"use client";

import { useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api, getSocket } from "@/lib/client/api";
import type { AuthMode, Match, Me, PublicState, TournamentParticipant } from "@/types";
import { NomiteniContext, type NomiteniContextValue } from "@/context/NomiteniContext";

export type NomiteniBootstrapData = {
  user: Me | null;
  isLoggedIn: boolean;
  isAdminSession: boolean;
  state: PublicState;
  sessionTournamentId: number | null;
};

// プロバイダーコンポーネント
export function NomiteniProvider({
  children,
  initialData,
}: {
  children: ReactNode;
  initialData: NomiteniBootstrapData;
}) {
  // ルーターとパスを取得
  const router = useRouter();
  const pathname = usePathname();

  // ユーザー情報を管理
  const [me, setMe] = useState<Me | null>(initialData.user);
  // 状態を管理
  const [state, setState] = useState<PublicState | null>(initialData.state);
  const [message, setMessage] = useState<string>("");
  const [forceLoginCardsView, setForceLoginCardsView] = useState(false);

  const [authModalState, setAuthModalState] = useState<AuthMode>("none");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [adminPasscode, setAdminPasscode] = useState("");
  const [observerLoginPasscode, setObserverLoginPasscode] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createTournamentName, setCreateTournamentName] = useState("新規大会");
  const [createTournamentDate, setCreateTournamentDate] = useState("");
  const [createTournamentTimeSlot, setCreateTournamentTimeSlot] = useState("");
  const [createTournamentCourtCount, setCreateTournamentCourtCount] = useState(2);
  const [createTournamentObserverPasscode, setCreateTournamentObserverPasscode] = useState("");
  const [observerSetPasscode, setObserverSetPasscode] = useState("");
  const [tournamentParticipants, setTournamentParticipants] = useState<TournamentParticipant[]>([]);
  const [tournamentName, setTournamentName] = useState("春シングルス大会");
  const [tournamentDate, setTournamentDate] = useState("");
  const [tournamentTimeSlot, setTournamentTimeSlot] = useState("");
  const [courtCountInput, setCourtCountInput] = useState(2);

  const [isLoggedIn, setIsLoggedIn] = useState(initialData.isLoggedIn);
  const [isAdminSession, setIsAdminSession] = useState(initialData.isAdminSession);
  const [sessionTournamentId, setSessionTournamentId] = useState<number | null>(initialData.sessionTournamentId);
  const isLoginReady = Boolean(authEmail && authPassword);

  // ユーザーIDからユーザー情報を取得
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
  // 試合を割り当て可能な試合を取得
  const assignableMatches = (active?.matches ?? []).filter(
    (m) => m.status === "READY" || m.status === "RUNNING",
  );
  // 状態を更新
  const refresh = async () => {
    router.refresh();
    setMessage("");
  };

  // Server Component で再取得した初期データを同期
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
  ]);

  // マウント時に接続を確立し、アンマウント時に接続を解除
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
  }, []); // マウント時に一度だけ実行

  // 参加者の情報を現在の値で更新
  // 大会情報を更新
  useEffect(() => {
    setTournamentName(active?.name ?? "春シングルス大会");
    setTournamentDate(active?.eventDate ?? "");
    setTournamentTimeSlot(active?.timeSlot ?? "");
    setCourtCountInput(active?.courtCount ?? 2);
  }, [active?.name, active?.eventDate, active?.timeSlot, active?.courtCount]); // 大会情報が変化したら

  // 管理者の情報を現在の値で更新
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
  }, [isAdminSession]); // 管理者セッションが変化したら

  // セッション状態に応じた許可パスへ誘導（管理者はホーム / も利用可）
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

  // プレイヤー名を取得
  const playerName = (id: number | null) => {
    if (!id) return "BYE"; // プレイヤーIDがない場合
    return participantsById.get(id)?.name ?? `Player #${id}`; // プレイヤー名を取得
  };

  // 試合状態をラベル化
  const matchStatusLabel = (status: Match["status"]) => {
    if (status === "READY") return "準備完了"; // 準備完了
    if (status === "RUNNING") return "試合中"; // 試合中状態
    return "終了"; // 終了状態
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
    setAuthModalState("none");
    setAuthEmail("");
    setAuthPassword("");
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
    createTournamentObserverPasscode,
    setCreateTournamentObserverPasscode,
    observerSetPasscode,
    setObserverSetPasscode,
    tournamentName,
    setTournamentName,
    tournamentDate,
    setTournamentDate,
    tournamentTimeSlot,
    setTournamentTimeSlot,
    courtCountInput,
    setCourtCountInput,
    isLoggedIn,
    isAdminSession,
    sessionTournamentId,
    isLoginReady,
    activeTournaments,
    active,
    assignableMatches,
    refresh,
    playerName,
    matchStatusLabel,
    call,
    ensureLoginCredentials,
    groupedRounds,
    tournamentParticipants,
    onHeaderLogout,
  };

  // コンテキストの値を提供
  return <NomiteniContext.Provider value={value}>{children}</NomiteniContext.Provider>; // コンテキストの値を提供
}
