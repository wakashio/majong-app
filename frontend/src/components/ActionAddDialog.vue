<script setup lang="ts">
import { computed } from "vue";
import { RoundActionType, NakiType } from "../types/round";
import PlayerSelectButton from "./PlayerSelectButton.vue";

interface Props {
  modelValue: boolean;
  roundId: string | null;
  playerOptions: Array<{ value: string; title: string }>;
  actionType: string;
  playerId: string;
  nakiType: string | null;
  targetPlayerId: string | null;
  isLoading: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  "update:actionType": [value: string];
  "update:playerId": [value: string];
  "update:nakiType": [value: string | null];
  "update:targetPlayerId": [value: string | null];
  confirm: [];
}>();

const actionTypeItems = [
  { title: "鳴き", value: RoundActionType.NAKI },
  { title: "リーチ", value: RoundActionType.RIICHI },
];

const nakiTypeItems = [
  { title: "ポン", value: NakiType.PON },
  { title: "チー", value: NakiType.CHI },
  { title: "大明槓", value: NakiType.DAIMINKAN },
  { title: "暗槓", value: NakiType.ANKAN },
];

const dialogValue = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const handleActionTypeChange = (value: string | string[]): void => {
  const val = Array.isArray(value) ? value[0] : value;
  if (typeof val === "string") {
    emit("update:actionType", val);
  }
};

const handlePlayerIdChange = (value: string | string[]): void => {
  const val = Array.isArray(value) ? value[0] : value;
  if (typeof val === "string") {
    emit("update:playerId", val);
  }
};

const handleNakiTypeChange = (value: string | string[]): void => {
  const val = Array.isArray(value) ? value[0] : value;
  emit("update:nakiType", typeof val === "string" ? val : null);
};

const handleTargetPlayerIdChange = (value: string | string[]): void => {
  const val = Array.isArray(value) ? value[0] : value;
  emit("update:targetPlayerId", typeof val === "string" ? val : null);
};

const handleConfirm = (): void => {
  emit("confirm");
};

const handleCancel = (): void => {
  dialogValue.value = false;
};
</script>

<template>
  <v-dialog :model-value="dialogValue" max-width="500" @update:model-value="dialogValue = $event">
    <v-card>
      <v-card-title>アクションを追加</v-card-title>
      <v-card-text>
        <v-alert
          v-if="props.playerOptions.length === 0"
          type="warning"
          class="mb-4"
        >
          参加者情報を読み込んでいます...
        </v-alert>
        <PlayerSelectButton
          :model-value="props.actionType"
          :items="actionTypeItems"
          label="アクションタイプ"
          :required="true"
          :disabled="props.isLoading"
          @update:model-value="handleActionTypeChange"
        />
        <PlayerSelectButton
          :model-value="props.playerId"
          :items="props.playerOptions"
          label="参加者"
          :disabled="props.playerOptions.length === 0 || props.isLoading"
          :required="true"
          @update:model-value="handlePlayerIdChange"
        />
        <template v-if="props.actionType === RoundActionType.NAKI">
          <PlayerSelectButton
            :model-value="props.nakiType ?? undefined"
            :items="nakiTypeItems"
            label="鳴きタイプ"
            :required="true"
            :disabled="props.isLoading"
            @update:model-value="handleNakiTypeChange"
          />
          <PlayerSelectButton
            v-if="props.nakiType !== NakiType.ANKAN"
            :model-value="props.targetPlayerId ?? undefined"
            :items="props.playerOptions"
            label="対象参加者"
            :disabled="props.playerOptions.length === 0 || props.isLoading"
            :required="true"
            @update:model-value="handleTargetPlayerIdChange"
          />
        </template>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="props.isLoading" @click="handleCancel">キャンセル</v-btn>
        <v-btn color="primary" :disabled="props.isLoading" @click="handleConfirm">追加</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

