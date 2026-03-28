import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";

type Role = "PARTICIPANT" | "ADMIN" | "OBSERVER";
type User = {
  id: number;
  name: string | null;
  checkedIn: boolean;
  canPlayToday: boolean | null;
  partyJoin: boolean;
  note: string | null;
};
type Me = User & { email: string; role: Role };
type Match = {
  id: number;
  tournamentId: number;
  round: number;
  position: number;
  player1Id: number | null;
  player2Id: number | null;
  winnerId: number | null;
  status: "PENDING" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED";
  courtNumber: number | null;
};
type Tournament = { id: number; name: string; status: string; matches: Match[] };
type PublicState = {
  users: User[];
  activeTournament: Tournament | null;
  courtCount: number;
};

const API = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const socket = io(API, { withCredentials: true, autoConnect: false });

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "通信に失敗しました");
  }
  return (await res.json()) as T;
}

function App() {
  const [me, setMe] = useState<Me | null>(null);
  const [state, setState] = useState<PublicState | null>(null);
  const [message, setMessage] = useState<string>("");

  const [participantLoginEmail, setParticipantLoginEmail] = useState("");
  const [entryPasscode, setEntryPasscode] = useState("");
  const [entryName, setEntryName] = useState("");
  const [entryParty, setEntryParty] = useState(false);
  const [entryNote, setEntryNote] = useState("");

  const [adminEmail, setAdminEmail] = useState("");
  const [adminPasscode, setAdminPasscode] = useState("");
  const [observerLoginPasscode, setObserverLoginPasscode] = useState("");
  const [observerSetPasscode, setObserverSetPasscode] = useState("");
  const [entrySetPasscode, setEntrySetPasscode] = useState("");
  const [tournamentName, setTournamentName] = useState("春シングルス大会");
  const [courtCountInput, setCourtCountInput] = useState(2);

  const usersById = useMemo(
    () => new Map((state?.users ?? []).map((u) => [u.id, u])),
    [state?.users],
  );
  const active = state?.activeTournament;
  const hasRunningTournament = active?.status === "RUNNING";
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
  const checkinState = (u: User): "UNANSWERED" | "READY" | "ABSENT" => {
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

  const groupedRounds = useMemo(() => {
    const map = new Map<number, Match[]>();
    for (const m of active?.matches ?? []) {
      map.set(m.round, [...(map.get(m.round) ?? []), m]);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [active?.matches]);

  return (
    <main className="container">
      <header className="appHeader">
        <h1>テニサー大会運営サービス Nomiteni</h1>
      </header>
      {message && <p className="message">{message}</p>}

      {!me && (
        <section className="grid2">
          <div className="card">
            <h2>参加者ログイン</h2>
            <input
              placeholder="メールアドレス"
              value={participantLoginEmail}
              onChange={(e) => setParticipantLoginEmail(e.target.value)}
            />
            <button
              onClick={() =>
                call(() =>
                  api("/api/auth/login", {
                    method: "POST",
                    body: JSON.stringify({ email: participantLoginEmail }),
                  }),
                )
              }
            >
              ログイン
            </button>
          </div>
          <div className="card">
            <h2>管理者ログイン</h2>
            <input placeholder="管理者メール" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
            <input
              placeholder="管理者パスコード"
              type="password"
              value={adminPasscode}
              onChange={(e) => setAdminPasscode(e.target.value)}
            />
            <button
              onClick={() =>
                call(() =>
                  api("/api/auth/admin-login", {
                    method: "POST",
                    body: JSON.stringify({ email: adminEmail, passcode: adminPasscode }),
                  }),
                )
              }
            >
              管理者ログイン
            </button>
          </div>
          <div className="card">
            <h2>観戦者ログイン（閲覧のみ）</h2>
            <input
              placeholder="観戦パスコード"
              type="password"
              value={observerLoginPasscode}
              onChange={(e) => setObserverLoginPasscode(e.target.value)}
            />
            <button
              onClick={() =>
                call(() =>
                  api("/api/auth/observer-login", {
                    method: "POST",
                    body: JSON.stringify({ passcode: observerLoginPasscode }),
                  }),
                )
              }
            >
              観戦者ログイン
            </button>
          </div>
        </section>
      )}

      {me && (
        <section className="card">
          <h2>
            {me.role === "ADMIN" ? "管理者メニュー" : me.role === "PARTICIPANT" ? "参加者メニュー" : "観戦者メニュー"}
          </h2>
          <p>
            ログイン中: {me.name} ({me.email})
          </p>
          <button onClick={() => call(() => api("/api/auth/logout", { method: "POST" }))}>ログアウト</button>

          {me.role === "PARTICIPANT" && (
            <div className="subgrid">
              <h3>大会エントリー</h3>
              <input
                placeholder="大会パスコード"
                type="password"
                value={entryPasscode}
                onChange={(e) => setEntryPasscode(e.target.value)}
              />
              <input placeholder="選手名" value={entryName} onChange={(e) => setEntryName(e.target.value)} />
              <label>
                <input type="checkbox" checked={entryParty} onChange={(e) => setEntryParty(e.target.checked)} />
                飲み会に参加する
              </label>
              <textarea placeholder="備考" value={entryNote} onChange={(e) => setEntryNote(e.target.value)} />
              <button
                onClick={() =>
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
              >
                エントリー情報を登録
              </button>
              <h3>当日チェックイン</h3>
              <button onClick={() => call(() => api("/api/checkin/self", { method: "POST", body: JSON.stringify({ canPlayToday: true }) }))}>
                参加する
              </button>
              <button
                onClick={() => call(() => api("/api/checkin/self", { method: "POST", body: JSON.stringify({ canPlayToday: false }) }))}
              >
                欠席する
              </button>
            </div>
          )}
        </section>
      )}

      {me?.role === "ADMIN" && (
        <section className="grid2">
          <div className="card">
            <h2>大会管理</h2>
            <input value={tournamentName} onChange={(e) => setTournamentName(e.target.value)} />
            <button
              disabled={hasRunningTournament}
              onClick={() =>
                call(() =>
                  api("/api/admin/tournaments", {
                    method: "POST",
                    body: JSON.stringify({ name: tournamentName }),
                  }),
                )
              }
            >
              トーナメント作成
            </button>
            {hasRunningTournament && <small>※進行中の大会が終了するまで作成できません！</small>}
            <div className="row">
              <input
                type="number"
                min={1}
                value={courtCountInput}
                onChange={(e) => setCourtCountInput(Number(e.target.value))}
              />
              <button
                onClick={() =>
                  call(() =>
                    api("/api/admin/settings/courts", {
                      method: "POST",
                      body: JSON.stringify({ courtCount: courtCountInput }),
                    }),
                  )
                }
              >
                コート数を保存
              </button>
            </div>
            <div className="row">
              <input
                type="password"
                placeholder="観戦用パスコード"
                value={observerSetPasscode}
                onChange={(e) => setObserverSetPasscode(e.target.value)}
              />
              <button
                onClick={() =>
                  call(() =>
                    api("/api/admin/tournaments/observer-passcode", {
                      method: "POST",
                      body: JSON.stringify({ passcode: observerSetPasscode }),
                    }),
                  )
                }
              >
                観戦用パスコードを設定
              </button>
            </div>
            <div className="row">
              <input
                type="password"
                placeholder="エントリー用パスコード"
                value={entrySetPasscode}
                onChange={(e) => setEntrySetPasscode(e.target.value)}
              />
              <button
                onClick={() =>
                  call(() =>
                    api("/api/admin/tournaments/entry-passcode", {
                      method: "POST",
                      body: JSON.stringify({ passcode: entrySetPasscode }),
                    }),
                  )
                }
              >
                エントリー用パスコードを設定
              </button>
            </div>
            {active?.status === "RUNNING" && (
              <div className="message">
                <strong>進行中の大会</strong>: {active.name} (ID: {active.id})
              </div>
            )}
          </div>
          <div className="card">
            <h2>参加者チェックイン（管理者操作）</h2>
            <div className="list">
              {(state?.users ?? []).map((u) => (
                <div key={u.id} className="listItem">
                  <span>{u.name}</span>
                  
                  <button
                    className={checkinState(u) === "READY" ? "activeStateButton" : "inactiveStateButton"}
                    onClick={() =>
                      call(() =>
                        api(`/api/admin/participants/${u.id}/checkin`, {
                          method: "POST",
                          body: JSON.stringify({ checkedIn: true, canPlayToday: true }),
                        }),
                      )
                    }
                  >
                    チェックイン済
                  </button>
                  
                  <button
                    className={checkinState(u) === "ABSENT" ? "activeStateButton" : "inactiveStateButton"}
                    onClick={() =>
                      call(() =>
                        api(`/api/admin/participants/${u.id}/checkin`, {
                          method: "POST",
                          body: JSON.stringify({ checkedIn: true, canPlayToday: false }),
                        }),
                      )
                    }
                  >
                    不参加（def）
                  </button>
                  <button
                    className={checkinState(u) === "UNANSWERED" ? "activeStateButton" : "inactiveStateButton"}
                    onClick={() =>
                      call(() =>
                        api(`/api/admin/participants/${u.id}/checkin`, {
                          method: "POST",
                          body: JSON.stringify({ checkedIn: false, canPlayToday: null }),
                        }),
                      )
                    }
                  >
                    未回答
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {me?.role === "ADMIN" && active && (
        <section className="card">
          <h2>試合運営</h2>
          {assignableMatches.map((m) => (
            <div className="matchRow" key={m.id}>
              <span>
                R{m.round}M{m.position}: {playerName(m.player1Id)} vs {playerName(m.player2Id)}
              </span>
              <select
                value={m.courtNumber ?? ""}
                onChange={(e) =>
                  call(() =>
                    api(`/api/admin/matches/${m.id}/assign`, {
                      method: "POST",
                      body: JSON.stringify({ courtNumber: Number(e.target.value) }),
                    }),
                  )
                }
              >
                <option value="">コート選択</option>
                {Array.from({ length: state?.courtCount ?? 1 }).map((_, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    コート {idx + 1}
                  </option>
                ))}
              </select>
              <button onClick={() => call(() => api(`/api/admin/matches/${m.id}/start`, { method: "POST" }))}>開始</button>
              <button
                onClick={() =>
                  call(() =>
                    api(`/api/admin/matches/${m.id}/result`, {
                      method: "POST",
                      body: JSON.stringify({ winnerId: m.player1Id }),
                    }),
                  )
                }
              >
                勝者: {playerName(m.player1Id)}
              </button>
              <button
                onClick={() =>
                  call(() =>
                    api(`/api/admin/matches/${m.id}/result`, {
                      method: "POST",
                      body: JSON.stringify({ winnerId: m.player2Id }),
                    }),
                  )
                }
              >
                勝者: {playerName(m.player2Id)}
              </button>
            </div>
          ))}
        </section>
      )}

      {me && me.role !== "PARTICIPANT" && (
        <section className="card">
          <h2>リアルタイム進行表示</h2>
          <p>コート数: {state?.courtCount ?? "-"}</p>
          <p>大会: {active ? `${active.name} (${active.status})` : "未作成"}</p>
          <h3>現在の試合</h3>
          <div className="list">
            {(active?.matches ?? [])
              .filter((m) => m.status === "ASSIGNED" || m.status === "IN_PROGRESS")
              .map((m) => (
                <div key={m.id} className="listItem">
                  <span>
                    コート{m.courtNumber}: {playerName(m.player1Id)} vs {playerName(m.player2Id)}
                  </span>
                  <strong>{matchStatusLabel(m.status)}</strong>
                </div>
              ))}
          </div>
          <h3>トーナメント表</h3>
          <div className="rounds">
            {groupedRounds.map(([round, matches]) => (
              <div key={round} className="round">
                <h4>{round}回戦</h4>
                {matches.map((m) => (
                  <div key={m.id} className="bracketCard">
                    <div className={m.winnerId === m.player1Id ? "winner" : ""}>{playerName(m.player1Id)}</div>
                    <div className={m.winnerId === m.player2Id ? "winner" : ""}>{playerName(m.player2Id)}</div>
                    <small>{matchStatusLabel(m.status)}</small>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

export default App;
