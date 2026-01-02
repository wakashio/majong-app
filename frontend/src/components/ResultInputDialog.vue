<script setup lang="ts">
import { computed } from "vue";
import { RoundResultType, SpecialDrawType } from "../types/round";
import type { ScoreInput, RoundEditErrors, Round } from "../types/round";
import type { HanchanPlayer } from "../types/hanchan";

// 点数表のデータ（バックエンドと同じ）
interface TsumoScoreTable {
  dealer: {
    [totalScore: number]: {
      fromNonDealer: number;
    };
  };
  nonDealer: {
    [totalScore: number]: {
      fromDealer: number;
      fromNonDealer: number;
    };
  };
}

const tsumoScoreTable: TsumoScoreTable = {
  dealer: {
    1500: { fromNonDealer: 500 },
    2100: { fromNonDealer: 700 },
    2400: { fromNonDealer: 800 },
    3000: { fromNonDealer: 1000 },
    3900: { fromNonDealer: 1300 },
    4500: { fromNonDealer: 1500 },
    4800: { fromNonDealer: 1600 },
    5400: { fromNonDealer: 1800 },
    6000: { fromNonDealer: 2000 },
    6900: { fromNonDealer: 2300 },
    7800: { fromNonDealer: 2600 },
    8700: { fromNonDealer: 2900 },
    9600: { fromNonDealer: 3200 },
    10600: { fromNonDealer: 3600 },
    12000: { fromNonDealer: 4000 },
    18000: { fromNonDealer: 6000 },
    24000: { fromNonDealer: 8000 },
    36000: { fromNonDealer: 12000 },
    48000: { fromNonDealer: 16000 },
    96000: { fromNonDealer: 32000 },
    144000: { fromNonDealer: 48000 },
  },
  nonDealer: {
    1100: { fromDealer: 500, fromNonDealer: 300 },
    1500: { fromDealer: 700, fromNonDealer: 400 },
    1600: { fromDealer: 800, fromNonDealer: 400 },
    2000: { fromDealer: 1000, fromNonDealer: 500 },
    2400: { fromDealer: 1200, fromNonDealer: 600 },
    2600: { fromDealer: 1300, fromNonDealer: 700 },
    2900: { fromDealer: 1500, fromNonDealer: 800 },
    3200: { fromDealer: 1600, fromNonDealer: 800 },
    3600: { fromDealer: 1800, fromNonDealer: 900 },
    4000: { fromDealer: 2000, fromNonDealer: 1000 },
    4400: { fromDealer: 2300, fromNonDealer: 1200 },
    5200: { fromDealer: 2600, fromNonDealer: 1300 },
    5600: { fromDealer: 2900, fromNonDealer: 1500 },
    6400: { fromDealer: 3200, fromNonDealer: 1600 },
    6800: { fromDealer: 3400, fromNonDealer: 1700 },
    7200: { fromDealer: 3600, fromNonDealer: 1800 },
    8000: { fromDealer: 4000, fromNonDealer: 2000 },
    12000: { fromDealer: 6000, fromNonDealer: 3000 },
    16000: { fromDealer: 8000, fromNonDealer: 4000 },
    24000: { fromDealer: 12000, fromNonDealer: 6000 },
    32000: { fromDealer: 16000, fromNonDealer: 8000 },
    64000: { fromDealer: 32000, fromNonDealer: 16000 },
    96000: { fromDealer: 48000, fromNonDealer: 24000 },
  },
};

