<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { createSession, updateSession, getSession } from "../utils/sessionApi";
import { getPlayers } from "../utils/playerApi";
import PlayerSelectButton from "../components/PlayerSelectButton.vue";
import Breadcrumbs from "../components/Breadcrumbs.vue";
import type { CreateSessionRequest, UpdateSessionRequest, ErrorResponse } from "../types/session";
import type { Player } from "../types/player";
import type { UmaOkaConfig } from "../types/hanchan";

const router = useRouter();
const route = useRoute();

const isEdit = computed(() => route.params.id !== "new");
const sessionId = computed(() => (isEdit.value ? (route.params.id as string) : null));

const name = ref("");
const date = ref("");
const selectedPlayerIds = ref<string[]>([]);
const players = ref<Player[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const nameError = ref<string | null>(null);
const playerIdsError = ref<string | null>(null);

// ウマオカ設定
const initialScore = ref(25000);
const returnScore = ref(30000);
const uma1 = ref(30);
const uma2 = ref(10);
const uma3 = ref(-10);
const uma4 = ref(-30);
const useUmaOka = ref(false);

const playerOptions = computed(() => {
  return players.value.map((player) => ({
    title: player.name,
    value: player.id,
  }));
});

const validateName = (): boolean => {
  nameError.value = null;

  if (name.value && name.value.length > 100) {
    nameError.value = "セッション名は100文字以下である必要があります";
    return false;
  }

  return true;
};

const validateDate = (): boolean => {
  if (!date.value) {
    return false;
  }
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  return dateRegex.test(date.value);
};

const validatePlayerIds = (): boolean => {
  playerIdsError.value = null;

  if (selectedPlayerIds.value.length < 4) {
    playerIdsError.value = "参加者は4人以上選択する必要があります";
    return false;
  }

  const uniqueIds = new Set(selectedPlayerIds.value);
  if (uniqueIds.size !== selectedPlayerIds.value.length) {
    playerIdsError.value = "参加者は重複して選択できません";
    return false;
  }

  return true;
};

const loadPlayers = async (): Promise<void> => {
  try {
    const result = await getPlayers();

    if ("error" in result) {
      const errorResponse = result as ErrorResponse;
      error.value = errorResponse.error.message;
      return;
    }

    players.value = result.data;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Unknown error occurred";
  }
};

const loadSession = async (): Promise<void> => {
  if (!isEdit.value || !sessionId.value) {
    return;
  }

  try {
    isLoading.value = true;
    error.value = null;

    const result = await getSession(sessionId.value);

    if ("error" in result) {
      const errorResponse = result as ErrorResponse;
      error.value = errorResponse.error.message;
      return;
    }

    name.value = result.data.name || "";
    const dateStr = result.data.date.split("T")[0];
    if (dateStr) {
      date.value = dateStr;
    }
    selectedPlayerIds.value = result.data.sessionPlayers.map((sp) => sp.playerId);
    if (result.data.umaOkaConfig) {
      useUmaOka.value = true;
      initialScore.value = result.data.umaOkaConfig.initialScore ?? 25000;
      returnScore.value = result.data.umaOkaConfig.returnScore ?? 30000;
      uma1.value = result.data.umaOkaConfig.uma?.[0] ?? 30;
      uma2.value = result.data.umaOkaConfig.uma?.[1] ?? 10;
      uma3.value = result.data.umaOkaConfig.uma?.[2] ?? -10;
      uma4.value = result.data.umaOkaConfig.uma?.[3] ?? -30;
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Unknown error occurred";
  } finally {
    isLoading.value = false;
  }
};

const handleSave = async (): Promise<void> => {
  if (!validateName() || !validateDate() || !validatePlayerIds()) {
    return;
  }

  try {
    isLoading.value = true;
    error.value = null;
    nameError.value = null;
    playerIdsError.value = null;

    if (isEdit.value && sessionId.value) {
      const umaOkaConfig: UmaOkaConfig | undefined = useUmaOka.value
        ? {
            initialScore: initialScore.value,
            returnScore: returnScore.value,
            uma: [uma1.value, uma2.value, uma3.value, uma4.value],
          }
        : undefined;

      const request: UpdateSessionRequest = {
        name: name.value.trim() || undefined,
        playerIds: selectedPlayerIds.value,
        umaOkaConfig,
      };
      const result = await updateSession(sessionId.value, request);

      if ("error" in result) {
        const errorResponse = result as ErrorResponse;
        if (errorResponse.error.code === "VALIDATION_ERROR") {
          if (errorResponse.error.message.includes("playerIds")) {
            playerIdsError.value = errorResponse.error.message;
          } else {
            nameError.value = errorResponse.error.message;
          }
        } else {
          error.value = errorResponse.error.message;
        }
        return;
      }
    } else {
      const umaOkaConfig: UmaOkaConfig | undefined = useUmaOka.value
        ? {
            initialScore: initialScore.value,
            returnScore: returnScore.value,
            uma: [uma1.value, uma2.value, uma3.value, uma4.value],
          }
        : undefined;

      const request: CreateSessionRequest = {
        date: date.value,
        name: name.value.trim() || undefined,
        playerIds: selectedPlayerIds.value,
        umaOkaConfig,
      };
      const result = await createSession(request);

      if ("error" in result) {
        const errorResponse = result as ErrorResponse;
        if (errorResponse.error.code === "VALIDATION_ERROR") {
          if (errorResponse.error.message.includes("playerIds")) {
            playerIdsError.value = errorResponse.error.message;
          } else if (errorResponse.error.message.includes("date")) {
            error.value = errorResponse.error.message;
          } else {
            nameError.value = errorResponse.error.message;
          }
        } else {
          error.value = errorResponse.error.message;
        }
        return;
      }

      // セッション作成成功後、セッション詳細画面へ遷移
      if (!("error" in result) && result.data) {
        router.push(`/sessions/${result.data.id}`);
        return;
      }
    }

    router.push("/sessions");
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Unknown error occurred";
  } finally {
    isLoading.value = false;
  }
};

const handleCancel = (): void => {
  router.push("/sessions");
};

onMounted(async () => {
  const today = new Date();
  const dateStr = today.toISOString().split("T")[0];
  if (dateStr) {
    date.value = dateStr;
  }
  await loadPlayers();
  await loadSession();
});
</script>

<template>
  <v-container>
    <v-row>
      <v-col cols="12" class="mb-2">
        <Breadcrumbs />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">
          {{ isEdit ? "セッション編集" : "セッション作成" }}
        </h1>
      </v-col>
    </v-row>

    <v-row v-if="error">
      <v-col cols="12">
        <v-alert type="error" dismissible @click:close="error = null">
          {{ error }}
        </v-alert>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="6">
        <v-form @submit.prevent="handleSave">
          <v-text-field
            v-model="name"
            label="セッション名（オプション）"
            :error-messages="nameError ? [nameError] : []"
            :disabled="isLoading"
            autofocus
          />

          <v-text-field
            v-model="date"
            label="日付"
            type="date"
            :error-messages="!validateDate() && date ? ['日付形式が正しくありません'] : []"
            :disabled="isLoading"
            required
            class="mt-4"
          />

          <v-divider class="my-4" />

          <div class="text-h6 mb-2">参加者選択（4人以上）</div>
          <PlayerSelectButton
            v-model="selectedPlayerIds"
            :items="playerOptions"
            label="参加者"
            :disabled="isLoading"
            :required="true"
            :multiple="true"
          />
          <v-alert
            v-if="playerIdsError"
            type="error"
            density="compact"
            class="mt-1"
          >
            {{ playerIdsError }}
          </v-alert>
          <v-alert
            v-if="selectedPlayerIds.length > 0 && selectedPlayerIds.length < 4"
            type="warning"
            density="compact"
            class="mt-1"
          >
            参加者は4人以上選択する必要があります（現在: {{ selectedPlayerIds.length }}人）
          </v-alert>

          <v-divider class="my-4" />

          <div class="text-h6 mb-2">ウマオカ設定（オプション）</div>
          <v-checkbox
            v-model="useUmaOka"
            label="ウマオカ設定を使用する"
            :disabled="isLoading"
            class="mb-2"
          />
          <div v-if="useUmaOka">
            <v-text-field
              v-model.number="initialScore"
              label="持ち点"
              type="number"
              :disabled="isLoading"
              class="mb-2"
            />
            <v-text-field
              v-model.number="returnScore"
              label="返し点"
              type="number"
              :disabled="isLoading"
              class="mb-2"
            />
            <v-text-field
              v-model.number="uma1"
              label="1位のウマ"
              type="number"
              :disabled="isLoading"
              class="mb-2"
            />
            <v-text-field
              v-model.number="uma2"
              label="2位のウマ"
              type="number"
              :disabled="isLoading"
              class="mb-2"
            />
            <v-text-field
              v-model.number="uma3"
              label="3位のウマ"
              type="number"
              :disabled="isLoading"
              class="mb-2"
            />
            <v-text-field
              v-model.number="uma4"
              label="4位のウマ"
              type="number"
              :disabled="isLoading"
              class="mb-2"
            />
          </div>

          <v-row class="mt-4">
            <v-col cols="12" class="d-flex justify-end">
              <v-btn
                color="grey"
                variant="text"
                class="mr-2"
                :disabled="isLoading"
                @click="handleCancel"
              >
                キャンセル
              </v-btn>
              <v-btn
                color="primary"
                type="submit"
                :disabled="isLoading"
                :loading="isLoading"
              >
                保存
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-col>
    </v-row>
  </v-container>
</template>

