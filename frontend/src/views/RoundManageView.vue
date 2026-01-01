<template>
  <v-container>
    <v-row>
      <v-col cols="12" class="mb-2">
        <Breadcrumbs />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">局管理</h1>
      </v-col>
    </v-row>

    <v-row v-if="hanchan">
      <v-col cols="12">
        <HanchanInfoCard :hanchan="hanchan" @end-hanchan="openEndHanchanDialog" />
      </v-col>
    </v-row>

    <v-row v-if="error">
      <v-col cols="12">
        <v-alert type="error" dismissible @click:close="error = null">
          {{ error }}
        </v-alert>
      </v-col>
    </v-row>

    <v-row v-if="isLoading">
      <v-col cols="12">
        <v-progress-linear indeterminate />
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col cols="12">
        <v-expansion-panels v-if="sortedRounds.length > 0" v-model="expandedPanels" multiple>
          <v-expansion-panel
            v-for="round in sortedRounds"
            :key="round.id"
            :value="round.id"
            :ref="(el) => setRoundPanelRef(el, round.id)"
          >
            <v-expansion-panel-title>
              {{ getRoundLabelForId(round.id) }}
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <RoundCard
                :round="round"
                :round-label="getRoundLabelForId(round.id)"
                :actions="getAllActions(round.id)"
                :scores="getDisplayScores(round.id)"
                :is-loading="isLoading"
                :get-action-text="getActionText"
                :get-riichi-sticks-score-change-for-table="getRiichiSticksScoreChangeForTableWrapper"
                :get-honba-score-change-for-table="getHonbaScoreChangeForTableWrapper"
                :get-riichi-players="getRiichiPlayersFromActions"
                @add-action="openActionDialog"
                @delete-action="handleDeleteAction"
                @end-round="openResultDialog"
                @next-round="handleNextRoundFromPanel"
                @delete-round="handleDeleteRound"
              />
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
        <v-alert v-else type="info" class="mt-4">
          局のデータがありません。
        </v-alert>
      </v-col>
    </v-row>

    <v-row v-if="hanchan && hanchanStatistics">
      <v-col cols="12">
        <HanchanDashboard
          :hanchan-statistics="hanchanStatistics"
          :is-loading="isLoadingStatistics"
          :get-rank-color="getRankColor"
        />
      </v-col>
    </v-row>

    <!-- アクション追加ダイアログ -->
    <ActionAddDialog
      v-model="showActionDialog"
      :round-id="currentRoundIdForDialog"
      :player-options="playerOptions"
      :action-type="newAction.type"
      :player-id="newAction.playerId"
      :naki-type="newAction.nakiType ?? null"
      :target-player-id="newAction.targetPlayerId ?? null"
      @update:action-type="handleActionTypeUpdate"
      @update:player-id="newAction.playerId = $event"
      @update:naki-type="handleNakiTypeUpdate"
      @update:target-player-id="handleTargetPlayerIdUpdate"
      :is-loading="isLoading"
      @confirm="handleAddAction"
    />

    <!-- 結果入力ダイアログ -->
    <ResultInputDialog
      v-model="showResultDialog"
      :round-id="currentRoundIdForResultDialog"
      :result-type="resultDialogData.resultType"
      :special-draw-type="resultDialogData.specialDrawType"
      :score-inputs="resultDialogData.scoreInputs"
      @update:result-type="resultDialogData.resultType = $event"
      @update:special-draw-type="resultDialogData.specialDrawType = $event"
      @update:score-inputs="resultDialogData.scoreInputs = $event"
      :player-options="playerOptions"
      :riichi-player-ids="getRiichiPlayersFromActions(currentRoundIdForResultDialog || '')"
      :is-loading="isLoading"
      :errors="(currentRoundIdForResultDialog && roundEditErrors[currentRoundIdForResultDialog]) || null"
      :round="currentRoundIdForResultDialog ? rounds.find((r) => r.id === currentRoundIdForResultDialog) || null : null"
      :hanchan-players="hanchan?.hanchanPlayers || []"
      @winner-selection-change="(v) => handleWinnerSelectionChange(Array.isArray(v) ? v : [v])"
      @ron-target-selection-change="handleRonTargetSelectionChange"
      @score-change-input="handleScoreChangeInput"
      @tenpai-selection-change="handleTenpaiSelectionChange"
      @confirm="handleConfirmResult"
      @cancel="closeResultDialog"
    />

    <!-- 局削除確認ダイアログ -->
    <v-dialog v-model="showDeleteRoundDialog" max-width="500" persistent>
      <v-card>
        <v-card-title>局の削除</v-card-title>
        <v-card-text>
          <p>この局を削除しますか？</p>
          <p class="text-caption text-grey">この操作は取り消せません。</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDeleteRoundDialog" :disabled="isLoading">キャンセル</v-btn>
          <v-btn color="error" @click="confirmDeleteRound" :loading="isLoading">削除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <HanchanEndDialog
      v-model="showEndHanchanDialog"
      :hanchan-statistics="hanchanStatistics"
      :uma-oka-config="sessionUmaOkaConfig"
      @confirm="handleEndHanchan"
    />

    <!-- 最新の局へスクロールボタン -->
    <v-btn
      v-if="sortedRounds.length >= 2"
      fab
      color="primary"
      class="scroll-to-latest-button"
      @click="scrollToLatestRound"
    >
      <v-icon>mdi-chevron-double-down</v-icon>
      <v-tooltip activator="parent" location="left">
        最新の局へスクロール
      </v-tooltip>
    </v-btn>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useRoute } from "vue-router";
