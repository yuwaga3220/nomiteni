"use client";

import { useMemo } from "react";
import { api } from "@/lib/client/api";
import type { TournamentParticipant } from "@/types";

type UseAdminActionsParams = {
  call: (fn: () => Promise<unknown>) => Promise<void>;
  tournamentName: string;
  tournamentDate: string;
  tournamentTimeSlot: string;
  courtCountInput: number;
  entrySetPasscode: string;
  observerSetPasscode: string;
  tournamentParticipants: TournamentParticipant[];
};

type BracketMatchView = {
  topLabel: string;
  bottomLabel: string;
};

type BracketRoundView = {
  title: string;
  matches: BracketMatchView[];
  isFinal: boolean;
  isSemifinal: boolean;
  matchGap: number;
  verticalPadding: number;
};

// 管理者アクションを返す
export function useAdminActions(params: UseAdminActionsParams) {
  const baseMatchHeight = 74;
  const baseMatchGap = 12;
  const baseCenterDistance = baseMatchHeight + baseMatchGap;
  const bracketSize = useMemo( // トーナメントの足の数を計算
    () => Math.max(1, 2 ** Math.ceil(Math.log2(Math.max(1, params.tournamentParticipants.length)))),
    [params.tournamentParticipants.length],
  );
  const normalizedParticipants = useMemo( // 参加者を位置でソート
    () =>
      params.tournamentParticipants
        .map((participant) => ({
          ...participant,
          normalizedPosition: participant.initialPosition ?? Number.MAX_SAFE_INTEGER,
        }))
        .sort((a, b) => {
          if (a.normalizedPosition !== b.normalizedPosition) return a.normalizedPosition - b.normalizedPosition;
          return a.userId - b.userId; // 位置が同じの場合はIDでソート
        }),
    [params.tournamentParticipants],
  );
  // トーナメント表を生成
  const bracketRounds = useMemo<BracketRoundView[]>(() => {
    const seededParticipants = Array.from( // 参加者数が枠数に足りない分をnullで埋める
      { length: bracketSize },
      (_, index) => normalizedParticipants[index] ?? null,
    );
    if (bracketSize === 1) { // 足の数が1の場合は決勝戦のみ
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


    const totalRounds = Math.log2(bracketSize); // 何回戦まであるかを計算
    return Array.from({ length: totalRounds }, (_, roundIndex) => { // ラウンドを生成
      const matchCount = bracketSize / 2 ** (roundIndex + 1);
      const title = // ラウンドタイトルを計算
        roundIndex === totalRounds - 1
          ? "決勝"
          : roundIndex === totalRounds - 2
            ? "準決勝"
            : `R${roundIndex + 1}`;
      const isFinal = roundIndex === totalRounds - 1;
      const isSemifinal = roundIndex === totalRounds - 2;
      const matchGap = roundIndex === 0
        ? baseMatchGap
        : baseCenterDistance * 2 ** roundIndex - baseMatchHeight;
      const verticalPadding = roundIndex === 0 ? 0 : (baseCenterDistance * 2 ** (roundIndex - 1)) / 2;
      const matches = Array.from( // 試合を生成
        { length: matchCount }, 
        (_, matchIndex) => {
        if (roundIndex === 0) { // 1回戦の場合はシード参加者を割り当て
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
  // トーナメント表の高さを計算
  const bracketHeight = useMemo(() => Math.max(160, bracketSize * 56), [bracketSize]);

  // トーナメント設定を保存する
  const onSaveTournamentSettings = () =>
    params.call(() =>
      api("/api/admin/tournaments/settings", {
        method: "POST",
        body: JSON.stringify({
          name: params.tournamentName,
          eventDate: params.tournamentDate || null,
          timeSlot: params.tournamentTimeSlot || null,
          courtCount: params.courtCountInput,
          entryPasscode: params.entrySetPasscode,
          observerPasscode: params.observerSetPasscode,
        }),
      }),
    );

  // 参加者を準備状態にする
  const onSetReady = (id: number) =>
    params.call(() =>
      api(`/api/admin/participants/${id}/checkin`, {
        method: "POST",
        body: JSON.stringify({ checkedIn: true, canPlayToday: true }),
      }),
    );

  // 参加者を欠席状態にする
  const onSetAbsent = (id: number) =>
    params.call(() =>
      api(`/api/admin/participants/${id}/checkin`, {
        method: "POST",
        body: JSON.stringify({ checkedIn: true, canPlayToday: false }),
      }),
    );

  // 参加者を未回答状態にする
  const onSetUnanswered = (id: number) =>
    params.call(() =>
      api(`/api/admin/participants/${id}/checkin`, {
        method: "POST",
        body: JSON.stringify({ checkedIn: false, canPlayToday: null }),
      }),
    );

  // 試合をコートに割り当てる
  const onAssignCourt = (matchId: number, courtNumber: number) =>
    params.call(() =>
      api(`/api/admin/matches/${matchId}/assign`, {
        method: "POST",
        body: JSON.stringify({ courtNumber }),
      }),
    );

  // 試合を開始する
  const onStart = (matchId: number) => 
    params.call(() => 
      api(`/api/admin/matches/${matchId}/start`, { 
        method: "POST" 
      })
    );

  // 試合を勝利者にする
  const onWin = (matchId: number, winnerId: number | null) =>
    params.call(() =>
      api(`/api/admin/matches/${matchId}/result`, {
        method: "POST",
        body: JSON.stringify({ winnerId }),
      }),
    );

  return {
    bracketSize,
    bracketRounds,
    bracketHeight,
    onSaveTournamentSettings,
    onSetReady,
    onSetAbsent,
    onSetUnanswered,
    onAssignCourt,
    onStart,
    onWin,
  };
}