interface Props {
  modelValue: boolean;
  roundId: string | null;
  resultType: RoundResultType | null;
  specialDrawType: SpecialDrawType | null;
  scoreInputs: ScoreInput[];
  playerOptions: Array<{ value: string; title: string }>;
  riichiPlayerIds: string[];
  isLoading: boolean;
  errors: RoundEditErrors | null;
  round: Round | null;
  hanchanPlayers: HanchanPlayer[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  "update:resultType": [value: RoundResultType];
  "update:specialDrawType": [value: SpecialDrawType | null];
  "update:score-inputs": [value: ScoreInput[]];
  "winner-selection-change": [value: string | string[]];
  "ron-target-selection-change": [value: string];
  "score-change-input": [scoreInput: ScoreInput];
  "tenpai-selection-change": [value: string[]];
  confirm: [];
  cancel: [];
}>();

const dialogValue = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const resultTypeItems = [
  { title: "ツモ", value: RoundResultType.TSUMO },
  { title: "ロン", value: RoundResultType.RON },
  { title: "流局", value: RoundResultType.DRAW },
  { title: "特殊流局", value: RoundResultType.SPECIAL_DRAW },
];

const specialDrawTypeItems = [
  { title: "四槓", value: SpecialDrawType.FOUR_KAN },
  { title: "四風", value: SpecialDrawType.FOUR_WIND },
  { title: "九種九牌", value: SpecialDrawType.NINE_TERMINALS },
];

const handleResultTypeChange = (value: unknown): void => {
  const val = Array.isArray(value) ? value[0] : value;
  if (typeof val === "string") {
    emit("update:resultType", val as RoundResultType);
  }
};

const handleSpecialDrawTypeChange = (value: unknown): void => {
  const val = Array.isArray(value) ? value[0] : value;
  emit("update:specialDrawType", typeof val === "string" ? (val as SpecialDrawType) : null);
};

const handleWinnerSelectionChange = (value: string | string[]): void => {
  emit("winner-selection-change", value);
};

const handleRonTargetSelectionChange = (value: string | string[]): void => {
  const playerId = Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
  emit("ron-target-selection-change", playerId);
};

const handleScoreChangeInput = (scoreInput: ScoreInput): void => {
  // useResultInputのhandleScoreChangeInputに処理を委譲
  // useResultInputがresultDialogData.value.scoreInputsを更新し、
  // それがprops.scoreInputsに反映される
  emit("score-change-input", scoreInput);
};

const handleTenpaiSelectionChange = (value: string | string[]): void => {
  emit("tenpai-selection-change", Array.isArray(value) ? value : [value]);
};

const handleConfirm = (): void => {
  emit("confirm");
};

const handleCancel = (): void => {
  emit("cancel");
};

// 確定ボタンの有効/無効を判定するcomputedプロパティ
const isConfirmButtonDisabled = computed(() => {
  // ローディング中は無効
  if (props.isLoading) {
    return true;
  }

  // 結果が選択されていない場合は無効
  if (!props.resultType) {
    return true;
  }

  // 特殊流局の場合: 特殊流局タイプが選択されている必要がある
  if (props.resultType === RoundResultType.SPECIAL_DRAW) {
    if (!props.specialDrawType) {
      return true;
    }
  }

  // ツモ・ロンの場合: 点数入力と和了者・放銃者のバリデーション
  if (
    props.resultType === RoundResultType.TSUMO ||
    props.resultType === RoundResultType.RON
  ) {
    // すべての参加者の点数が入力されているか確認
    for (const input of props.scoreInputs) {
      if (input.scoreChange === null || input.scoreChange === undefined) {
        return true;
      }
    }

    // ツモの場合: 和了者が1人
    if (props.resultType === RoundResultType.TSUMO) {
      const winnerCount = props.scoreInputs.filter((si) => si.isWinner).length;
      if (winnerCount !== 1) {
        return true;
      }
    }

    // ロンの場合: 和了者が1〜3人、放銃者が1人
    if (props.resultType === RoundResultType.RON) {
      const winnerCount = props.scoreInputs.filter((si) => si.isWinner).length;
      if (winnerCount < 1 || winnerCount > 3) {
        return true;
      }

      const ronTargetCount = props.scoreInputs.filter((si) => si.isRonTarget).length;
      if (ronTargetCount !== 1) {
        return true;
      }
    }
  }

  // 流局・特殊流局の場合: 特に必須入力はない（テンパイ情報は任意）
  // バリデーションは通過

  return false;
});

// 和了者選択可能なプレイヤー（放銃者を除外）
const availableWinners = computed(() => {
  if (props.resultType !== RoundResultType.RON) {
    return props.scoreInputs;
  }
  const ronTargetId = props.scoreInputs.find((si) => si.isRonTarget)?.playerId;
  if (!ronTargetId) {
    return props.scoreInputs;
  }
  return props.scoreInputs.filter((si) => si.playerId !== ronTargetId);
});

// 放銃者選択可能なプレイヤー（和了者を除外）
const availableRonTargets = computed(() => {
  if (props.resultType !== RoundResultType.RON) {
    return props.scoreInputs;
  }
  const winnerIds = props.scoreInputs
    .filter((si) => si.isWinner)
    .map((si) => si.playerId);
  if (winnerIds.length === 0) {
    return props.scoreInputs;
  }
  return props.scoreInputs.filter((si) => !winnerIds.includes(si.playerId));
});

// 点数表からラベル一覧を生成
const getDealerScoreLabels = () => {
  return Object.keys(tsumoScoreTable.dealer)
    .map(Number)
    .sort((a, b) => a - b)
    .map((score) => {
      const entry = tsumoScoreTable.dealer[score];
      if (!entry) return null;
      return {
        score,
        label: `${entry.fromNonDealer}オール`,
      };
    })
    .filter((item): item is { score: number; label: string } => item !== null);
};

const getNonDealerScoreLabels = () => {
  return Object.keys(tsumoScoreTable.nonDealer)
    .map(Number)
    .sort((a, b) => a - b)
    .map((score) => {
      const entry = tsumoScoreTable.nonDealer[score];
      if (!entry) return null;
      return {
        score,
        label: `${entry.fromNonDealer}/${entry.fromDealer}`,
      };
    })
    .filter((item): item is { score: number; label: string } => item !== null);
};

// ツモ時の点数選択肢（ラベル文字列の配列）
const tsumoScoreOptions = computed(() => {
  if (props.resultType !== RoundResultType.TSUMO) {
    return [];
  }
  const winner = props.scoreInputs.find((si) => si.isWinner);
  const isDealer = winner?.isDealer ?? false;
  const labels = isDealer ? getDealerScoreLabels() : getNonDealerScoreLabels();
  return labels.map((label) => label.label);
});

// ラベルから点数を取得
const getScoreFromLabel = (label: string): number | null => {
  const winner = props.scoreInputs.find((si) => si.isWinner);
  const isDealer = winner?.isDealer ?? false;
  const labels = isDealer ? getDealerScoreLabels() : getNonDealerScoreLabels();
  const found = labels.find((l) => l.label === label);
  return found ? found.score : null;
};

// 点数からラベルを取得（本場・積み棒を除いた点数から）
const getLabelFromScore = (score: number | null): string | null => {
  if (score === null) return null;
  const winner = props.scoreInputs.find((si) => si.isWinner);
  if (!winner) return null;
  const isDealer = winner.isDealer;

  // 本場・積み棒を除いた点数を逆算
  const honba = props.round?.honba ?? 0;
  const riichiSticks = props.round?.riichiSticks ?? 0;
  const baseScore = reverseCalculateBaseScore(score, honba, riichiSticks, isDealer, props.scoreInputs);

  if (baseScore === null) return null;
  const labels = isDealer ? getDealerScoreLabels() : getNonDealerScoreLabels();
  const found = labels.find((l) => l.score === baseScore);
  return found ? found.label : null;
};

// 点数表の基本点数から本場・積み棒を含めた最終点数を計算
const calculateTsumoScoresFromBaseScore = (
  baseScore: number,
  honba: number,
  riichiSticks: number,
  isDealer: boolean,
  scoreInputs: ScoreInput[]
): Array<{ playerId: string; scoreChange: number }> => {
  if (isDealer) {
    // 親がツモ
    const scoreEntry = tsumoScoreTable.dealer[baseScore];
    if (!scoreEntry) {
      return [];
    }
    const fromNonDealer = scoreEntry.fromNonDealer + honba * 100;
    const winnerScore = fromNonDealer * 3 + riichiSticks * 1000;

    return scoreInputs.map((si) => {
      if (si.isWinner) {
        return { playerId: si.playerId, scoreChange: winnerScore };
      } else {
        return { playerId: si.playerId, scoreChange: -fromNonDealer };
      }
    });
  } else {
    // 子がツモ
    const scoreEntry = tsumoScoreTable.nonDealer[baseScore];
    if (!scoreEntry) {
      return [];
    }
    const fromDealer = scoreEntry.fromDealer + honba * 100;
    const fromNonDealer = scoreEntry.fromNonDealer + honba * 100;
    const winnerScore = fromDealer + fromNonDealer * 2 + riichiSticks * 1000;

    return scoreInputs.map((si) => {
      if (si.isWinner) {
        return { playerId: si.playerId, scoreChange: winnerScore };
      } else if (si.isDealer) {
        return { playerId: si.playerId, scoreChange: -fromDealer };
      } else {
        return { playerId: si.playerId, scoreChange: -fromNonDealer };
      }
    });
  }
};

// 最終点数から本場・積み棒を除いた基本点数を逆算
const reverseCalculateBaseScore = (
  finalScore: number,
  honba: number,
  riichiSticks: number,
  isDealer: boolean,
  scoreInputs: ScoreInput[]
): number | null => {
  const winner = scoreInputs.find((si) => si.isWinner);
  if (!winner) return null;

  if (isDealer) {
    // 親がツモ: 和了者の点数から基本点数を逆算
    // winnerScore = fromNonDealer * 3 + riichiSticks * 1000
    // fromNonDealer = (winnerScore - riichiSticks * 1000) / 3
    const fromNonDealer = (finalScore - riichiSticks * 1000) / 3;
    const baseFromNonDealer = fromNonDealer - honba * 100;

    // 点数表から該当する基本点数を探す
    for (const [score, entry] of Object.entries(tsumoScoreTable.dealer)) {
      if (entry.fromNonDealer === baseFromNonDealer) {
        return Number(score);
      }
    }
  } else {
    // 子がツモ: 和了者の点数から基本点数を逆算
    // winnerScore = fromDealer + fromNonDealer * 2 + riichiSticks * 1000
    // 非和了者の点数から逆算
    const nonWinner = scoreInputs.find((si) => !si.isWinner && !si.isDealer);
    if (nonWinner && nonWinner.scoreChange !== null && nonWinner.scoreChange !== undefined) {
      const fromNonDealer = -nonWinner.scoreChange;
      const baseFromNonDealer = fromNonDealer - honba * 100;

      // 点数表から該当する基本点数を探す
      for (const [score, entry] of Object.entries(tsumoScoreTable.nonDealer)) {
        if (entry.fromNonDealer === baseFromNonDealer) {
          return Number(score);
        }
      }
    }
  }

  return null;
};

</script>

<template>
  <v-dialog :model-value="dialogValue" max-width="800" persistent @update:model-value="dialogValue = $event">
    <v-card>
      <v-card-title>局の結果を記録</v-card-title>
      <v-card-text>
        <v-alert
          v-if="props.playerOptions.length === 0"
          type="warning"
          class="mb-4"
        >
          参加者情報を読み込んでいます...
        </v-alert>