import {
  NakiType,
  RoundActionType,
} from "../types/round";
import HanchanInfoCard from "../components/HanchanInfoCard.vue";
import HanchanDashboard from "../components/HanchanDashboard.vue";
import RoundCard from "../components/RoundCard.vue";
import ActionAddDialog from "../components/ActionAddDialog.vue";
import ResultInputDialog from "../components/ResultInputDialog.vue";
import HanchanEndDialog from "../components/HanchanEndDialog.vue";
import Breadcrumbs from "../components/Breadcrumbs.vue";
import { updateHanchan } from "../utils/hanchanApi";
import { getSession } from "../utils/sessionApi";
import { HanchanStatus } from "../types/hanchan";
import type { UmaOkaConfig } from "../types/hanchan";
import { useHanchanData } from "../composables/useHanchanData";
import { useRoundManagement } from "../composables/useRoundManagement";
import { useRoundActions } from "../composables/useRoundActions";
import { useResultInput } from "../composables/useResultInput";
import { useRoundDisplay } from "../composables/useRoundDisplay";
import { useRoundData } from "../composables/useRoundData";
import { useRoundDialogs } from "../composables/useRoundDialogs";
import { useRoundExpansion } from "../composables/useRoundExpansion";
import { useRoundNavigation } from "../composables/useRoundNavigation";
import {
  getRiichiSticksScoreChangeForTable,
  getHonbaScoreChangeForTable,
} from "../composables/useScoreCalculation";
import type { Score, Round } from "../types/round";

const route = useRoute();

const hanchanIdFromRoute = computed(() => route.params.hanchanId as string | undefined);
const hanchanId = ref<string>("");

// Composables
const {
  hanchan,
  hanchanStatistics,
  isLoadingStatistics,
  error: hanchanError,
  playerOptions,
  loadHanchan,
  loadHanchanStatistics,
} = useHanchanData();

const {
  expandedPanels,
} = useRoundExpansion();

const {
  showActionDialog,
  currentRoundIdForDialog,
  showDeleteRoundDialog,
  currentRoundIdForDeleteDialog,
  newAction,
  openActionDialog,
  openDeleteRoundDialog,
  closeDeleteRoundDialog,
} = useRoundDialogs();

const error = ref<string | null>(null);

const {
  rounds,
  roundEditData,
  roundEditErrors,
  isLoading,
  error: roundError,
  loadRounds,
  createRoundData,
  deleteRoundData,
  calculateNextRoundSettings,
  createNextRound,
  getNextRoundNumber,
  calculateWindFromRoundNumber,
  createHandleSaveRound,
} = useRoundManagement(hanchanId, hanchan, loadHanchanStatistics);

watch([hanchanError, roundError], ([hanchanErr, roundErr]) => {
  error.value = hanchanErr || roundErr || null;
}, { immediate: true });

