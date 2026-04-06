// web/src/views/home-page.tsx
// ホームページ
"use client";

import { useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthModal, LoginCardsSection } from "@/components/AppSections";
import { useNomiteni } from "@/context/NomiteniContext";
import { api } from "@/lib/api";
import type { TournamentBrief } from "@/types";

// ホームページ
export function HomePage() {
  // ルーターを取得
  const router = useRouter();
  // コンテキストを取得
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

  // ホームページから移動するかどうか
  const shouldLeaveHome = Boolean(me && !forceLoginCardsView);

  // マウント時の初期ページ遷移
  useLayoutEffect(() => {
    if (!shouldLeaveHome || !me) return;
    // 移動先を設定
    const target =
      me.role === "PARTICIPANT" ? "/participant" : me.role === "ADMIN" ? "/admin" : "/observer";
    // 移動先に移動
    router.replace(target);
  }, [shouldLeaveHome, me, router]); // マウント時に一度だけ実行

  // 移動する場合
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
        onLogin={() => { // ログインボタンをクリックした場合
          if (!authEmail || !authPassword) {
            setMessage("ログイン用のメールアドレスとパスワードを入力してください。");
            return;
          }
          setMessage("ログイン情報を入力しました。下のボタンで参加者/管理者/観戦者を選択してください。");
          setAuthMode("none"); // 認証モードをリセット
        }}
        onSignup={() => // サインアップボタンをクリックした場合
          call(async () => {
            if (!authEmail || !authPassword) {
              throw new Error("サインアップ用のメールアドレスとパスワードを入力してください。");
            }
            await api("/api/auth/signup", {
              method: "POST",
              body: JSON.stringify({ email: authEmail, password: authPassword }),
            });
            setAuthMode("none"); // 認証モードをリセット
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
        onRequestCreateTournament={() => { // 大会作成ボタンをクリックした場合
          if (!isLoginReady) {
            setMessage("まずはログインしてください。");
            setAuthMode("login"); // 認証モードをログインに設定
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
        onParticipantLogin={() => // 参加者ログインボタンをクリックした場合
          call(async () => {
            ensureLoginCredentials(); // ログイン資格を確認
            if (!entryPasscode) throw new Error("大会パスコードを入力してください。");
            await api("/api/auth/login", { // APIを呼び出し、ログイン
              method: "POST",
              body: JSON.stringify({ email: authEmail, password: authPassword }),
            });
            const preview = await api<{ tournament: TournamentBrief }>("/api/entry/preview", { // APIを呼び出し、大会情報を取得
              method: "POST",
              body: JSON.stringify({ tournamentPasscode: entryPasscode }),
            });
            setEntryTournament(preview.tournament); 
            setForceLoginCardsView(false);
          })
        }
        onAdminLogin={() => // 管理者ログインボタンをクリックした場合
          call(() => {
            ensureLoginCredentials();
            return api("/api/auth/admin-login", { // APIを呼び出し、管理者ログイン
              method: "POST",
              body: JSON.stringify({ email: authEmail, password: authPassword, passcode: adminPasscode }),
            });
          })
        }
        onObserverLogin={() => // 観戦者ログインボタンをクリックした場合
          call(() => {
            ensureLoginCredentials();
            return api("/api/auth/observer-login", { // APIを呼び出し、観戦者ログイン
              method: "POST",
              body: JSON.stringify({ email: authEmail, password: authPassword, passcode: observerLoginPasscode }),
            });
          })
        }
        onCreateTournament={() => // 大会作成ボタンをクリックした場合
          (async () => {
            try {
              ensureLoginCredentials();
              if (!createTournamentName) throw new Error("大会名を入力してください。");
              if (!createTournamentEntryPasscode || !createTournamentObserverPasscode) {
                throw new Error("大会/観戦パスコードを入力してください。");
              }
              await api("/api/auth/login", { // APIを呼び出し、ログイン
                method: "POST",
                body: JSON.stringify({ email: authEmail, password: authPassword }),
              });
              // APIを呼び出し、大会を作成
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
