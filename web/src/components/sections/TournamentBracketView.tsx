// web/src/components/sections/TournamentBracketView.tsx
// react-tournament-brackets のラッパー
"use client";

import { useMemo } from "react";
import { Match, MATCH_STATES, SingleEliminationBracket, createTheme } from "@g-loot/react-tournament-brackets";

type BracketMatchView = {
  topLabel: string;
  bottomLabel: string;
  topId?: number | null;
  bottomId?: number | null;
  winnerId?: number | null;
};

export type BracketRoundView = {
  title: string;
  matches: BracketMatchView[];
  isFinal: boolean;
  isSemifinal: boolean;
  matchGap: number;
  verticalPadding: number;
};

type TournamentBracketViewProps = {
  bracketRounds: BracketRoundView[];
  showRoundHeaders?: boolean;
  showMatchDescription?: boolean;
};

type LibMatchParticipant = {
  id: string;
  name: string;
  isWinner: boolean;
  status: null;
  resultText: string | null;
};

type LibMatch = {
  id: string;
  name: string;
  nextMatchId: string | null;
  tournamentRoundText: string;
  startTime: string;
  state: string;
  participants: [LibMatchParticipant, LibMatchParticipant];
};

const lightGreenTheme = createTheme({
  textColor: {
    main: "#36542e",
    highlighted: "#2f4a28",
    dark: "#5d7b52",
  },
  matchBackground: {
    wonColor: "#f3f9ea",
    lostColor: "#f3f9ea",
  },
  score: {
    background: {
      wonColor: "#dceccc",
      lostColor: "#dceccc",
    },
    text: {
      highlightedWonColor: "#325a2a",
      highlightedLostColor: "#325a2a",
    },
  },
  border: {
    color: "#a9c58c",
    highlightedColor: "#84a766",
  },
  roundHeaders: {
    background: "#e9f5dc",
  },
  connectorColor: "#7fa35f",
  connectorColorHighlight: "#6d934f",
  canvasBackground: "#f4faef",
});

function roundTextGenerator(currentRound: number, totalRounds: number): string {
  if (currentRound === totalRounds) return "決勝";
  if (currentRound === totalRounds - 1) return "準決勝";
  return `${currentRound}回戦`;
}

// ブラケット描画コンポーネント
export function TournamentBracketView(props: TournamentBracketViewProps) {
  // 試合を作成
  const matches = useMemo<LibMatch[]>(() => {
    const roundCount = props.bracketRounds.length;
    return props.bracketRounds.flatMap((round, roundIndex) =>
      round.matches.map((match, matchIndex) => {
        const id = `R${roundIndex + 1}-M${matchIndex + 1}`;
        const isFinalRound = roundIndex === roundCount - 1;
        const nextMatchId = isFinalRound
          ? null
          : `R${roundIndex + 2}-M${Math.floor(matchIndex / 2) + 1}`;
        const topWon = match.topId != null && match.winnerId === match.topId;
        const bottomWon = match.bottomId != null && match.winnerId === match.bottomId;

        return {
          id,
          name: props.showMatchDescription === false ? "" : `${round.title} 第${matchIndex + 1}試合`,
          nextMatchId,
          tournamentRoundText: round.title,
          startTime: "",
          state: MATCH_STATES.DONE,
          participants: [
            {
              id: `${id}-top`,
              name: match.topLabel,
              isWinner: topWon,
              status: null,
              resultText: topWon ? "勝" : null,
            },
            {
              id: `${id}-bottom`,
              name: match.bottomLabel,
              isWinner: bottomWon,
              status: null,
              resultText: bottomWon ? "勝" : null,
            },
          ],
        };
      }),
    );
  }, [props.bracketRounds, props.showMatchDescription]);

  if (!matches.length) return null;

  return (
    <div className="bracketViewport">
      <SingleEliminationBracket
        matches={matches}
        matchComponent={Match}
        theme={lightGreenTheme}
        options={{
          style: {
            roundHeader: {
              isShown: props.showRoundHeaders ?? false,
              backgroundColor: lightGreenTheme.roundHeaders.background,
              fontColor: lightGreenTheme.textColor.main,
              fontSize: 16,
              roundTextGenerator,
            },
            connectorColor: lightGreenTheme.connectorColor,
            connectorColorHighlight: lightGreenTheme.connectorColorHighlight,
          },
        }}
      />
    </div>
  );
}
