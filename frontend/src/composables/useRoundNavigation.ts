import { nextTick, type Ref } from "vue";
import type { Round, Score, CalculateNextSettingsRequest, CalculateNextSettingsResponse, Wind } from "../types/round";
import type { Hanchan } from "../types/hanchan";

/**
 * 次局遷移管理Composable
 */
export function useRoundNavigation(
  rounds: Ref<Round[]>,
  roundScores: Ref<Record<string, Score[]>>,
  error: Ref<string | null>,
  hanchan: Ref<Hanchan | null>,
  expandedPanels: Ref<string[]>,
  loadRounds: () => Promise<void>,
  calculateNextRoundSettings: (
    roundId: string,
    request: CalculateNextSettingsRequest
  ) => Promise<CalculateNextSettingsResponse | { error: { code: string; message: string } }>,
  createNextRound: (
    roundId: string,
    nextSettings: { nextRoundNumber: number; nextHonba: number; nextWind: Wind; nextRiichiSticks: number },
    nextDealerPlayerId: string
  ) => Promise<Round | null>
) {
  /**
   * 次局へ（ExpansionPanelから）
   */
  const handleNextRoundFromPanel = async (roundId: string): Promise<void> => {
    const round = rounds.value.find((r) => r.id === roundId);
    if (!round) {
      return;
    }
    if (!round.resultType) {
      error.value = "局を終了してから次局へ進んでください";
      return;
    }

    try {
      const scores = roundScores.value[roundId] || [];
      const winnerPlayerId = scores.find((s) => s.isWinner)?.playerId;

      // 親のテンパイ状態を取得
      const dealerScore = scores.find((s) => s.isDealer);
      const isDealerTenpai = dealerScore?.isTenpai === true ? true : undefined;

      await loadRounds();
      const updatedRound = rounds.value.find((r) => r.id === roundId);
      if (!updatedRound) {
        error.value = "局が見つかりません";
        return;
      }

      const nextSettingsResult = await calculateNextRoundSettings(roundId, {
        resultType: updatedRound.resultType!,
        winnerPlayerId,
        isDealerTenpai,
      });

      if ("error" in nextSettingsResult) {
        error.value = "次局の設定を計算できませんでした";
        return;
      }

      const nextSettings = nextSettingsResult.data;

      const nextRound = rounds.value.find(
        (r) =>
          r.roundNumber === nextSettings.nextRoundNumber &&
          r.honba === nextSettings.nextHonba &&
          r.id !== roundId
      );

      if (nextRound) {
        if (!expandedPanels.value.includes(nextRound.id)) {
          expandedPanels.value = [...expandedPanels.value, nextRound.id];
          await nextTick();
        }
      } else {
        let nextDealerPlayerId = "";
        if (hanchan.value?.hanchanPlayers && hanchan.value.hanchanPlayers.length > 0) {
          const lastDealerIndex = hanchan.value.hanchanPlayers.findIndex(
            (hp) => hp.playerId === round.dealerPlayerId
          );
          if (lastDealerIndex >= 0) {
            // 連荘判定はisRenchanフラグを使用
            if (nextSettings.isRenchan) {
              nextDealerPlayerId = round.dealerPlayerId;
            } else {
              const nextIndex = (lastDealerIndex + 1) % hanchan.value.hanchanPlayers.length;
              if (hanchan.value.hanchanPlayers[nextIndex]) {
                nextDealerPlayerId = hanchan.value.hanchanPlayers[nextIndex].playerId;
              }
            }
          } else {
            if (hanchan.value.hanchanPlayers[0]) {
              nextDealerPlayerId = hanchan.value.hanchanPlayers[0].playerId;
            }
          }
        }

        if (!nextDealerPlayerId) {
          error.value = "次局の親を設定できませんでした";
          return;
        }

        const createResult = await createNextRound(roundId, {
          ...nextSettings,
          nextWind: nextSettings.nextWind as Wind,
        }, nextDealerPlayerId);

        if (!createResult) {
          return;
        }

        if (!expandedPanels.value.includes(createResult.id)) {
          expandedPanels.value = [...expandedPanels.value, createResult.id];
          await nextTick();
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Unknown error occurred";
    }
  };

  return {
    handleNextRoundFromPanel,
  };
}

