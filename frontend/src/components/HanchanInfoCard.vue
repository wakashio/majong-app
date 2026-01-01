<script setup lang="ts">
import type { Hanchan } from "../types/hanchan";

interface Props {
  hanchan: Hanchan | null;
}

interface Emits {
  (e: "end-hanchan"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const handleEndHanchan = () => {
  emit("end-hanchan");
};
</script>

<template>
  <v-card v-if="props.hanchan" class="mb-4">
    <v-card-title>半荘情報</v-card-title>
    <v-card-text>
      <p><strong>半荘名:</strong> {{ props.hanchan.name || "無題" }}</p>
      <p>
        <strong>参加者:</strong>
        {{ props.hanchan.hanchanPlayers.map((hp) => hp.player.name).join(", ") }}
      </p>
      <p><strong>ステータス:</strong> {{ props.hanchan.status === "IN_PROGRESS" ? "進行中" : "完了済み" }}</p>
      <v-btn
        v-if="props.hanchan.status === 'IN_PROGRESS'"
        color="primary"
        class="mt-4"
        @click="handleEndHanchan"
      >
        半荘を終了
      </v-btn>
    </v-card-text>
  </v-card>
</template>