const {
  getAllActions,
  setActions,
  clearActions,
  getRiichiPlayers: getRiichiPlayersFromActions,
  getActionText,
} = useRoundActions(
  rounds,
  roundEditData,
  error,
  isLoading,
  newAction,
  currentRoundIdForDialog,
  showActionDialog,
  getNextRoundNumber,
  calculateWindFromRoundNumber,
  createRoundData
);

const {
  showResultDialog,
  currentRoundIdForResultDialog,
  resultDialogData,
  roundScoreInputs,
  openResultDialog,
  closeResultDialog,
  handleWinnerSelectionChange,
  handleRonTargetSelectionChange,
  handleScoreChangeInput,
  handleTenpaiSelectionChange,
  initializeScoreInputsForRound,
  validateScoreInputsForRound,
  handleConfirmResult: handleConfirmResultWithoutSave,
} = useResultInput(
  rounds,
  roundEditData,
  roundEditErrors,
  hanchan,
  getAllActions
);

const {
  roundScores,
  loadRoundData,
} = useRoundData(setActions, initializeScoreInputsForRound);

const handleSaveRound = createHandleSaveRound(roundScoreInputs, getAllActions, loadRoundData, validateScoreInputsForRound);

// handleConfirmResultをラップしてhandleSaveRoundを呼び出す
const handleConfirmResult = async (): Promise<void> => {
  // closeResultDialog()が呼ばれる前にroundIdを保存
  const roundId = currentRoundIdForResultDialog.value;
  if (!roundId) {
    return;
  }

  await handleConfirmResultWithoutSave();
  await handleSaveRound(roundId);
};

const {
  handleNextRoundFromPanel,
} = useRoundNavigation(
  rounds,
  roundScores,
  error,
  hanchan,
  expandedPanels,
  loadRounds,
  calculateNextRoundSettings,
  createNextRound
);

const {
  handleAddAction,
  handleDeleteAction,
} = useRoundActions(
  rounds,
  roundEditData,
  error,
  isLoading,
  newAction,
  currentRoundIdForDialog,
  showActionDialog,
  getNextRoundNumber,
  calculateWindFromRoundNumber,
  createRoundData,
  loadRoundData
);

const {
  sortedRounds,
  getDisplayScores,
  getRoundLabelForId,
  getRankColor,
} = useRoundDisplay(rounds, roundEditData, roundScores, playerOptions);

// 積み棒と本場の点数計算用のラッパー関数
const getRiichiSticksScoreChangeForTableWrapper = (
  score: Score,
  round: Round,
  riichiPlayers: string[]
): number => {
  const allScores = getDisplayScores(round.id);
  const hanchanPlayers = hanchan.value?.hanchanPlayers || [];
  return getRiichiSticksScoreChangeForTable(
    score,
    round,
    riichiPlayers,
    allScores,
    hanchanPlayers
  );
};

const getHonbaScoreChangeForTableWrapper = (
  score: Score,
  round: Round
): number => {
  const allScores = getDisplayScores(round.id);
  const hanchanPlayers = hanchan.value?.hanchanPlayers || [];
  return getHonbaScoreChangeForTable(score, round, allScores, hanchanPlayers);
};

// 最新の局へスクロール処理
const roundPanelRefs = ref<Record<string, HTMLElement | null>>({});

const setRoundPanelRef = (el: unknown, roundId: string): void => {
  if (!el) {
    delete roundPanelRefs.value[roundId];
    return;
  }

  if (typeof el === "object" && el !== null && "$el" in el) {
    const vueComponent = el as { $el: HTMLElement };
    roundPanelRefs.value[roundId] = vueComponent.$el;
  } else if (el instanceof HTMLElement) {
    roundPanelRefs.value[roundId] = el;
  }
};

