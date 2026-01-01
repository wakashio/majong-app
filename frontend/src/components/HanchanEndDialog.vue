<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { HanchanStatistics, UmaOkaConfig } from "../types/hanchan";

interface Props {
  modelValue: boolean;
  hanchanStatistics: HanchanStatistics | null;
  umaOkaConfig?: UmaOkaConfig;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "confirm", umaOkaConfig?: UmaOkaConfig): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const initialScore = ref(props.umaOkaConfig?.initialScore ?? 25000);
const returnScore = ref(props.umaOkaConfig?.returnScore ?? 30000);
const uma1 = ref(props.umaOkaConfig?.uma?.[0] ?? 30);
const uma2 = ref(props.umaOkaConfig?.uma?.[1] ?? 10);
const uma3 = ref(props.umaOkaConfig?.uma?.[2] ?? -10);
const uma4 = ref(props.umaOkaConfig?.uma?.[3] ?? -30);

// props.umaOkaConfigが変更されたときに値を更新
watch(
  () => props.umaOkaConfig,
  (newConfig) => {
    if (newConfig) {
      initialScore.value = newConfig.initialScore ?? 25000;
      returnScore.value = newConfig.returnScore ?? 30000;
      uma1.value = newConfig.uma?.[0] ?? 30;
      uma2.value = newConfig.uma?.[1] ?? 10;
      uma3.value = newConfig.uma?.[2] ?? -10;
      uma4.value = newConfig.uma?.[3] ?? -30;
    }
  },
  { immediate: true }
);

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const handleConfirm = () => {
  const config: UmaOkaConfig = {
    initialScore: initialScore.value,
    returnScore: returnScore.value,
    uma: [uma1.value, uma2.value, uma3.value, uma4.value],
  };
  emit("confirm", config);
  dialog.value = false;
};

const handleCancel = () => {
  dialog.value = false;
};

const sortedPlayers = computed(() => {
  if (!props.hanchanStatistics) {
    return [];
  }
  return [...props.hanchanStatistics.players].sort(
    (a, b) => b.currentScore - a.currentScore
  );
});
</script>

<template>
  <v-dialog v-model="dialog" max-width="600" persistent>
    <v-card>
      <v-card-title>半荘を終了</v-card-title>
      <v-card-text>
        <v-alert type="warning" class="mb-4">
          半荘を終了すると、ウマオカを計算して最終得点を設定します。
        </v-alert>

        <div v-if="hanchanStatistics" class="mb-4">
          <h3 class="text-h6 mb-2">現在の持ち点</h3>
          <v-table>
            <thead>
              <tr>
                <th>参加者</th>
                <th>現在の持ち点</th>
                <th>順位</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="player in sortedPlayers"
                :key="player.playerId"
              >
                <td>{{ player.playerName }}</td>
                <td>{{ player.currentScore.toLocaleString() }}点</td>
                <td>{{ player.currentRank }}位</td>
              </tr>
            </tbody>
          </v-table>
        </div>

        <v-divider class="my-4" />

        <h3 class="text-h6 mb-2">ウマオカ設定</h3>
        <v-text-field
          v-model.number="initialScore"
          label="持ち点"
          type="number"
          class="mb-2"
        />
        <v-text-field
          v-model.number="returnScore"
          label="返し点"
          type="number"
          class="mb-2"
        />
        <v-text-field
          v-model.number="uma1"
          label="1位のウマ"
          type="number"
          class="mb-2"
        />
        <v-text-field
          v-model.number="uma2"
          label="2位のウマ"
          type="number"
          class="mb-2"
        />
        <v-text-field
          v-model.number="uma3"
          label="3位のウマ"
          type="number"
          class="mb-2"
        />
        <v-text-field
          v-model.number="uma4"
          label="4位のウマ"
          type="number"
          class="mb-2"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="handleCancel">キャンセル</v-btn>
        <v-btn color="primary" @click="handleConfirm">終了</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

