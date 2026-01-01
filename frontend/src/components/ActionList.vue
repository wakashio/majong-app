<script setup lang="ts">
import { RoundActionType } from "../types/round";
import type { RoundAction } from "../types/round";

interface Props {
  roundId: string;
  actions: RoundAction[];
  isLoading: boolean;
  getActionText: (action: RoundAction) => string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  add: [roundId: string];
  delete: [roundId: string, actionId: string];
}>();

const handleAdd = (): void => {
  emit("add", props.roundId);
};

const handleDelete = (actionId: string): void => {
  emit("delete", props.roundId, actionId);
};
</script>

<template>
  <div class="mt-4">
    <div class="d-flex justify-space-between align-center mb-2">
      <div class="text-subtitle-2">鳴き・リーチ記録</div>
      <v-btn
        color="primary"
        size="small"
        :disabled="props.isLoading"
        @click="handleAdd"
      >
        追加
      </v-btn>
    </div>
    <v-list density="compact">
      <template v-if="props.actions.length > 0">
        <v-list-item
          v-for="action in props.actions"
          :key="action.id"
        >
          <v-list-item-title>
            {{ action.player.name }}: {{ props.getActionText(action) }}
          </v-list-item-title>
          <v-list-item-subtitle v-if="action.type === RoundActionType.NAKI && action.targetPlayer">
            {{ action.targetPlayer.name }}から
          </v-list-item-subtitle>
          <template #append>
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              :disabled="props.isLoading"
              @click="handleDelete(action.id)"
            />
          </template>
        </v-list-item>
      </template>
      <v-list-item v-else>
        <v-list-item-title class="text-grey">
          記録がありません
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </div>
</template>

