<script setup lang="ts">
import type { Round } from "../types/round";

interface Props {
  round: Round;
  isLoading: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  end: [roundId: string];
  next: [roundId: string];
  delete: [roundId: string];
}>();

const handleEnd = (): void => {
  emit("end", props.round.id);
};

const handleNext = (): void => {
  emit("next", props.round.id);
};

const handleDelete = (): void => {
  emit("delete", props.round.id);
};
</script>

<template>
  <v-card-actions class="mt-4">
    <v-spacer />
    <v-btn
      color="primary"
      :disabled="props.isLoading"
      :loading="props.isLoading"
      @click="handleEnd"
    >
      {{ props.round.endedAt ? "結果を編集" : "局を終了" }}
    </v-btn>
    <v-btn
      v-if="props.round.createdAt && props.round.endedAt"
      color="success"
      :disabled="props.isLoading"
      @click="handleNext"
    >
      次局へ
    </v-btn>
    <v-btn
      color="error"
      variant="text"
      :disabled="props.isLoading"
      @click="handleDelete"
    >
      削除
    </v-btn>
  </v-card-actions>
</template>