        <!-- 結果選択 -->
        <div class="mb-4">
          <div class="text-subtitle-1 mb-2">結果</div>
          <v-chip-group
            :model-value="props.resultType ?? undefined"
            mandatory
            selected-class="text-primary"
            @update:model-value="handleResultTypeChange"
          >
            <v-chip
              v-for="item in resultTypeItems"
              :key="item.value"
              :value="item.value"
              :disabled="props.isLoading"
              variant="outlined"
              size="large"
            >
              {{ item.title }}
            </v-chip>
          </v-chip-group>
        </div>

        <!-- 特殊流局タイプ選択 -->
        <div
          v-if="props.resultType === RoundResultType.SPECIAL_DRAW"
          class="mb-4"
        >
          <div class="text-subtitle-1 mb-2">特殊流局タイプ</div>
          <v-chip-group
            :model-value="props.specialDrawType ?? undefined"
            mandatory
            selected-class="text-primary"
            @update:model-value="handleSpecialDrawTypeChange"
          >
            <v-chip
              v-for="item in specialDrawTypeItems"
              :key="item.value"
              :value="item.value"
              :disabled="props.isLoading"
              variant="outlined"
              size="large"
            >
              {{ item.title }}
            </v-chip>
          </v-chip-group>
        </div>

        <!-- スコア入力セクション（ツモ・ロン選択時） -->
        <div
          v-if="
            props.resultType === RoundResultType.TSUMO ||
            props.resultType === RoundResultType.RON
          "
          class="mb-4"
        >
          <!-- 和了者選択セクション -->
          <div class="mb-4">
            <div class="text-subtitle-1 mb-2">和了者</div>
            <v-chip-group
              :model-value="
                props.scoreInputs
                  .filter((si) => si.isWinner)
                  .map((si) => si.playerId)
              "
              :multiple="props.resultType === RoundResultType.RON"
              :mandatory="true"
              selected-class="text-primary"
              @update:model-value="handleWinnerSelectionChange"
            >
              <v-chip
                v-for="scoreInput in availableWinners"
                :key="scoreInput.playerId"
                :value="scoreInput.playerId"
                :disabled="props.isLoading"
                variant="outlined"
                size="large"
              >
                <span
                  v-if="props.riichiPlayerIds.includes(scoreInput.playerId)"
                  class="mr-1 riichi-icon"
                >
                  立
                </span>
                {{ scoreInput.playerName }}
              </v-chip>
            </v-chip-group>
          </div>

