// web/src/components/sections/AdminTournamentBracketSection.tsx
// 管理者トーナメント編集セクション
"use client";

import { TournamentBracketView, type BracketRoundView } from "./TournamentBracketView";

type AdminTournamentBracketProps = {
  bracketSize: number;
  bracketHeight: number;
  bracketRounds: BracketRoundView[];
};

// 管理者トーナメント編集セクションを返す
export function AdminTournamentBracketSection(props: AdminTournamentBracketProps) {
  return (
    <section className="card">
      <h2>トーナメント編集</h2>
      <TournamentBracketView bracketRounds={props.bracketRounds} showRoundHeaders={false} />
    </section>
  );
}
