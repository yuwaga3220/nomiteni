// web/src/components/sections/TournamentBracketView.tsx
// react-tournament-brackets のラッパー
"use client";

import { useMemo } from "react";
import { Match, MATCH_STATES, SingleEliminationBracket, createTheme } from "@g-loot/react-tournament-brackets";
import { StyleSheetManager } from "styled-components";

type BracketMatchView = {
  topLabel: string;
  bottomLabel: string;
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
  resultText: null;
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

const lightBlueTheme = createTheme({
  textColor: {
    main: "#4f6f94",
    highlighted: "#4f6f94",
    dark: "#7f98b5",
  },
  matchBackground: {
    wonColor: "#f2f7ff",
    lostColor: "#f2f7ff",
  },
  score: {
    background: {
      wonColor: "#e6f0ff",
      lostColor: "#e6f0ff",
    },
    text: {
      highlightedWonColor: "#4f6f94",
      highlightedLostColor: "#4f6f94",
    },
  },
  border: {
    color: "#c8dbf2",
    highlightedColor: "#c8dbf2",
  },
  roundHeaders: {
    background: "#eef5ff",
  },
  connectorColor: "#bfd5f0",
  connectorColorHighlight: "#bfd5f0",
  canvasBackground: "#f8fbff",
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

        return {
          id,
          name: props.showMatchDescription === false ? "" : `${round.title} ${matchIndex + 1}`,
          nextMatchId,
          tournamentRoundText: round.title,
          startTime: "",
          state: MATCH_STATES.DONE,
          participants: [
            {
              id: `${id}-top`,
              name: match.topLabel,
              isWinner: false,
              status: null,
              resultText: null,
            },
            {
              id: `${id}-bottom`,
              name: match.bottomLabel,
              isWinner: false,
              status: null,
              resultText: null,
            },
          ],
        };
      }),
    );
  }, [props.bracketRounds, props.showMatchDescription]);

  if (!matches.length) return null;

  return (
    <div style={{ overflowX: "auto" }}>
      <StyleSheetManager
        shouldForwardProp={(prop, target) =>
          typeof target !== "string" || !["won", "hovered", "highlighted"].includes(prop)
        }
      >
        <SingleEliminationBracket
          matches={matches}
          matchComponent={Match}
          theme={lightBlueTheme}
          options={{
            style: {
              roundHeader: {
                isShown: props.showRoundHeaders ?? false,
                backgroundColor: lightBlueTheme.roundHeaders.background,
                fontColor: lightBlueTheme.textColor.main,
                fontSize: 16,
                roundTextGenerator,
              },
              connectorColor: lightBlueTheme.connectorColor,
              connectorColorHighlight: lightBlueTheme.connectorColorHighlight,
            },
          }}
        />
      </StyleSheetManager>
    </div>
  );
}
