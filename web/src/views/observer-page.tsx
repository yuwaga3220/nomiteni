// web/src/views/observer-page.tsx
// 観戦者ページ

"use client";

import { useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { RealtimeSection } from "@/components/AppSections";
import { useNomiteni } from "@/context/NomiteniContext";

// 観戦者ページ
export function ObserverPage() {
  // ルーターを取得
  const router = useRouter();
  // コンテキストを取得
  const {
    me,
    forceLoginCardsView,
    state,
    active,
    groupedRounds,
    playerName,
    matchStatusLabel,
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
      <section className="card">
        <h2>観戦者メニュー</h2>
        <p>
          ログイン中: {me.name} ({me.email})
        </p>
        <br />
        <button onClick={() => router.push("/")}>戻る</button>
      </section>
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