          <!-- 放銃者選択セクション（ロン時のみ） -->
          <div
            v-if="props.resultType === RoundResultType.RON"
            class="mb-4"
          >
            <div class="text-subtitle-1 mb-2">放銃者</div>
            <v-chip-group
              :model-value="
                props.scoreInputs
                  .filter((si) => si.isRonTarget)
                  .map((si) => si.playerId)
              "
              :multiple="false"
              :mandatory="true"
              selected-class="text-primary"
              @update:model-value="handleRonTargetSelectionChange"
            >
              <v-chip
                v-for="scoreInput in availableRonTargets"
                :key="scoreInput.playerId"
                :value="scoreInput.playerId"
                :disabled="props.isLoading"
                variant="outlined"
                size="large"
              >
                {{ scoreInput.playerName }}
              </v-chip>
            </v-chip-group>
          </div>

          <!-- 点数入力セクション -->
          <div class="mb-4">
            <div class="text-subtitle-1 mb-2">点数入力</div>
            <!-- 和了者の点数入力 -->
            <div
              v-for="winner in props.scoreInputs.filter((si) => si.isWinner)"
              :key="winner.playerId"
              class="mb-4"
            >
              <div class="text-body-1 mb-2">{{ winner.playerName }}</div>
              <!-- ツモ時はプルダウン（ラベルで選択）、ロン時はテキスト入力 -->
              <v-select
                v-if="props.resultType === RoundResultType.TSUMO"
                :model-value="getLabelFromScore(winner.scoreChange)"
                :items="tsumoScoreOptions"
                label="点数"
                :disabled="props.isLoading"
                :error-messages="
                  winner.scoreChange === null || winner.scoreChange === undefined
                    ? ['点数は必須です']
                    : []
                "
                @update:model-value="(v) => {
                  const label = typeof v === 'string' ? v : '';
                  const baseScore = getScoreFromLabel(label);
                  if (baseScore === null) return;

