import { ref, type Ref } from "vue";
import type {
  Round,
  ScoreInput,
  RoundEditData,
  RoundEditErrors,
  ScoreData,
} from "../types/round";
import { RoundResultType, SpecialDrawType } from "../types/round";
import type { Hanchan } from "../types/hanchan";

/**
 * 結果入力管理Composable
 */
export function useResultInput(
  rounds: Ref<Round[]>,
  roundEditData: Ref<Record<string, RoundEditData>>,
  roundEditErrors: Ref<Record<string, RoundEditErrors>>,
  hanchan: Ref<Hanchan | null>,
  getAllActions: (roundId: string) => Array<{ type: string; playerId: string }>,
  handleSaveRound?: (roundId: string) => Promise<void>
) {
  const showResultDialog = ref(false);
  const currentRoundIdForResultDialog = ref<string | null>(null);
  const roundScoreInputs = ref<Record<string, ScoreInput[]>>({});

  const resultDialogData = ref<{
    resultType: RoundResultType | null;
    specialDrawType: SpecialDrawType | null;
    scoreInputs: ScoreInput[];
  }>({
    resultType: null,
    specialDrawType: null,
    scoreInputs: [],
  });

  /**
   * 各局のスコア入力を初期化
   */
  const initializeScoreInputsForRound = (roundId: string, round: Round): ScoreInput[] => {
    if (!hanchan.value?.hanchanPlayers) {
      return [];
    }

    const inputs: ScoreInput[] = hanchan.value.hanchanPlayers.map((hp) => {
      const existingScore = round.scores?.find((s) => s.playerId === hp.playerId);
      return {
        playerId: hp.playerId,
        playerName: hp.player.name,
        isDealer: hp.playerId === round.dealerPlayerId,
        isWinner: existingScore ? existingScore.scoreChange > 0 : false,
        isRonTarget: existingScore?.isRonTarget ?? false,
        isTenpai: existingScore?.isTenpai ?? null,
        scoreChange: existingScore?.scoreChange ?? 0,
        han: existingScore?.han || null,
        fu: existingScore?.fu || null,
      };
    });

    roundScoreInputs.value[roundId] = inputs;
    return inputs;
  };

  /**
   * 結果入力ダイアログを開く
   */
  const openResultDialog = (roundId: string): void => {
    const round = rounds.value.find((r) => r.id === roundId);
    if (!round) {
      return;
    }

    currentRoundIdForResultDialog.value = roundId;
    const editData = roundEditData.value[roundId];
    let scoreInputs = roundScoreInputs.value[roundId] || [];

    // スコア入力が初期化されていない場合は初期化
    if (scoreInputs.length === 0 && hanchan.value?.hanchanPlayers) {
      // 既に終了している局の場合、既存のScoreを読み込む
      if (round.endedAt && round.scores && round.scores.length > 0) {
        scoreInputs = initializeScoreInputsForRound(roundId, round);
        roundScoreInputs.value[roundId] = scoreInputs;
      } else {
        // リーチ者を取得
        const actions = getAllActions(roundId);
        const riichiActions = actions.filter((action) => action.type === "RIICHI");
        const riichiPlayerIds = new Set(riichiActions.map((action) => action.playerId));

        scoreInputs = hanchan.value.hanchanPlayers
          .filter((hp) => hp && hp.player)
          .map((hp) => {
            const roundData = rounds.value.find((r) => r.id === roundId);
            // リーチ者は自動でテンパイ状態として設定
            const isTenpai = riichiPlayerIds.has(hp.playerId) ? true : null;
            return {
              playerId: hp.playerId,
              playerName: hp.player.name,
              isDealer: roundData?.dealerPlayerId === hp.playerId,
              isWinner: false,
              isRonTarget: false,
              isTenpai,
              scoreChange: 0,
              han: null,
              fu: null,
            };
          });
        roundScoreInputs.value[roundId] = scoreInputs;
      }
    } else {
      // 既存のスコア入力がある場合も、リーチ者を自動でテンパイ状態に設定
      const actions = getAllActions(roundId);
      const riichiActions = actions.filter((action) => action.type === "RIICHI");
      const riichiPlayerIds = new Set(riichiActions.map((action) => action.playerId));
      scoreInputs = scoreInputs.map((si) => {
        // リーチ者で、isTenpaiがnullまたはundefinedの場合はtrueに設定
        if (riichiPlayerIds.has(si.playerId) && (si.isTenpai === null || si.isTenpai === undefined)) {
          return { ...si, isTenpai: true };
        }
        return si;
      });
      roundScoreInputs.value[roundId] = scoreInputs;
    }

    // ダイアログ用のデータを初期化
    resultDialogData.value = {
      resultType: editData?.resultType || null,
      specialDrawType: editData?.specialDrawType || null,
      scoreInputs: scoreInputs.map((si) => ({ ...si })),
    };

    showResultDialog.value = true;
  };

  /**
   * 結果入力ダイアログを閉じる
   */
  const closeResultDialog = (): void => {
    showResultDialog.value = false;
    currentRoundIdForResultDialog.value = null;
    resultDialogData.value = {
      resultType: null,
      specialDrawType: null,
      scoreInputs: [],
    };
  };

  /**
   * 和了者選択の変更を処理
   */
  const handleWinnerSelectionChange = (selectedPlayerIds: string[]): void => {
    resultDialogData.value.scoreInputs.forEach((si) => {
      si.isWinner = selectedPlayerIds.includes(si.playerId);
    });
  };

  /**
   * 放銃者選択の変更を処理
   */
  const handleRonTargetSelectionChange = (selectedPlayerId: string): void => {
    resultDialogData.value.scoreInputs.forEach((si) => {
      si.isRonTarget = si.playerId === selectedPlayerId;
    });
  };

  /**
   * 点数入力の変更を処理
   */
  const handleScoreChangeInput = (scoreInput: ScoreInput): void => {
    // scoreInputの変更をresultDialogData.value.scoreInputsの該当する要素に反映
    const updatedScoreInputs = resultDialogData.value.scoreInputs.map((si) => {
      if (si.playerId === scoreInput.playerId) {
        return { ...scoreInput };
      }
      return si;
    });
    resultDialogData.value.scoreInputs = updatedScoreInputs;
  };

  /**
   * 結果タイプの変更を処理
   */
  const handleResultTypeChange = (resultType: RoundResultType | null): void => {
    resultDialogData.value.resultType = resultType;

    // 流局（通常の流局・特殊流局）に変更された場合、リーチ者を自動でテンパイ状態に設定
    if (
      (resultType === RoundResultType.DRAW || resultType === RoundResultType.SPECIAL_DRAW) &&
      currentRoundIdForResultDialog.value
    ) {
      // リーチ者を取得
      const actions = getAllActions(currentRoundIdForResultDialog.value);
      const riichiActions = actions.filter((action) => action.type === "RIICHI");
      const riichiPlayerIds = new Set(riichiActions.map((action) => action.playerId));

      resultDialogData.value.scoreInputs.forEach((si) => {
        // リーチ者で、isTenpaiがnullまたはundefinedの場合はtrueに設定
        if (riichiPlayerIds.has(si.playerId) && (si.isTenpai === null || si.isTenpai === undefined)) {
          si.isTenpai = true;
        } else if (si.isTenpai === null || si.isTenpai === undefined) {
          // リーチ者以外で、isTenpaiがnullまたはundefinedの場合はfalse（ノーテン）に設定
          si.isTenpai = false;
        }
      });
    }
  };

  /**
   * テンパイ選択の変更を処理
   */
  const handleTenpaiSelectionChange = (selectedPlayerIds: string[]): void => {
    resultDialogData.value.scoreInputs.forEach((si) => {
      si.isTenpai = selectedPlayerIds.includes(si.playerId);
    });
  };

  /**
   * スコア入力のバリデーション
   */
  const validateScoreInputs = (roundId: string): boolean => {
    const editData = roundEditData.value[roundId];
    if (!editData) {
      return false;
    }

    if (
      editData.resultType !== RoundResultType.TSUMO &&
      editData.resultType !== RoundResultType.RON
    ) {
      return true;
    }

    const scoreInputs = roundScoreInputs.value[roundId] || [];

    // 点数が入力されているか確認
    for (const input of scoreInputs) {
      if (input.scoreChange === null || input.scoreChange === undefined) {
        if (roundEditErrors.value[roundId]) {
          roundEditErrors.value[roundId].resultTypeError = "すべての参加者の点数を入力してください";
        }
        return false;
      }
    }

    // ツモの場合: 和了者が1人
    if (editData.resultType === RoundResultType.TSUMO) {
      const winnerCount = scoreInputs.filter((si) => si.isWinner).length;
      if (winnerCount !== 1) {
        if (roundEditErrors.value[roundId]) {
          roundEditErrors.value[roundId].resultTypeError = "ツモの場合は和了者が1人である必要があります";
        }
        return false;
      }
    }

    // ロンの場合: 和了者が1〜3人、放銃者が1人
    if (editData.resultType === RoundResultType.RON) {
      const winnerCount = scoreInputs.filter((si) => si.isWinner).length;
      if (winnerCount < 1 || winnerCount > 3) {
        if (roundEditErrors.value[roundId]) {
          roundEditErrors.value[roundId].resultTypeError = "ロンの場合は和了者が1〜3人である必要があります";
        }
        return false;
      }

      const ronTargetCount = scoreInputs.filter((si) => si.isRonTarget).length;
      if (ronTargetCount !== 1) {
        if (roundEditErrors.value[roundId]) {
          roundEditErrors.value[roundId].resultTypeError = "ロンの場合は放銃者が1人である必要があります";
        }
        return false;
      }
    }

    return true;
  };

  /**
   * スコア入力をスコアデータに変換
   */
  const convertScoreInputsToScoreData = (
    roundId: string,
    riichiPlayerIds: Set<string>
  ): ScoreData[] | undefined => {
    const editData = roundEditData.value[roundId];
    if (!editData) {
      return undefined;
    }
    const scoreInputs = roundScoreInputs.value[roundId] || [];

    if (
      editData.resultType !== RoundResultType.TSUMO &&
      editData.resultType !== RoundResultType.RON &&
      editData.resultType !== RoundResultType.DRAW &&
      editData.resultType !== RoundResultType.SPECIAL_DRAW
    ) {
      return undefined;
    }

    return scoreInputs.map((si) => {
      // 流局時（通常の流局・特殊流局）、リーチ者は自動でテンパイ状態として記録
      let isTenpaiValue: boolean | undefined = undefined;
      if (
        editData.resultType === RoundResultType.DRAW ||
        editData.resultType === RoundResultType.SPECIAL_DRAW
      ) {
        // リーチ者で、isTenpaiがnullまたはundefinedの場合はtrueに設定
        if (riichiPlayerIds.has(si.playerId) && (si.isTenpai === null || si.isTenpai === undefined)) {
          isTenpaiValue = true;
        } else if (si.isTenpai !== null && si.isTenpai !== undefined) {
          // 明示的に設定されている場合はその値を使用
          isTenpaiValue = si.isTenpai;
        } else {
          // リーチ者以外で、isTenpaiがnullまたはundefinedの場合はfalse（ノーテン）に設定
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
    });
  };

  /**
   * 結果入力ダイアログの確定処理（バリデーションのみ）
   */
  const validateResultDialog = (roundId: string): boolean => {
    const editData = roundEditData.value[roundId];
    if (!editData) {
      return false;
    }

    // 結果が設定されていない場合は、エラーを表示
    if (!resultDialogData.value.resultType) {
      if (roundEditErrors.value[roundId]) {
        roundEditErrors.value[roundId].resultTypeError = "結果を選択してください";
      }
      return false;
    }

    // ダイアログのデータを編集データに反映
    editData.resultType = resultDialogData.value.resultType;
    editData.specialDrawType = resultDialogData.value.specialDrawType;
    roundScoreInputs.value[roundId] = resultDialogData.value.scoreInputs.map((si) => ({ ...si }));

    // バリデーション
    if (
      resultDialogData.value.resultType === RoundResultType.SPECIAL_DRAW &&
      !resultDialogData.value.specialDrawType
    ) {
      if (roundEditErrors.value[roundId]) {
        roundEditErrors.value[roundId].specialDrawTypeError = "特殊流局タイプを選択してください";
      }
      return false;
    }

    if (
      resultDialogData.value.resultType === RoundResultType.TSUMO ||
      resultDialogData.value.resultType === RoundResultType.RON
    ) {
      const scoreInputs = resultDialogData.value.scoreInputs;

      // 点数が入力されているか確認
      for (const input of scoreInputs) {
        if (input.scoreChange === null || input.scoreChange === undefined) {
          if (roundEditErrors.value[roundId]) {
            roundEditErrors.value[roundId].resultTypeError = "すべての参加者の点数を入力してください";
          }
          return false;
        }
      }

      // ツモの場合: 和了者が1人
      if (resultDialogData.value.resultType === RoundResultType.TSUMO) {
        const winnerCount = scoreInputs.filter((si) => si.isWinner).length;
        if (winnerCount !== 1) {
          if (roundEditErrors.value[roundId]) {
            roundEditErrors.value[roundId].resultTypeError = "ツモの場合は和了者が1人である必要があります";
          }
          return false;
        }
      }

      // ロンの場合: 和了者が1〜3人、放銃者が1人
      if (resultDialogData.value.resultType === RoundResultType.RON) {
        const winnerCount = scoreInputs.filter((si) => si.isWinner).length;
        if (winnerCount < 1 || winnerCount > 3) {
          if (roundEditErrors.value[roundId]) {
            roundEditErrors.value[roundId].resultTypeError = "ロンの場合は和了者が1〜3人である必要があります";
          }
          return false;
        }

        const ronTargetCount = scoreInputs.filter((si) => si.isRonTarget).length;
        if (ronTargetCount !== 1) {
          if (roundEditErrors.value[roundId]) {
            roundEditErrors.value[roundId].resultTypeError = "ロンの場合は放銃者が1人である必要があります";
          }
          return false;
        }
      }
    }

    // エラーをクリア
    if (roundEditErrors.value[roundId]) {
      roundEditErrors.value[roundId].resultTypeError = null;
      roundEditErrors.value[roundId].specialDrawTypeError = null;
    }

    // ダイアログのデータをroundScoreInputsに反映
    roundScoreInputs.value[roundId] = resultDialogData.value.scoreInputs.map((si) => ({ ...si }));

    return true;
  };

  /**
   * 結果入力ダイアログの確定処理
   */
  const handleConfirmResult = async (): Promise<void> => {
    if (!currentRoundIdForResultDialog.value) {
      return;
    }

    const roundId = currentRoundIdForResultDialog.value;
    const editData = roundEditData.value[roundId];
    if (!editData) {
      return;
    }

    if (!resultDialogData.value.resultType) {
      if (roundEditErrors.value[roundId]) {
        roundEditErrors.value[roundId].resultTypeError = "結果を選択してください";
      }
      return;
    }

    editData.resultType = resultDialogData.value.resultType;
    editData.specialDrawType = resultDialogData.value.specialDrawType;
    roundScoreInputs.value[roundId] = resultDialogData.value.scoreInputs.map((si) => ({ ...si }));

    if (
      resultDialogData.value.resultType === RoundResultType.SPECIAL_DRAW &&
      !resultDialogData.value.specialDrawType
    ) {
      if (roundEditErrors.value[roundId]) {
        roundEditErrors.value[roundId].specialDrawTypeError = "特殊流局タイプを選択してください";
      }
      return;
    }

    if (
      resultDialogData.value.resultType === RoundResultType.TSUMO ||
      resultDialogData.value.resultType === RoundResultType.RON
    ) {
      const scoreInputs = resultDialogData.value.scoreInputs;

      for (const input of scoreInputs) {
        if (input.scoreChange === null || input.scoreChange === undefined) {
          if (roundEditErrors.value[roundId]) {
            roundEditErrors.value[roundId].resultTypeError = "すべての参加者の点数を入力してください";
          }
          return;
        }
      }

      if (resultDialogData.value.resultType === RoundResultType.TSUMO) {
        const winnerCount = scoreInputs.filter((si) => si.isWinner).length;
        if (winnerCount !== 1) {
          if (roundEditErrors.value[roundId]) {
            roundEditErrors.value[roundId].resultTypeError = "ツモの場合は和了者が1人である必要があります";
          }
          return;
        }
      }

      if (resultDialogData.value.resultType === RoundResultType.RON) {
        const winnerCount = scoreInputs.filter((si) => si.isWinner).length;
        if (winnerCount < 1 || winnerCount > 3) {
          if (roundEditErrors.value[roundId]) {
            roundEditErrors.value[roundId].resultTypeError = "ロンの場合は和了者が1〜3人である必要があります";
          }
          return;
        }

        const ronTargetCount = scoreInputs.filter((si) => si.isRonTarget).length;
        if (ronTargetCount !== 1) {
          if (roundEditErrors.value[roundId]) {
            roundEditErrors.value[roundId].resultTypeError = "ロンの場合は放銃者が1人である必要があります";
          }
          return;
        }
      }
    }

    if (roundEditErrors.value[roundId]) {
      roundEditErrors.value[roundId].resultTypeError = null;
      roundEditErrors.value[roundId].specialDrawTypeError = null;
    }

    roundScoreInputs.value[roundId] = resultDialogData.value.scoreInputs.map((si) => ({ ...si }));

    closeResultDialog();

    if (handleSaveRound) {
      await handleSaveRound(roundId);
    }
  };

  /**
   * 各局のスコア入力のバリデーション
   */
  const validateScoreInputsForRound = (roundId: string): boolean => {
    const editData = roundEditData.value[roundId];
    if (!editData) {
      return false;
    }

    if (
      editData.resultType !== RoundResultType.TSUMO &&
      editData.resultType !== RoundResultType.RON
    ) {
      return true;
    }

    const scoreInputs = roundScoreInputs.value[roundId] || [];

    for (const input of scoreInputs) {
      if (input.scoreChange === null || input.scoreChange === undefined) {
        if (roundEditErrors.value[roundId]) {
          roundEditErrors.value[roundId].resultTypeError = "すべての参加者の点数を入力してください";
        }
        return false;
      }
    }

    if (editData.resultType === RoundResultType.TSUMO) {
      const winnerCount = scoreInputs.filter((si) => si.isWinner).length;
      if (winnerCount !== 1) {
        if (roundEditErrors.value[roundId]) {
          roundEditErrors.value[roundId].resultTypeError = "ツモの場合は和了者が1人である必要があります";
        }
        return false;
      }
    }

    if (editData.resultType === RoundResultType.RON) {
      const winnerCount = scoreInputs.filter((si) => si.isWinner).length;
      if (winnerCount < 1 || winnerCount > 3) {
        if (roundEditErrors.value[roundId]) {
          roundEditErrors.value[roundId].resultTypeError = "ロンの場合は和了者が1〜3人である必要があります";
        }
        return false;
      }

      const ronTargetCount = scoreInputs.filter((si) => si.isRonTarget).length;
      if (ronTargetCount !== 1) {
        if (roundEditErrors.value[roundId]) {
          roundEditErrors.value[roundId].resultTypeError = "ロンの場合は放銃者が1人である必要があります";
        }
        return false;
      }
    }

    return true;
  };

  return {
    showResultDialog,
    currentRoundIdForResultDialog,
    resultDialogData,
    roundScoreInputs,
    openResultDialog,
    closeResultDialog,
    handleWinnerSelectionChange,
    handleRonTargetSelectionChange,
    handleScoreChangeInput,
    handleResultTypeChange,
    handleTenpaiSelectionChange,
    validateScoreInputs,
    initializeScoreInputsForRound,
    convertScoreInputsToScoreData,
    validateResultDialog,
    handleConfirmResult,
    validateScoreInputsForRound,
  };
}

