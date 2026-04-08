// web/src/views/observer-page.tsx
// 観戦者ページ

"use client";

import { useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { RealtimeSection, UserMenuSection } from "@/components/AppSections";
import { useNomiteni } from "@/context/NomiteniContext";
import { api } from "@/lib/client/api";

// 観戦者ページ
export function ObserverPage() {
  // ルーターを取得
  const router = useRouter();
  // コンテキストを取得
  const {
    me,
    forceLoginCardsView,
    entryTournament,
    entryName,
    setEntryName,
    entryParty,
    setEntryParty,
    entryNote,
    setEntryNote,
    entryPasscode,
    state,
    active,
    groupedRounds,
    playerName,
    matchStatusLabel,
    call,
  } = useNomiteni();

  const allowed = Boolean(me && !forceLoginCardsView && me.role === "OBSERVER");
  // 観戦者ログインチェック
  useLayoutEffect(() => {
    if (!allowed) router.replace("/");
  }, [allowed, router]);

  // 観戦者ログインチェック
  if (!allowed || !me) return null;

  // 観戦者ページを返す
  return (
    <>
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
      <RealtimeSection
        active={active}
        state={state}
        groupedRounds={groupedRounds}
        playerName={playerName}
        matchStatusLabel={matchStatusLabel}
      />
    </>
  );
}
