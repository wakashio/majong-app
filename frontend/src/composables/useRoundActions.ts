import { ref, type Ref } from "vue";
import { createRoundAction, deleteRoundAction } from "../utils/roundApi";
import type { RoundAction, Round, RoundEditData, CreateRoundActionRequest, ErrorResponse, CreateRoundRequest } from "../types/round";
import { NakiType, RoundActionType, Wind } from "../types/round";

/**
 * 鳴きタイプの表示名を取得
 */
export function getNakiTypeText(type: NakiType): string {
  const typeMap: Record<NakiType, string> = {
    [NakiType.PON]: "ポン",
    [NakiType.CHI]: "チー",
    [NakiType.DAIMINKAN]: "大明槓",
    [NakiType.ANKAN]: "暗槓",
  };
  return typeMap[type] || type;
}

/**
 * アクションの表示テキストを取得
 */
export function getActionText(action: RoundAction): string {
  if (action.type === RoundActionType.NAKI && action.nakiType) {
    return getNakiTypeText(action.nakiType);
  } else if (action.type === RoundActionType.RIICHI) {
    return "リーチ";
  }
  return "";
}

/**
 * アクション管理Composable
 */
export function useRoundActions(
  rounds: Ref<Round[]>,
  roundEditData: Ref<Record<string, RoundEditData>>,
  error: Ref<string | null>,
  isLoading: Ref<boolean>,
  newAction: Ref<CreateRoundActionRequest>,
  currentRoundIdForDialog: Ref<string | null>,
  showActionDialog: Ref<boolean>,
  getNextRoundNumber: () => number,
  calculateWindFromRoundNumber: (num: number) => Wind,
  createRoundData: (request: CreateRoundRequest) => Promise<Round | null>,
  loadRoundData?: (roundId: string) => Promise<void>
) {
  const roundActions = ref<Record<string, RoundAction[]>>({});

  const getAllActions = (roundId: string): RoundAction[] => {
    return roundActions.value[roundId] || [];
  };

  const setActions = (roundId: string, actions: RoundAction[] | Array<{ type: string; playerId: string }>): void => {
    roundActions.value[roundId] = actions as RoundAction[];
  };

  const addAction = (roundId: string, action: RoundAction): void => {
    if (!roundActions.value[roundId]) {
      roundActions.value[roundId] = [];
    }
    roundActions.value[roundId].push(action);
  };

  const removeAction = (roundId: string, actionId: string): void => {
    if (!roundActions.value[roundId]) {
      return;
    }
    roundActions.value[roundId] = roundActions.value[roundId].filter(
      (a) => a.id !== actionId
    );
  };

  const clearActions = (roundId: string): void => {
    delete roundActions.value[roundId];
  };

  const getRiichiPlayers = (roundId: string): string[] => {
    const actions = getAllActions(roundId);
    const riichiActions = actions.filter((action) => action.type === RoundActionType.RIICHI);
    return riichiActions.map((action) => action.playerId);
  };

  /**
   * アクションを追加
   */
  const handleAddAction = async (): Promise<void> => {
    if (!currentRoundIdForDialog.value || !newAction.value.playerId) {
      return;
    }

    try {
      let roundId = currentRoundIdForDialog.value;
      const round = rounds.value.find((r) => r.id === roundId);

      if (!round || !round.createdAt) {
        const editData = roundEditData.value[roundId];
        if (!editData) {
          error.value = "局情報が見つかりません";
          return;
        }

        if (!editData.dealerPlayerId) {
          error.value = "親を設定してください";
          return;
        }

        const nextRoundNumber = getNextRoundNumber();
        const createRequest: CreateRoundRequest = {
          roundNumber: nextRoundNumber,
          wind: calculateWindFromRoundNumber(nextRoundNumber),
          dealerPlayerId: editData.dealerPlayerId,
          honba: editData.honba ?? 0,
          riichiSticks: editData.riichiSticks ?? 0,
        };
        const createResult = await createRoundData(createRequest);

        if (!createResult) {
          return;
        }

        roundId = createResult.id;
      }

      const request: CreateRoundActionRequest = {
        type: newAction.value.type,
        playerId: newAction.value.playerId,
      };

      if (newAction.value.type === RoundActionType.NAKI) {
        if (!newAction.value.nakiType) {
          error.value = "鳴きタイプを選択してください";
          return;
        }
        request.nakiType = newAction.value.nakiType;
        request.targetPlayerId =
          newAction.value.nakiType !== NakiType.ANKAN
            ? newAction.value.targetPlayerId
            : undefined;
      }

      const result = await createRoundAction(roundId, request);

      if ("error" in result) {
        const errorResponse = result as ErrorResponse;
        error.value = errorResponse.error.message;
        return;
      }

      if (newAction.value.type === RoundActionType.RIICHI) {
        const editData = roundEditData.value[roundId];
        if (editData) {
          editData.riichiSticks = (editData.riichiSticks || 0) + 1;
        }
      }

      const savedRoundId = roundId;
      showActionDialog.value = false;
      currentRoundIdForDialog.value = null;
      newAction.value = {
        type: RoundActionType.NAKI,
        playerId: "",
        nakiType: NakiType.PON,
        targetPlayerId: "",
        tiles: [],
      };
      if (savedRoundId && loadRoundData) {
        await loadRoundData(savedRoundId);
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Unknown error occurred";
    }
  };

  /**
   * アクションを削除
   */
  const handleDeleteAction = async (roundId: string, actionId: string): Promise<void> => {
    try {
      isLoading.value = true;
      error.value = null;

      const actions = getAllActions(roundId);
      const actionToDelete = actions.find((a) => a.id === actionId);
      const isRiichi = actionToDelete?.type === RoundActionType.RIICHI;

      const result = await deleteRoundAction(roundId, actionId);

      if (result && "error" in result) {
        const errorResponse = result as ErrorResponse;
        error.value = errorResponse.error.message;
        return;
      }

      if (isRiichi) {
        const editData = roundEditData.value[roundId];
        if (editData && editData.riichiSticks > 0) {
          editData.riichiSticks -= 1;
        }
      }

      if (loadRoundData) {
        await loadRoundData(roundId);
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Unknown error occurred";
    } finally {
      isLoading.value = false;
    }
  };

  return {
    roundActions,
    getAllActions,
    setActions,
    addAction,
    removeAction,
    clearActions,
    getRiichiPlayers,
    getActionText,
    getNakiTypeText,
    handleAddAction,
    handleDeleteAction,
  };
}