                  // 本場・積み棒を含めた最終点数を計算
                  const honba = props.round?.honba ?? 0;
                  const riichiSticks = props.round?.riichiSticks ?? 0;
                  const calculatedScores = calculateTsumoScoresFromBaseScore(
                    baseScore,
                    honba,
                    riichiSticks,
                    winner.isDealer,
                    props.scoreInputs
                  );

                  // 各プレイヤーのscoreChangeを更新
                  calculatedScores.forEach((calculated) => {
                    const scoreInput = props.scoreInputs.find((si) => si.playerId === calculated.playerId);
                    if (scoreInput) {
                      const updated = { ...scoreInput, scoreChange: calculated.scoreChange };
                      handleScoreChangeInput(updated);
                    }
                  });
                }"
                required
              />
              <v-text-field
                v-else
                :model-value="winner.scoreChange"
                type="number"
                label="点数"
                :disabled="props.isLoading"
                :error-messages="
                  winner.scoreChange === null || winner.scoreChange === undefined
                    ? ['点数は必須です']
                    : []
                "
                @update:model-value="(v) => {
                  const scoreValue = v === null || v === undefined || v === '' ? null : (typeof v === 'number' ? v : Number(v));
                  const updated = { ...winner, scoreChange: scoreValue !== null && !isNaN(scoreValue) ? scoreValue : null };
                  handleScoreChangeInput(updated);
                }"
                required
              />
            </div>
          </div>
        </div>

        <!-- テンパイ入力セクション（流局選択時） -->
        <div
          v-if="props.resultType === RoundResultType.DRAW"
          class="mb-4"
        >
          <div class="text-subtitle-1 mb-2">テンパイ情報</div>
          <div class="text-body-2 mb-2 text-grey-darken-1">
            テンパイしていた参加者を選択してください（複数選択可）
          </div>
          <v-chip-group
            :model-value="
              props.scoreInputs
                .filter((si) => si.isTenpai === true)
                .map((si) => si.playerId)
            "
            multiple
            selected-class="text-primary"
            @update:model-value="handleTenpaiSelectionChange"
          >
            <v-chip
              v-for="scoreInput in props.scoreInputs"
              :key="scoreInput.playerId"
              :value="scoreInput.playerId"
              :disabled="props.isLoading"
              variant="outlined"
              size="large"
            >
              {{ scoreInput.playerName }}
            </v-chip>
          </v-chip-group>
        </div>

        <!-- エラーメッセージ -->
        <v-alert
          v-if="props.errors?.resultTypeError"
          type="error"
          class="mb-4"
        >
          {{ props.errors.resultTypeError }}
        </v-alert>
        <v-alert
          v-if="props.errors?.specialDrawTypeError"
          type="error"
          class="mb-4"
        >
          {{ props.errors.specialDrawTypeError }}
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="props.isLoading" @click="handleCancel">キャンセル</v-btn>
        <v-btn
          color="primary"
          :disabled="isConfirmButtonDisabled"
          :loading="props.isLoading"
          @click="handleConfirm"
        >
          確定
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.riichi-icon {
  font-weight: bold;
  color: #ff5722;
}
</style>