const scrollToLatestRound = async (): Promise<void> => {
  if (sortedRounds.value.length === 0) {
    return;
  }

  const latestRound = sortedRounds.value[sortedRounds.value.length - 1];
  if (!latestRound) {
    return;
  }

  const latestRoundId = latestRound.id;

  // 展開パネルに追加
  if (!expandedPanels.value.includes(latestRoundId)) {
    expandedPanels.value = [...expandedPanels.value, latestRoundId];
    await nextTick();
  }

  // スクロール処理
  await nextTick();
  const panelElement = roundPanelRefs.value[latestRoundId];
  if (panelElement) {
    panelElement.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};



const handleActionTypeUpdate = (value: string | string[]): void => {
  const val = Array.isArray(value) ? value[0] : value;
  if (typeof val === "string") {
    newAction.value.type = val as RoundActionType;
  }
};

const handleNakiTypeUpdate = (value: string | string[] | null): void => {
  const val = Array.isArray(value) ? value[0] : value;
  newAction.value.nakiType = (val ? val as NakiType : undefined);
};

const handleTargetPlayerIdUpdate = (value: string | string[] | null): void => {
  const val = Array.isArray(value) ? value[0] : value;
  newAction.value.targetPlayerId = (val ? val : undefined);
};



// 局を削除
const handleDeleteRound = (roundId: string): void => {
  openDeleteRoundDialog(roundId);
};

// 局削除を確定
const confirmDeleteRound = async (): Promise<void> => {
  if (!currentRoundIdForDeleteDialog.value) {
    return;
  }

  const roundId = currentRoundIdForDeleteDialog.value;

  try {
    isLoading.value = true;
    error.value = null;

    const success = await deleteRoundData(roundId);
    if (!success) {
      return;
    }

    // 局一覧から削除（Composables内で削除済み）
    clearActions(roundId);
    delete roundScores.value[roundId];
    delete roundScoreInputs.value[roundId];

    // ExpansionPanelからも削除
    expandedPanels.value = expandedPanels.value.filter((id) => id !== roundId);

    // 統計情報を再取得
    await loadHanchanStatistics(hanchanId.value);

    // ダイアログを閉じる
    closeDeleteRoundDialog();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Unknown error occurred";
  } finally {
    isLoading.value = false;
  }
};

// 半荘終了ダイアログ
const showEndHanchanDialog = ref(false);
const sessionUmaOkaConfig = ref<UmaOkaConfig | undefined>(undefined);

// 半荘終了ダイアログを開く
const openEndHanchanDialog = async (): Promise<void> => {
  showEndHanchanDialog.value = true;
  // セッションからウマオカ設定を取得
  if (hanchan.value?.sessionId) {
    try {
      const result = await getSession(hanchan.value.sessionId);
      if (!("error" in result)) {
        sessionUmaOkaConfig.value = result.data.umaOkaConfig;
      }
    } catch (err) {
      console.error("セッション情報取得エラー:", err);
    }
  } else {
    sessionUmaOkaConfig.value = undefined;
  }
};

// 半荘終了処理
const handleEndHanchan = async (umaOkaConfig?: UmaOkaConfig): Promise<void> => {
  if (!hanchan.value) {
    return;
  }

  try {
    isLoading.value = true;
    error.value = null;

    const result = await updateHanchan(hanchan.value.id, {
      status: HanchanStatus.COMPLETED,
      umaOkaConfig,
    });

    if ("error" in result) {
      error.value = result.error.message;
      return;
    }

    // 半荘情報を再取得
    await loadHanchan(hanchan.value.id);
    await loadHanchanStatistics(hanchan.value.id);

    showEndHanchanDialog.value = false;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Unknown error occurred";
  } finally {
    isLoading.value = false;
  }
};


onMounted(async () => {
  // hanchanIdをルートから取得
  if (hanchanIdFromRoute.value) {
    hanchanId.value = hanchanIdFromRoute.value;
  }

  if (hanchanId.value) {
    try {
      // 半荘情報を読み込む
      await loadHanchan(hanchanId.value);
      // 全局を読み込む（hanchanの読み込み完了後）
      await loadRounds();
      // 各局のデータ（鳴き・リーチ・打点記録）を読み込む
      for (const round of rounds.value) {
        if (round.createdAt && !round.id.startsWith("new-")) {
          await loadRoundData(round.id);
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Unknown error occurred";
    }
  }
});
</script>

<style scoped>
.records-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 600px) {
  .records-container {
    flex-direction: row;
  }
}

.naki-card,
.riichi-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid currentColor;
  border-radius: 50%;
  width: 1.5em;
  height: 1.5em;
  font-size: 1em;
  line-height: 1;
  padding: 0;
}

.riichi-card {
  flex: 1;
}

.dashboard-table :deep(.v-data-table__td),
.dashboard-table :deep(.v-data-table__th),
.score-table :deep(.v-data-table__td),
.score-table :deep(.v-data-table__th) {
  white-space: nowrap;
}

.scroll-to-latest-button {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 1000;
}
</style>
