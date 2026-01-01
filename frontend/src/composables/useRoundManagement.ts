import { ref, type Ref } from "vue";
import {
  createRound,
  updateRound,
  getRounds,
  deleteRound,
  endRound,
  calculateNextSettings,
} from "../utils/roundApi";
import type {
  Round,
  RoundEditData,
  RoundEditErrors,
  CreateRoundRequest,
  UpdateRoundRequest,
  EndRoundRequest,
  ErrorResponse,
  CalculateNextSettingsRequest,
  ScoreInput,
} from "../types/round";
import { Wind, RoundResultType, RoundActionType } from "../types/round";
import type { Hanchan } from "../types/hanchan";

/**
 * 局番号から風を自動設定
 */
export function calculateWindFromRoundNumber(num: number): Wind {
  if (num >= 1 && num <= 4) return Wind.EAST;
  if (num >= 5 && num <= 8) return Wind.SOUTH;
  if (num >= 9 && num <= 12) return Wind.WEST;
  if (num >= 13 && num <= 16) return Wind.NORTH;
  return Wind.EAST;
}

/**
 * 局番号の自動採番（最大の局番号+1を返す）
 */
export function getNextRoundNumber(rounds: Round[]): number {
  if (rounds.length === 0) {
    return 1;
  }
  const maxRoundNumber = Math.max(...rounds.map((r) => r.roundNumber));
  return maxRoundNumber + 1;
}

/**
 * 局管理Composable
 */
