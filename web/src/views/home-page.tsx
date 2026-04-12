// web/src/views/home-page.tsx
// ホームページ
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthModal, LoginCardsSection } from "@/components/AppSections";
import { useNomiteni } from "@/context/NomiteniContext";
import { api } from "@/lib/client/api";
import type { TournamentBrief } from "@/types";

// ホームページ
export function HomePage() {
  // ルーターを取得
  const router = useRouter();
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [participantSelectModalOpen, setParticipantSelectModalOpen] = useState(false);
  const [participantTournaments, setParticipantTournaments] = useState<TournamentBrief[]>([]);
  // コンテキストを取得
  const {
    authModalState,
    setAuthModalState,
    authEmail,
    setAuthEmail,
    authPassword,
    setAuthPassword,
    entryPasscode,
    setEntryPasscode,
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
    active,
    isLoginReady,
    setMessage,
    setEntryTournament,
    setForceLoginCardsView,
    call,
    ensureLoginCredentials,
    refresh,
  } = useNomiteni();

  // ホームに来たら、セッションを（scope: login、tournamentId なし）に揃える
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await api("/api/auth/session/home", { method: "POST" });
        if (!cancelled) await refresh();
      } catch {
        // 未ログインなどは無視
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- マウント時のみ
  }, []);

  // AuthModalとLoginCardsSectionを返す
  return (
    <>
      <AuthModal
        authModalState={authModalState}
        setAuthModalState={setAuthModalState}
        authEmail={authEmail}
        setAuthEmail={setAuthEmail}
        authPassword={authPassword}
        setAuthPassword={setAuthPassword}
        onLogin={async () => { // ログインボタンをクリックした場合
          await call(async () => {
            if (!authEmail || !authPassword) {
              setMessage("ログイン用のメールアドレスとパスワードを入力してください。");
              return;
            }
            await api("/api/auth/login", {
              method: "POST",
              body: JSON.stringify({ email: authEmail, password: authPassword})
            })
            setMessage("ログイン情報を入力しました。下のボタンで参加者/管理者/観戦者を選択してください。");
            setAuthModalState("none"); // モーダルを閉じる
          })
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
            setAuthModalState("none"); // モーダルを閉じる
          })
        }
      />
      <LoginCardsSection // ログインカードセクション
        tournamentPasscode={entryPasscode}
        setTournamentPasscode={setEntryPasscode}
        entryName={entryName}
        setEntryName={setEntryName}
        entryParty={entryParty}
        setEntryParty={setEntryParty}
        entryNote={entryNote}
        setEntryNote={setEntryNote}
        adminPasscode={adminPasscode}
        setAdminPasscode={setAdminPasscode}
        observerLoginPasscode={observerLoginPasscode}
        setObserverLoginPasscode={setObserverLoginPasscode}
        entryModalOpen={entryModalOpen}
        setEntryModalOpen={setEntryModalOpen}
        participantSelectModalOpen={participantSelectModalOpen}
        setParticipantSelectModalOpen={setParticipantSelectModalOpen}
        participantTournaments={participantTournaments}
        onSelectParticipantTournament={(tournamentId) => {
          const selected = participantTournaments.find((t) => t.id === tournamentId);
          if (!selected) return;
          (async () => {
            try {
              await api("/api/participant/select-tournament", {
                method: "POST",
                body: JSON.stringify({ tournamentId }),
              });
              await refresh();
              setEntryTournament(selected);
              setEntryPasscode(selected.entryPasscode ?? "");
              setParticipantSelectModalOpen(false);
              setForceLoginCardsView(false);
              router.replace(`/participant?tournamentId=${selected.id}`);
            } catch (e) {
              setMessage((e as Error).message);
            }
          })();
        }}
        onRequestCreateTournament={() => { // 大会作成ボタンをクリックした場合
          if (!isLoginReady) {
            setMessage("まずはログインしてください。");
            setAuthModalState("login"); // 認証モードをログインに設定
            return;
          }
          setCreateModalOpen(true); // 大会作成モーダルを開く
        }}
        onRequestEntryTournament={() => {
          if (!isLoginReady) {
            setMessage("まずはログインしてください。");
            setAuthModalState("login");
            return;
          }
          setEntryModalOpen(true);
        }}
        onEntryTournament={() => {
          (async () => {
            try {
              ensureLoginCredentials();
              if (!entryPasscode) throw new Error("大会パスコードを入力してください。");
              if (!entryName) throw new Error("選手名を入力してください。");
              await api("/api/entry/self", {
                method: "POST",
                body: JSON.stringify({
                  tournamentPasscode: entryPasscode,
                  name: entryName,
                  partyJoin: entryParty,
                  note: entryNote || undefined,
                }),
              });
              // APIを呼び出し、大会情報を取得
              const preview = await api<{ tournament: TournamentBrief }>("/api/entry/preview", {
                method: "POST",
                body: JSON.stringify({ tournamentPasscode: entryPasscode }),
              });
              await refresh();
              setEntryTournament(preview.tournament);
              setEntryModalOpen(false);
              setForceLoginCardsView(false);
              router.replace(`/participant?tournamentId=${preview.tournament.id}`);
            } catch (e) {
              setMessage((e as Error).message);
            }
          })();
        }}
        onCreateTournament={() => // モーダル内の大会作成ボタンをクリックした場合
          (async () => {
            try {
              ensureLoginCredentials();
              if (!createTournamentName) throw new Error("大会名を入力してください。");
              if (!createTournamentEntryPasscode || !createTournamentObserverPasscode) {
                throw new Error("大会/観戦パスコードを入力してください。");
              }
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
        onParticipantOpen={() => {// 参加者ページへ移動ボタンをクリックした場合
          if (!isLoginReady) {
            setMessage("まずはログインしてください。");
            setAuthModalState("login"); // 認証モードをログインに設定
            return;
          }
          (async () => {
            try {
              ensureLoginCredentials(); // ログイン資格を確認
              setForceLoginCardsView(true);
              const result = await api<{ tournaments: TournamentBrief[] }>("/api/participant/tournaments");
              if (!result.tournaments.length) {
                throw new Error("参加者として紐づく大会がありません。管理者に参加者登録を依頼してください。");
              }
              setParticipantTournaments(result.tournaments);
              setParticipantSelectModalOpen(true);
            } catch (e) {
              setMessage((e as Error).message);
            }
          })();
        }
        }
        onObserverLogin={() => {// 観戦者ログインボタンをクリックした場合
          if (!isLoginReady) {
            setMessage("まずはログインしてください。");
            setAuthModalState("login"); // 認証モードをログインに設定
            return;
          }
          call(() => {
            ensureLoginCredentials();
            return api("/api/auth/observer", {
              method: "POST",
              body: JSON.stringify({ passcode: observerLoginPasscode }),
            });
          })
        } }
        onAdminLogin={() => {// 管理者ログインボタンをクリックした場合
          if (!isLoginReady) {
            setMessage("まずはログインしてください。");
            setAuthModalState("login"); // 認証モードをログインに設定
            return;
          }
          call(() => {
            ensureLoginCredentials();
            return api("/api/auth/admin", {
              method: "POST",
              body: JSON.stringify({ passcode: adminPasscode }),
            });
          })
        } }
      />
    </>
  );
}
