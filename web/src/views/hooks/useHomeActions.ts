"use client";

import { useState } from "react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { api } from "@/lib/client/api";
import type { AuthMode, Me, TournamentBrief } from "@/types";

type UseHomeActionsParams = {
  router: AppRouterInstance;
  setMe: (me: Me | null) => void;
  setAuthModalState: (mode: AuthMode) => void;
  isLoginReady: boolean;
  setMessage: (message: string) => void;
  setEntryTournament: (tournament: TournamentBrief | null) => void;
  setForceLoginCardsView: (value: boolean) => void;
  call: (fn: () => Promise<unknown>) => Promise<void>;
  ensureLoginCredentials: () => void;
  refresh: () => Promise<void>;
  entryPasscode: string;
  setEntryPasscode: (v: string) => void;
  entryName: string;
  entryParty: boolean;
  entryNote: string;
  observerLoginPasscode: string;
  adminPasscode: string;
  createTournamentName: string;
  createTournamentDate: string;
  createTournamentTimeSlot: string;
  createTournamentCourtCount: number;
  createTournamentEntryPasscode: string;
  createTournamentObserverPasscode: string;
  authEmail: string;
  authPassword: string;
};

export function useHomeActions(params: UseHomeActionsParams) {
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [participantSelectModalOpen, setParticipantSelectModalOpen] = useState(false);
  const [participantTournaments, setParticipantTournaments] = useState<TournamentBrief[]>([]);

  const onLogin = async () => {
    await params.call(async () => {
      if (!params.authEmail || !params.authPassword) {
        params.setMessage("ログイン用のメールアドレスとパスワードを入力してください。");
        return;
      }
      await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: params.authEmail, password: params.authPassword }),
      });
      params.setMessage("ログイン情報を入力しました。下のボタンで参加者/管理者/観戦者を選択してください。");
      params.setAuthModalState("none");
    });
  };

  const onSignup = () =>
    params.call(async () => {
      if (!params.authEmail || !params.authPassword) {
        throw new Error("サインアップ用のメールアドレスとパスワードを入力してください。");
      }
      await api("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email: params.authEmail, password: params.authPassword }),
      });
      params.setAuthModalState("none");
    });

  const openCreateTournamentModal = (setCreateModalOpen: (v: boolean) => void) => {
    if (!params.isLoginReady) {
      params.setMessage("まずはログインしてください。");
      params.setAuthModalState("login");
      return;
    }
    setCreateModalOpen(true);
  };

  const onRequestEntryTournament = () => {
    if (!params.isLoginReady) {
      params.setMessage("まずはログインしてください。");
      params.setAuthModalState("login");
      return;
    }
    setEntryModalOpen(true);
  };

  const onEntryTournament = async () => {
    try {
      params.ensureLoginCredentials();
      if (!params.entryPasscode) throw new Error("大会パスコードを入力してください。");
      if (!params.entryName) throw new Error("選手名を入力してください。");
      await api("/api/entry/self", {
        method: "POST",
        body: JSON.stringify({
          tournamentPasscode: params.entryPasscode,
          name: params.entryName,
          partyJoin: params.entryParty,
          note: params.entryNote || undefined,
        }),
      });
      const preview = await api<{ tournament: TournamentBrief }>("/api/entry/preview", {
        method: "POST",
        body: JSON.stringify({ tournamentPasscode: params.entryPasscode }),
      });
      await params.refresh();
      params.setEntryTournament(preview.tournament);
      setEntryModalOpen(false);
      params.setForceLoginCardsView(false);
      params.router.replace(`/participant?tournamentId=${preview.tournament.id}`);
    } catch (e) {
      params.setMessage((e as Error).message);
    }
  };

  const onParticipantOpen = () => {
    if (!params.isLoginReady) {
      params.setMessage("まずはログインしてください。");
      params.setAuthModalState("login");
      return;
    }
    (async () => {
      try {
        params.ensureLoginCredentials();
        params.setForceLoginCardsView(true);
        const result = await api<{ tournaments: TournamentBrief[] }>("/api/participant/tournaments");
        if (!result.tournaments.length) {
          throw new Error("参加者として紐づく大会がありません。管理者に参加者登録を依頼してください。");
        }
        setParticipantTournaments(result.tournaments);
        setParticipantSelectModalOpen(true);
      } catch (e) {
        params.setMessage((e as Error).message);
      }
    })();
  };

  const onSelectParticipantTournament = (tournamentId: number) => {
    const selected = participantTournaments.find((t) => t.id === tournamentId);
    if (!selected) return;
    (async () => {
      try {
        await api("/api/participant/select-tournament", {
          method: "POST",
          body: JSON.stringify({ tournamentId }),
        });
        await params.refresh();
        params.setEntryTournament(selected);
        params.setEntryPasscode(selected.entryPasscode ?? "");
        setParticipantSelectModalOpen(false);
        params.setForceLoginCardsView(false);
        params.router.replace(`/participant?tournamentId=${selected.id}`);
      } catch (e) {
        params.setMessage((e as Error).message);
      }
    })();
  };

  const onObserverLogin = () => {
    if (!params.isLoginReady) {
      params.setMessage("まずはログインしてください。");
      params.setAuthModalState("login");
      return;
    }
    params.call(() => {
      params.ensureLoginCredentials();
      return api("/api/auth/observer", {
        method: "POST",
        body: JSON.stringify({ passcode: params.observerLoginPasscode }),
      });
    });
  };

  const onAdminLogin = () => {
    if (!params.isLoginReady) {
      params.setMessage("まずはログインしてください。");
      params.setAuthModalState("login");
      return;
    }
    (async () => {
      try {
        params.ensureLoginCredentials();
        const result = await api<{ user: Me; tournamentId: number }>("/api/auth/admin", {
          method: "POST",
          body: JSON.stringify({ passcode: params.adminPasscode }),
        });
        // /admin 遷移前に role を即時反映し、ガードによる誤リダイレクトを防ぐ
        params.setMe(result.user);
        params.setForceLoginCardsView(false);
        params.router.replace("/admin");
      } catch (e) {
        params.setMessage((e as Error).message);
      }
    })();
  };

  const onCreateTournament = async (setCreateModalOpen: (v: boolean) => void) => {
    try {
      params.ensureLoginCredentials();
      if (!params.createTournamentName) throw new Error("大会名を入力してください。");
      if (!params.createTournamentEntryPasscode || !params.createTournamentObserverPasscode) {
        throw new Error("大会/観戦パスコードを入力してください。");
      }
      const created = await api<{ tournamentId: number; adminPasscode: string }>("/api/tournaments/create", {
        method: "POST",
        body: JSON.stringify({
          name: params.createTournamentName,
          eventDate: params.createTournamentDate || null,
          timeSlot: params.createTournamentTimeSlot || null,
          courtCount: params.createTournamentCourtCount,
          entryPasscode: params.createTournamentEntryPasscode,
          observerPasscode: params.createTournamentObserverPasscode,
        }),
      });
      await params.refresh();
      params.setForceLoginCardsView(true);
      setCreateModalOpen(false);
      params.setMessage(`大会を追加しました。管理者パスコード: ${created.adminPasscode} をメモしてください。`);
    } catch (e) {
      params.setMessage((e as Error).message);
    }
  };

  return {
    entryModalOpen,
    setEntryModalOpen,
    participantSelectModalOpen,
    setParticipantSelectModalOpen,
    participantTournaments,
    onLogin,
    onSignup,
    onRequestCreateTournament: openCreateTournamentModal,
    onRequestEntryTournament,
    onEntryTournament,
    onCreateTournament,
    onParticipantOpen,
    onSelectParticipantTournament,
    onObserverLogin,
    onAdminLogin,
  };
}