export function useRoundManagement(
  hanchanId: Ref<string>,
  hanchan: Ref<Hanchan | null>,
  loadHanchanStatistics: (hanchanId: string) => Promise<void>
) {
  const rounds = ref<Round[]>([]);
  const roundEditData = ref<Record<string, RoundEditData>>({});
  const roundEditErrors = ref<Record<string, RoundEditErrors>>({});
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  /**
   * 各局の編集データを初期化
   */
  const initializeRoundEditData = (round: Round): void => {
    roundEditData.value[round.id] = {
      roundNumber: round.roundNumber,
      wind: round.wind,
      dealerPlayerId: round.dealerPlayerId,
      honba: round.honba,
      riichiSticks: round.riichiSticks,
      resultType: round.resultType,
      specialDrawType: round.specialDrawType,
    };

    roundEditErrors.value[round.id] = {
      dealerPlayerError: null,
      honbaError: null,
      resultTypeError: null,
      specialDrawTypeError: null,
    };
  };

  /**
   * 親のバリデーション
   */
  const validateDealerPlayerForRound = (roundId: string): boolean => {
    const editData = roundEditData.value[roundId];
    if (!editData) {
      return false;
    }

    if (roundEditErrors.value[roundId]) {
      roundEditErrors.value[roundId].dealerPlayerError = null;
    }

    if (!editData.dealerPlayerId) {
      if (roundEditErrors.value[roundId]) {
        roundEditErrors.value[roundId].dealerPlayerError = "親を選択してください";
      }
      return false;
    }

    return true;
  };

  /**
   * 本場のバリデーション
   */
  const validateHonbaForRound = (roundId: string): boolean => {
    const editData = roundEditData.value[roundId];
    if (!editData) {
      return false;
    }

    if (roundEditErrors.value[roundId]) {
      roundEditErrors.value[roundId].honbaError = null;
    }

    if (editData.honba < 0) {
      if (roundEditErrors.value[roundId]) {
        roundEditErrors.value[roundId].honbaError = "本場は0以上である必要があります";
      }
      return false;
    }

    return true;
  };

  /**
   * 全局を読み込む
   */
  const loadRounds = async (): Promise<void> => {
    if (!hanchanId.value) {
      return;
    }

    try {
      isLoading.value = true;
      error.value = null;

      const result = await getRounds(hanchanId.value);

      if ("error" in result) {
        const errorResponse = result as ErrorResponse;
        error.value = errorResponse.error.message;
        rounds.value = [];
        return;
      }

      rounds.value = result.data || [];

      // 全局が空の場合、東1局0本場の局を自動的に作成
      if (rounds.value.length === 0) {
        // 最初の親を自動設定（東の席、seatPosition = 0の参加者）
        let firstDealerPlayerId = "";
        let firstDealerPlayerName = "";
        if (hanchan.value?.hanchanPlayers && hanchan.value.hanchanPlayers.length > 0) {
          const eastSeatPlayer = hanchan.value.hanchanPlayers.find(
            (hp) => hp.seatPosition === 0
          );
          if (eastSeatPlayer) {
            firstDealerPlayerId = eastSeatPlayer.playerId;
            firstDealerPlayerName = eastSeatPlayer.player.name;
          }
        }

        const firstRound: Round = {
          id: `new-${Date.now()}`, // 一時的なID
          hanchanId: hanchanId.value,
          roundNumber: 1,
          wind: Wind.EAST,
          dealerPlayerId: firstDealerPlayerId,
          dealerPlayer: {
            id: firstDealerPlayerId,
            name: firstDealerPlayerName || "",
          },
          honba: 0,
          riichiSticks: 0,
          endedAt: null,
          resultType: null,
          specialDrawType: null,
          startedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          nakis: [],
          riichis: [],
          scores: [],
        };

        rounds.value.push(firstRound);
        initializeRoundEditData(firstRound);
      } else {
        // 各局の編集データを初期化
        for (const round of rounds.value) {
          initializeRoundEditData(round);
          // 局が作成済みの場合は、鳴き・リーチ・打点記録を読み込む
          // 注意: loadRoundDataは外部から提供される必要がある
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Unknown error occurred";
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 局を作成
   */
  const createRoundData = async (request: CreateRoundRequest): Promise<Round | null> => {
    try {
      isLoading.value = true;
      error.value = null;

      const result = await createRound(hanchanId.value, request);

      if ("error" in result) {
        const errorResponse = result as ErrorResponse;
        if (errorResponse.error.code === "VALIDATION_ERROR") {
          // エラーは呼び出し元で処理
          error.value = errorResponse.error.message;
        } else {
          error.value = errorResponse.error.message;
        }
        return null;
      }

      // 局を作成したら、局一覧に追加
      rounds.value.push(result.data);
      initializeRoundEditData(result.data);
      return result.data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Unknown error occurred";
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 局を更新
   */
  const updateRoundData = async (
    roundId: string,
    request: UpdateRoundRequest
  ): Promise<Round | null> => {
    try {
      isLoading.value = true;
      error.value = null;

      const result = await updateRound(roundId, request);

      if ("error" in result) {
        const errorResponse = result as ErrorResponse;
        if (errorResponse.error.code === "VALIDATION_ERROR") {
          if (roundEditErrors.value[roundId]) {
            roundEditErrors.value[roundId].dealerPlayerError = errorResponse.error.message;
          }
        } else {
          error.value = errorResponse.error.message;
        }
        return null;
      }

      // 局データを更新
      const index = rounds.value.findIndex((r) => r.id === roundId);
      if (index >= 0) {
        rounds.value[index] = result.data;
        initializeRoundEditData(result.data);
      }
      return result.data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Unknown error occurred";
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 局を削除
   */
  const deleteRoundData = async (roundId: string): Promise<boolean> => {
    try {
      isLoading.value = true;
      error.value = null;

      const result = await deleteRound(roundId);
      if (result && "error" in result) {
        const errorResponse = result as ErrorResponse;
        error.value = errorResponse.error.message;
        return false;
      }

      // 局一覧から削除
      rounds.value = rounds.value.filter((r) => r.id !== roundId);
      delete roundEditData.value[roundId];
      delete roundEditErrors.value[roundId];

      // 統計情報を再取得
      await loadHanchanStatistics(hanchanId.value);
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Unknown error occurred";
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 局を終了
   */
  const endRoundData = async (roundId: string, request: EndRoundRequest): Promise<Round | null> => {
    try {
      isLoading.value = true;
      error.value = null;

      const result = await endRound(roundId, request);

      if ("error" in result) {
        const errorResponse = result as ErrorResponse;
        if (errorResponse.error.code === "VALIDATION_ERROR") {
          if (roundEditErrors.value[roundId]) {
            roundEditErrors.value[roundId].resultTypeError = errorResponse.error.message;
          }
        } else {
          error.value = errorResponse.error.message;
        }
        return null;
      }

      // 局データを更新
      const endIndex = rounds.value.findIndex((r) => r.id === roundId);
      if (endIndex >= 0) {
        rounds.value[endIndex] = result.data;
        initializeRoundEditData(result.data);
      }

      // 統計情報を再取得
      await loadHanchanStatistics(hanchanId.value);
      return result.data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Unknown error occurred";
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 次局の設定を計算
   */
  const calculateNextRoundSettings = async (
    roundId: string,
    request: CalculateNextSettingsRequest
  ) => {
    return await calculateNextSettings(roundId, request);
  };

  /**
   * 次局を作成
   */
  const createNextRound = async (
    roundId: string,
    nextSettings: {
      nextRoundNumber: number;
      nextWind: Wind;
      nextHonba: number;
      nextRiichiSticks: number;
    },
    nextDealerPlayerId: string
  ): Promise<Round | null> => {
    const createRequest: CreateRoundRequest = {
      roundNumber: nextSettings.nextRoundNumber,
      wind: nextSettings.nextWind,
      dealerPlayerId: nextDealerPlayerId,
      honba: nextSettings.nextHonba,
      riichiSticks: nextSettings.nextRiichiSticks,
    };
    return await createRoundData(createRequest);
  };

  const createHandleSaveRound = (
    roundScoreInputsParam: Ref<Record<string, ScoreInput[]>>,
    getAllActionsParam: (roundId: string) => Array<{ type: string; playerId: string }>,
    loadRoundDataParam: (roundId: string) => Promise<void>,
    validateScoreInputsForRoundParam: (roundId: string) => boolean
  ) => {
    return async (roundId: string): Promise<void> => {
      const editData = roundEditData.value[roundId];
      if (!editData) {
        return;
      }

      if (!editData.resultType) {
        if (roundEditErrors.value[roundId]) {
          roundEditErrors.value[roundId].resultTypeError = "結果を選択してください";
        }
        return;
      }

      if (
        !validateDealerPlayerForRound(roundId) ||
        !validateHonbaForRound(roundId)
      ) {
        return;
      }

      if (
        editData.resultType === RoundResultType.SPECIAL_DRAW &&
        !editData.specialDrawType
      ) {
        if (roundEditErrors.value[roundId]) {
          roundEditErrors.value[roundId].specialDrawTypeError = "特殊流局タイプを選択してください";
        }
        return;
      }

      if (
        editData.resultType === RoundResultType.TSUMO ||
        editData.resultType === RoundResultType.RON
      ) {
        if (!validateScoreInputsForRoundParam(roundId)) {
          return;
        }
      }

      try {
        isLoading.value = true;
        error.value = null;

        const round = rounds.value.find((r) => r.id === roundId);
        if (!round) {
          error.value = "局が見つかりません";
          return;
        }

        if (round.createdAt) {
          const request: UpdateRoundRequest = {
            dealerPlayerId: editData.dealerPlayerId,
            honba: editData.honba,
            riichiSticks: editData.riichiSticks,
          };
          const result = await updateRoundData(roundId, request);

          if (!result) {
            return;
          }

          const scoreInputs = roundScoreInputsParam.value[roundId] || [];
          const actions = getAllActionsParam(roundId);
          const riichiActions = actions.filter((action) => action.type === RoundActionType.RIICHI);
          const riichiPlayerIds = new Set(riichiActions.map((action) => action.playerId));

          const scoresData =
            editData.resultType === RoundResultType.TSUMO ||
            editData.resultType === RoundResultType.RON ||
            editData.resultType === RoundResultType.DRAW ||
            editData.resultType === RoundResultType.SPECIAL_DRAW
              ? scoreInputs.map((si) => {
                  let isTenpaiValue: boolean | undefined = undefined;
                  if (
                    editData.resultType === RoundResultType.DRAW ||
                    editData.resultType === RoundResultType.SPECIAL_DRAW
                  ) {
                    if (riichiPlayerIds.has(si.playerId) && (si.isTenpai === null || si.isTenpai === undefined)) {
                      isTenpaiValue = true;
                    } else if (si.isTenpai !== null && si.isTenpai !== undefined) {
                      isTenpaiValue = si.isTenpai;
                    } else {
                      isTenpaiValue = false;
                    }
                  }

                  return {
                    playerId: si.playerId,
                    scoreChange:
                      editData.resultType === RoundResultType.DRAW ||
                      editData.resultType === RoundResultType.SPECIAL_DRAW
                        ? 0
                        : si.scoreChange!,
                    isDealer: si.isDealer,
                    isWinner: si.isWinner,
                    isRonTarget: si.isRonTarget ? true : undefined,
                    isTenpai: isTenpaiValue,
                    han: si.han ?? undefined,
                    fu: si.fu ?? undefined,
                    yaku: [],
                  };
                })
              : undefined;

          const endRequest: EndRoundRequest = {
            resultType: editData.resultType,
            specialDrawType:
              editData.resultType === RoundResultType.SPECIAL_DRAW
                ? editData.specialDrawType!
                : undefined,
            scores: scoresData,
          };

          const endResult = await endRoundData(roundId, endRequest);

          if (!endResult) {
            return;
          }

          await loadRoundDataParam(roundId);
          await loadHanchanStatistics(hanchanId.value);
        } else {
          const nextRoundNumber = getNextRoundNumber(rounds.value);
          const request: CreateRoundRequest = {
            roundNumber: nextRoundNumber,
            wind: calculateWindFromRoundNumber(nextRoundNumber),
            dealerPlayerId: editData.dealerPlayerId,
            honba: editData.honba ?? 0,
            riichiSticks: editData.riichiSticks ?? 0,
          };
          const result = await createRoundData(request);

          if (!result) {
            return;
          }

          if (editData.resultType) {
            const scoreInputs = roundScoreInputsParam.value[roundId] || [];
            const actions = getAllActionsParam(result.id);
            const riichiActions = actions.filter((action) => action.type === RoundActionType.RIICHI);
            const riichiPlayerIds = new Set(riichiActions.map((action) => action.playerId));

            const scoresData =
              editData.resultType === RoundResultType.TSUMO ||
              editData.resultType === RoundResultType.RON ||
              editData.resultType === RoundResultType.DRAW ||
              editData.resultType === RoundResultType.SPECIAL_DRAW
                ? scoreInputs.map((si) => {
                    let isTenpaiValue: boolean | undefined = undefined;
                    if (
                      editData.resultType === RoundResultType.DRAW ||
                      editData.resultType === RoundResultType.SPECIAL_DRAW
                    ) {
                      if (riichiPlayerIds.has(si.playerId) && (si.isTenpai === null || si.isTenpai === undefined)) {
                        isTenpaiValue = true;
                      } else if (si.isTenpai !== null && si.isTenpai !== undefined) {
                        isTenpaiValue = si.isTenpai;
                      } else {
                        isTenpaiValue = false;
                      }
                    }

                    return {
                      playerId: si.playerId,
                      scoreChange:
                        editData.resultType === RoundResultType.DRAW
                          ? 0
                          : si.scoreChange!,
                      isDealer: si.isDealer,
                      isWinner: si.isWinner,
                      isRonTarget: si.isRonTarget ? true : undefined,
                      isTenpai: isTenpaiValue,
                      han: si.han ?? undefined,
                      fu: si.fu ?? undefined,
                      yaku: [],
                    };
                  })
                : undefined;

            const endRequest: EndRoundRequest = {
              resultType: editData.resultType,
              specialDrawType:
                editData.resultType === RoundResultType.SPECIAL_DRAW
                  ? editData.specialDrawType!
                  : undefined,
              scores: scoresData,
            };

            const endResult = await endRoundData(result.id, endRequest);

            if (!endResult) {
              return;
            }

            await loadRoundDataParam(result.id);
            await loadHanchanStatistics(hanchanId.value);
          }
        }

        await loadRounds();
      } catch (err) {
        error.value = err instanceof Error ? err.message : "Unknown error occurred";
      } finally {
        isLoading.value = false;
      }
    };
  };

  return {
    rounds,
    roundEditData,
    roundEditErrors,
    isLoading,
    error,
    initializeRoundEditData,
    validateDealerPlayerForRound,
    validateHonbaForRound,
    loadRounds,
    createRoundData,
    updateRoundData,
    deleteRoundData,
    endRoundData,
    calculateNextRoundSettings,
    createNextRound,
    getNextRoundNumber: () => getNextRoundNumber(rounds.value),
    calculateWindFromRoundNumber,
    createHandleSaveRound,
  };
}

