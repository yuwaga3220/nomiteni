"use client";

import { useMemo } from "react";
import type { TournamentParticipant } from "@/types";

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

type UseAdminBracketPreviewParams = {
  tournamentParticipants: TournamentParticipant[];
};

// ブラケットプレビューを取得
export function useAdminBracketPreview(params: UseAdminBracketPreviewParams) {
  const baseMatchHeight = 74;
  const baseMatchGap = 12;
  const baseCenterDistance = baseMatchHeight + baseMatchGap;

  const bracketSize = useMemo(
    () =>
      Math.max(1, 2 ** Math.ceil(Math.log2(Math.max(1, params.tournamentParticipants.length)))),
    [params.tournamentParticipants.length],
  );

  const normalizedParticipants = useMemo(
    () =>
      params.tournamentParticipants
        .map((participant) => ({
          ...participant,
          normalizedPosition: participant.initialPosition ?? Number.MAX_SAFE_INTEGER,
        }))
        .sort((a, b) => {
          if (a.normalizedPosition !== b.normalizedPosition) return a.normalizedPosition - b.normalizedPosition;
          return a.id - b.id;
        }),
    [params.tournamentParticipants],
  );

  const bracketRounds = useMemo<BracketRoundView[]>(() => {
    const seededParticipants = Array.from(
      { length: bracketSize },
      (_, index) => normalizedParticipants[index] ?? null,
    );

    if (bracketSize === 1) {
      return [
        {
          title: "決勝",
          isFinal: true,
          isSemifinal: false,
          matchGap: baseMatchGap,
          verticalPadding: 0,
          matches: [
            {
              topLabel: `#1 ${seededParticipants[0]?.name ?? "BYE"}`,
              bottomLabel: "BYE",
            },
          ],
        },
      ];
    }

    const totalRounds = Math.log2(bracketSize);
    return Array.from({ length: totalRounds }, (_, roundIndex) => {
      const matchCount = bracketSize / 2 ** (roundIndex + 1);
      const title =
        roundIndex === totalRounds - 1
          ? "決勝"
          : roundIndex === totalRounds - 2
            ? "準決勝"
            : `R${roundIndex + 1}`;
      const isFinal = roundIndex === totalRounds - 1;
      const isSemifinal = roundIndex === totalRounds - 2;
      const matchGap =
        roundIndex === 0
          ? baseMatchGap
          : baseCenterDistance * 2 ** roundIndex - baseMatchHeight;
      const verticalPadding = roundIndex === 0 ? 0 : (baseCenterDistance * 2 ** (roundIndex - 1)) / 2;
      const matches = Array.from({ length: matchCount }, (_, matchIndex) => {
        if (roundIndex === 0) {
          const topSeed = matchIndex * 2 + 1;
          const bottomSeed = topSeed + 1;
          return {
            topLabel: `#${topSeed} ${seededParticipants[topSeed - 1]?.name ?? "BYE"}`,
            bottomLabel: `#${bottomSeed} ${seededParticipants[bottomSeed - 1]?.name ?? "BYE"}`,
          };
        }

        const topSourceMatch = matchIndex * 2 + 1;
        const bottomSourceMatch = topSourceMatch + 1;
        const sourceRoundLabel = roundIndex === 1 ? "1回戦" : `R${roundIndex}`;
        return {
          topLabel: `${sourceRoundLabel} 第${topSourceMatch}試合 勝者`,
          bottomLabel: `${sourceRoundLabel} 第${bottomSourceMatch}試合 勝者`,
        };
      });

      return { title, matches, isFinal, isSemifinal, matchGap, verticalPadding };
    });
  }, [baseCenterDistance, baseMatchGap, bracketSize, normalizedParticipants]);

  const bracketHeight = useMemo(() => Math.max(160, bracketSize * 56), [bracketSize]);

  return {
    bracketSize,
    bracketRounds,
    bracketHeight,
  };
}
