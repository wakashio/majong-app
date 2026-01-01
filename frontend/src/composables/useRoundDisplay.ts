import { computed, type Ref } from "vue";
import type { Round, RoundEditData, Score } from "../types/round";
import { Wind } from "../types/round";

/**
 * 風の表示名を取得
 */
export function getWindText(wind: Wind): string {
  switch (wind) {
    case Wind.EAST:
      return "東";
    case Wind.SOUTH:
      return "南";
    case Wind.WEST:
      return "西";
    case Wind.NORTH:
      return "北";
    default:
      return "";
  }
}

/**
 * 局番号から風内での局番号を計算する
 */
export function calculateRoundNumberInWind(roundNumber: number): number {
  return ((roundNumber - 1) % 4) + 1;
}

/**
 * 局のラベルを取得（「東1局0本場」形式）
 */
export function getRoundLabel(round: Round): string {
  const windText = getWindText(round.wind);
  const roundNumberInWind = calculateRoundNumberInWind(round.roundNumber);
  return `${windText}${roundNumberInWind}局${round.honba}本場`;
}

/**
 * 親の参加者名を取得
 */
export function getDealerPlayerName(
  roundId: string,
  roundEditData: Record<string, RoundEditData>,
  playerOptions: Array<{ title: string; value: string }>
): string {
  const editData = roundEditData[roundId];
  if (!editData || !editData.dealerPlayerId) {
    return "";
  }
  const player = playerOptions.find((p) => p.value === editData.dealerPlayerId);
  return player ? player.title : "";
}

/**
 * 局のラベルを取得（親と積み棒を含む形式）
 */
export function getRoundLabelWithDealerAndSticks(
  roundId: string,
  rounds: Round[],
  roundEditData: Record<string, RoundEditData>,
  playerOptions: Array<{ title: string; value: string }>
): string {
  const round = rounds.find((r) => r.id === roundId);
  if (!round) {
    return "";
  }
  const baseLabel = getRoundLabel(round);
  const dealerName = getDealerPlayerName(roundId, roundEditData, playerOptions);
  const riichiSticks = roundEditData[roundId]?.riichiSticks ?? 0;

  const parts: string[] = [baseLabel];
  if (dealerName) {
    parts.push(`親: ${dealerName}`);
  }
  if (riichiSticks > 0) {
    parts.push(`積み棒: ${riichiSticks}`);
  }

  return parts.join(" / ");
}

/**
 * 全局をソート（局番号、本場の順）
 */
export function useRoundDisplay(
  rounds: Ref<Round[]>,
  roundEditData: Ref<Record<string, RoundEditData>>,
  roundScores: Ref<Record<string, Score[]>>,
  playerOptions: Ref<Array<{ title: string; value: string }>>
) {
  const sortedRounds = computed(() => {
    return [...rounds.value].sort((a, b) => {
      if (a.roundNumber !== b.roundNumber) {
        return a.roundNumber - b.roundNumber;
      }
      // 同じ局番号の場合は本場の昇順でソート（連荘の場合、0本場→1本場→2本場の順）
      return a.honba - b.honba;
    });
  });

  const getDisplayScores = (roundId: string): Score[] => {
    const round = rounds.value.find((r) => r.id === roundId);
    if (!round) {
      return [];
    }

    // Scoreから直接取得（リーチ記録によるScoreも含まれる）
    const scores = roundScores.value[roundId] || [];
    return scores;
  };

  const getRoundLabelForId = (roundId: string): string => {
    return getRoundLabelWithDealerAndSticks(
      roundId,
      rounds.value,
      roundEditData.value,
      playerOptions.value
    );
  };

  // 順位の色を取得
  const getRankColor = (rank: number): string => {
    switch (rank) {
      case 1:
        return "success";
      case 2:
        return "info";
      case 3:
        return "warning";
      case 4:
        return "error";
      default:
        return "grey";
    }
  };

  return {
    sortedRounds,
    getDisplayScores,
    getRoundLabelForId,
    getRankColor,
    getWindText,
    getRoundLabel,
    getDealerPlayerName: (roundId: string) =>
      getDealerPlayerName(roundId, roundEditData.value, playerOptions.value),
  };
}

