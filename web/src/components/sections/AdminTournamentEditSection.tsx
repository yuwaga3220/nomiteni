"use client";

import { TournamentBracketView, type BracketRoundView } from "./TournamentBracketView";

type AdminTournamentEditProps = {
  bracketSize: number;
  bracketHeight: number;
  bracketRounds: BracketRoundView[];
};

// 管理者トーナメント編集セクションを返す
export function AdminTournamentEditSection(props: AdminTournamentEditProps) {
  return (
    <section className="card">
      <h2>トーナメント編集</h2>
      <TournamentBracketView
        bracketRounds={props.bracketRounds}
        showRoundHeaders={false}
        showMatchDescription={false}
      />
    </section>
  );
}
