// web/src/views/observer-page.tsx
// 観戦ページ

"use client";

import { useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { ObserveSection } from "@/components/AppSections";
import { useNomiteni } from "@/context/NomiteniContext";

// 観戦ページ
export function ObserverPage() {
  // ルーターを取得
  const router = useRouter();
  // コンテキストを取得
  const {
    me,
    forceLoginCardsView,
    sessionTournamentId,
    state,
    active,
    groupedRounds,
    playerName,
    matchStatusLabel,
  } = useNomiteni();

  const allowed = Boolean(!me && !forceLoginCardsView && sessionTournamentId && active);
  // 観戦パスコードチェック
  useLayoutEffect(() => {
    if (!allowed) router.replace("/");
  }, [allowed, router]);

  // 観戦パスコードチェック
  if (!allowed) return null;

  // 観戦ページを返す
  return (
    <>
      <section className="card">
        <h2>観戦ページ</h2>
        <br />
        <button onClick={() => router.push("/")}>戻る</button>
      </section>
      <ObserveSection
        active={active}
        state={state}
        groupedRounds={groupedRounds}
        playerName={playerName}
        matchStatusLabel={matchStatusLabel}
      />
    </>
  );
}
