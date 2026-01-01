import { ref } from "vue";
import { RoundActionType, NakiType, type CreateRoundActionRequest } from "../types/round";

/**
 * ダイアログ管理Composable
 */
export function useRoundDialogs() {
  const showActionDialog = ref(false);
  const currentRoundIdForDialog = ref<string | null>(null);
  const showDeleteRoundDialog = ref(false);
  const currentRoundIdForDeleteDialog = ref<string | null>(null);

  const newAction = ref<CreateRoundActionRequest>({
    type: RoundActionType.NAKI,
    playerId: "",
    nakiType: NakiType.PON,
    targetPlayerId: "",
    tiles: [],
  });

  const openActionDialog = (roundId: string): void => {
    currentRoundIdForDialog.value = roundId;
    showActionDialog.value = true;
    newAction.value = {
      type: RoundActionType.NAKI,
      playerId: "",
      nakiType: NakiType.PON,
      targetPlayerId: "",
      tiles: [],
    };
  };

  const closeActionDialog = (): void => {
    showActionDialog.value = false;
    currentRoundIdForDialog.value = null;
    newAction.value = {
      type: RoundActionType.NAKI,
      playerId: "",
      nakiType: NakiType.PON,
      targetPlayerId: "",
      tiles: [],
    };
  };

  const openDeleteRoundDialog = (roundId: string): void => {
    currentRoundIdForDeleteDialog.value = roundId;
    showDeleteRoundDialog.value = true;
  };

  const closeDeleteRoundDialog = (): void => {
    showDeleteRoundDialog.value = false;
    currentRoundIdForDeleteDialog.value = null;
  };

  return {
    showActionDialog,
    currentRoundIdForDialog,
    showDeleteRoundDialog,
    currentRoundIdForDeleteDialog,
    newAction,
    openActionDialog,
    closeActionDialog,
    openDeleteRoundDialog,
    closeDeleteRoundDialog,
  };
}

