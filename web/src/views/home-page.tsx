/**
 * ホームページ
 */
"use client";

import { useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthModal, LoginCardsSection } from "@/components/AppSections";
import { useNomiteni } from "@/context/NomiteniContext";
import { api } from "@/lib/api";
import type { TournamentBrief } from "@/types";

export function HomePage() {
  const router = useRouter();
  const {
    me,
    forceLoginCardsView,
    authMode,
    setAuthMode,
    authEmail,
    setAuthEmail,
    authPassword,
    setAuthPassword,
    entryPasscode,
    setEntryPasscode,
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
    active,
    isLoginReady,
    setMessage,
    setEntryTournament,
    setForceLoginCardsView,
    call,
    ensureLoginCredentials,
    refresh,
  } = useNomiteni();

  const shouldLeaveHome = Boolean(me && !forceLoginCardsView);

  useLayoutEffect(() => {
    if (!shouldLeaveHome || !me) return;
    const target =
      me.role === "PARTICIPANT" ? "/participant" : me.role === "ADMIN" ? "/admin" : "/observer";
    router.replace(target);
  }, [shouldLeaveHome, me, router]);

  if (shouldLeaveHome) {
    return <p className="message">ログイン先の画面へ移動しています…</p>;
  }

  return (
    <>
      <AuthModal
        authMode={authMode}
        setAuthMode={setAuthMode}
        authEmail={authEmail}
        setAuthEmail={setAuthEmail}
        authPassword={authPassword}
        setAuthPassword={setAuthPassword}
        onLogin={() => {
          if (!authEmail || !authPassword) {
            setMessage("ログイン用のメールアドレスとパスワードを入力してください。");
            return;
          }
          setMessage("ログイン情報を入力しました。下のボタンで参加者/管理者/観戦者を選択してください。");
          setAuthMode("none");
        }}
        onSignup={() =>
          call(async () => {
            if (!authEmail || !authPassword) {
              throw new Error("サインアップ用のメールアドレスとパスワードを入力してください。");
            }
            await api("/api/auth/signup", {
              method: "POST",
              body: JSON.stringify({ email: authEmail, password: authPassword }),
            });
            setAuthMode("none");
          })
        }
      />
      <LoginCardsSection
        tournamentPasscode={entryPasscode}
        setTournamentPasscode={setEntryPasscode}
        adminPasscode={adminPasscode}
        setAdminPasscode={setAdminPasscode}
        observerLoginPasscode={observerLoginPasscode}
        setObserverLoginPasscode={setObserverLoginPasscode}
        onRequestCreateTournament={() => {
          if (!isLoginReady) {
            setMessage("まずはログインしてください。");
            setAuthMode("login");
            return;
          }
          setCreateModalOpen(true);
        }}
        createModalOpen={createModalOpen}
        setCreateModalOpen={setCreateModalOpen}
        createTournamentName={createTournamentName}
        setCreateTournamentName={setCreateTournamentName}
        createTournamentDate={createTournamentDate}
        setCreateTournamentDate={setCreateTournamentDate}
        createTournamentTimeSlot={createTournamentTimeSlot}
        setCreateTournamentTimeSlot={setCreateTournamentTimeSlot}
        createTournamentCourtCount={createTournamentCourtCount}
        setCreateTournamentCourtCount={setCreateTournamentCourtCount}
        createTournamentEntryPasscode={createTournamentEntryPasscode}
        setCreateTournamentEntryPasscode={setCreateTournamentEntryPasscode}
        createTournamentObserverPasscode={createTournamentObserverPasscode}
        setCreateTournamentObserverPasscode={setCreateTournamentObserverPasscode}
        activeTournament={active}
        onParticipantLogin={() =>
          call(async () => {
            ensureLoginCredentials();
            if (!entryPasscode) throw new Error("大会パスコードを入力してください。");
            await api("/api/auth/login", {
              method: "POST",
              body: JSON.stringify({ email: authEmail, password: authPassword }),
            });
            const preview = await api<{ tournament: TournamentBrief }>("/api/entry/preview", {
              method: "POST",
              body: JSON.stringify({ tournamentPasscode: entryPasscode }),
            });
            setEntryTournament(preview.tournament);
            setForceLoginCardsView(false);
          })
        }
        onAdminLogin={() =>
          call(() => {
            ensureLoginCredentials();
            return api("/api/auth/admin-login", {
              method: "POST",
              body: JSON.stringify({ email: authEmail, password: authPassword, passcode: adminPasscode }),
            });
          })
        }
        onObserverLogin={() =>
          call(() => {
            ensureLoginCredentials();
            return api("/api/auth/observer-login", {
              method: "POST",
              body: JSON.stringify({ email: authEmail, password: authPassword, passcode: observerLoginPasscode }),
            });
          })
        }
        onCreateTournament={() =>
          (async () => {
            try {
              ensureLoginCredentials();
              if (!createTournamentName) throw new Error("大会名を入力してください。");
              if (!createTournamentEntryPasscode || !createTournamentObserverPasscode) {
                throw new Error("大会/観戦パスコードを入力してください。");
              }
              await api("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({ email: authEmail, password: authPassword }),
              });
              const created = await api<{ tournamentId: number; adminPasscode: string }>("/api/tournaments/create", {
                method: "POST",
                body: JSON.stringify({
                  name: createTournamentName,
                  eventDate: createTournamentDate || null,
                  timeSlot: createTournamentTimeSlot || null,
                  courtCount: createTournamentCourtCount,
                  entryPasscode: createTournamentEntryPasscode,
                  observerPasscode: createTournamentObserverPasscode,
                }),
              });
              await refresh();
              setForceLoginCardsView(true);
              setCreateModalOpen(false);
              setMessage(`大会を追加しました。管理者パスコード: ${created.adminPasscode} をメモしてください。`);
            } catch (e) {
              setMessage((e as Error).message);
            }
          })()
        }
      />
    </>
  );
}
