import { ref } from "vue";
import { getRound } from "../utils/roundApi";
import type { Round, Score, ScoreInput } from "../types/round";
import { RoundResultType } from "../types/round";

/**
 * 局データ管理Composable
 */
export function useRoundData(
  setActions: (roundId: string, actions: Array<{ type: string; playerId: string }>) => void,
  initializeScoreInputsForRound: (roundId: string, round: Round) => ScoreInput[]
) {
  const roundScores = ref<Record<string, Score[]>>({});

  /**
   * 各局のデータ（鳴き・リーチ・打点記録）を読み込む
   */
  const loadRoundData = async (roundId: string): Promise<void> => {
    try {
      const result = await getRound(roundId);

      if ("error" in result) {
        return;
      }

      setActions(roundId, result.data.actions || []);
      roundScores.value[roundId] = result.data.scores || [];

      if (
        result.data.resultType === RoundResultType.TSUMO ||
        result.data.resultType === RoundResultType.RON
      ) {
        initializeScoreInputsForRound(roundId, result.data);
      }
    } catch (err) {
      console.error("局データの読み込みに失敗しました:", err);
    }
  };

  return {
    roundScores,
    loadRoundData,
  };
}

