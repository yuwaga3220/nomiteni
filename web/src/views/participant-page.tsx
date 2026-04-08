// web/src/views/participant-page.tsx
// 参加者ページ

"use client";

import { useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { UserMenuSection } from "@/components/AppSections";
import { useNomiteni } from "@/context/NomiteniContext";
import { api } from "@/lib/client/api";

// 参加者ページ
export function ParticipantPage() {
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
    call,
  } = useNomiteni();
  // 参加者ログインチェック
  const allowed = Boolean(me && !forceLoginCardsView && me.role === "PARTICIPANT");
  // 参加者ログインチェック
  useLayoutEffect(() => {
    if (!allowed) router.replace("/");
  }, [allowed, router]);
  // 参加者ログインチェック
  if (!allowed || !me) return null;
  // 参加者ページを返す
  return (
    <UserMenuSection
      me={me}
      entryTournament={entryTournament}
      entryName={entryName}
      setEntryName={setEntryName}
      entryParty={entryParty}
      setEntryParty={setEntryParty}
      entryNote={entryNote}
      setEntryNote={setEntryNote}
      // エントリーを送信
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
  );
}
