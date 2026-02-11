<script setup lang="ts">
import type { Hanchan } from "../types/hanchan";

interface Props {
  hanchan: Hanchan | null;
}

interface Emits {
  (e: "end-hanchan"): void;
  (e: "register-session"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const handleEndHanchan = () => {
  emit("end-hanchan");
};

const handleRegisterSession = () => {
  emit("register-session");
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
      <p v-if="props.hanchan.sessionId">
        <strong>セッション:</strong> 登録済み
      </p>
      <div class="mt-4 d-flex gap-2">
        <v-btn
          v-if="!props.hanchan.sessionId"
          color="primary"
          variant="outlined"
          @click="handleRegisterSession"
        >
          セッションを登録
        </v-btn>
        <v-btn
          v-if="props.hanchan.status === 'IN_PROGRESS'"
          color="primary"
          @click="handleEndHanchan"
        >
          半荘を終了
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

