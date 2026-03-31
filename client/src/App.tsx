import { useEffect, useMemo, useState } from "react";
import {
  AdminManagementSection,
  AdminMatchesSection,
  AuthModal,
  HeaderAuthButtons,
  LoginCardsSection,
  RealtimeSection,
  UserMenuSection,
} from "./components/AppSections";
import { api, socket } from "./lib/api";
import type { AuthMode, CheckinState, Match, Me, PublicState, TournamentBrief, User } from "./types";

function App() {
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
  const active = state?.activeTournament;
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
    refresh().catch((e: Error) => setMessage(e.message));
    socket.connect();
    socket.on("state:update", (next: PublicState) => setState(next));
    return () => {
      socket.off("state:update");
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

  // ログイン資格を確認
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

  return (
    <main className="container">
      <header className="appHeader">
        <h1>テニサー大会運営サービス Nomiteni</h1>
        <HeaderAuthButtons
          setAuthMode={setAuthMode}
          isLoginReady={isHeaderLoggedIn}
          loginEmail={me?.email ?? authEmail}
          onLogoutClick={onHeaderLogout}
        />
      </header>
      {(!me || forceLoginCardsView) && (
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
      )}
      {message && <p className="message">{message}</p>}

      {(!me || forceLoginCardsView) && (
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
      )}

      {me && !forceLoginCardsView && (
        <UserMenuSection
          me={me}
          entryTournament={entryTournament}
          entryName={entryName}
          setEntryName={setEntryName}
          entryParty={entryParty}
          setEntryParty={setEntryParty}
          entryNote={entryNote}
          setEntryNote={setEntryNote}
          onEntrySubmit={() =>
            call(() =>
              api("/api/entry/self", {
                method: "POST",
                body: JSON.stringify({
                  tournamentPasscode: entryPasscode,
                  name: entryName,
                  partyJoin: entryParty,
                  note: entryNote || undefined,
                }),
              }),
            )
          }
          onCheckinJoin={() => call(() => api("/api/checkin/self", { method: "POST", body: JSON.stringify({ canPlayToday: true }) }))}
          onCheckinAbsent={() => call(() => api("/api/checkin/self", { method: "POST", body: JSON.stringify({ canPlayToday: false }) }))}
          onLogout={() => call(() => api("/api/auth/logout", { method: "POST" }))}
        />
      )}

      {me?.role === "ADMIN" && (
        <AdminManagementSection
          active={active}
          state={state}
          tournamentName={tournamentName}
          setTournamentName={setTournamentName}
          tournamentDate={tournamentDate}
          setTournamentDate={setTournamentDate}
          tournamentTimeSlot={tournamentTimeSlot}
          setTournamentTimeSlot={setTournamentTimeSlot}
          courtCountInput={courtCountInput}
          setCourtCountInput={setCourtCountInput}
          observerSetPasscode={observerSetPasscode}
          setObserverSetPasscode={setObserverSetPasscode}
          entrySetPasscode={entrySetPasscode}
          setEntrySetPasscode={setEntrySetPasscode}
          checkinState={checkinState}
          onSaveTournamentSettings={() =>
            call(() =>
              api("/api/admin/tournaments/settings", {
                method: "POST",
                body: JSON.stringify({
                  name: tournamentName,
                  eventDate: tournamentDate || null,
                  timeSlot: tournamentTimeSlot || null,
                  courtCount: courtCountInput,
                  entryPasscode: entrySetPasscode,
                  observerPasscode: observerSetPasscode,
                }),
              }),
            )
          }
          onSetReady={(id: number) =>
            call(() =>
              api(`/api/admin/participants/${id}/checkin`, {
                method: "POST",
                body: JSON.stringify({ checkedIn: true, canPlayToday: true }),
              }),
            )
          }
          onSetAbsent={(id: number) =>
            call(() =>
              api(`/api/admin/participants/${id}/checkin`, {
                method: "POST",
                body: JSON.stringify({ checkedIn: true, canPlayToday: false }),
              }),
            )
          }
          onSetUnanswered={(id: number) =>
            call(() =>
              api(`/api/admin/participants/${id}/checkin`, {
                method: "POST",
                body: JSON.stringify({ checkedIn: false, canPlayToday: null }),
              }),
            )
          }
        />
      )}

      {me?.role === "ADMIN" && active && (
        <AdminMatchesSection
          state={state}
          matches={assignableMatches}
          playerName={playerName}
          onAssignCourt={(matchId, courtNumber) =>
            call(() =>
              api(`/api/admin/matches/${matchId}/assign`, {
                method: "POST",
                body: JSON.stringify({ courtNumber }),
              }),
            )
          }
          onStart={(matchId) => call(() => api(`/api/admin/matches/${matchId}/start`, { method: "POST" }))}
          onWin={(matchId, winnerId) =>
            call(() =>
              api(`/api/admin/matches/${matchId}/result`, {
                method: "POST",
                body: JSON.stringify({ winnerId }),
              }),
            )
          }
        />
      )}

      {me && me.role !== "PARTICIPANT" && (
        <RealtimeSection
          active={active}
          state={state}
          groupedRounds={groupedRounds}
          playerName={playerName}
          matchStatusLabel={matchStatusLabel}
        />
      )}
    </main>
  );
}

export default App;
