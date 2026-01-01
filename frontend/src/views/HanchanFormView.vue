<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { createHanchan, updateHanchan, getHanchan } from "../utils/hanchanApi";
import { getPlayers } from "../utils/playerApi";
import PlayerSelectButton from "../components/PlayerSelectButton.vue";
import Breadcrumbs from "../components/Breadcrumbs.vue";
import type {
  CreateHanchanRequest,
  UpdateHanchanRequest,
  ErrorResponse,
} from "../types/hanchan";
import type { Player } from "../types/player";

const router = useRouter();
const route = useRoute();

const isEdit = computed(() => route.params.id !== "new");
const hanchanId = computed(() => (isEdit.value ? (route.params.id as string) : null));
const sessionId = computed(() => {
  const sessionIdParam = route.query.sessionId as string | undefined;
  return sessionIdParam || undefined;
});

const name = ref("");
const selectedPlayerIds = ref<string[]>(["", "", "", ""]);
const players = ref<Player[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const nameError = ref<string | null>(null);
const playerErrors = ref<(string | null)[]>([]);

const playerOptions = computed(() => {
  return players.value.map((player) => ({
    title: player.name,
    value: player.id,
  }));
});

const validateName = (): boolean => {
  nameError.value = null;

  if (name.value && name.value.length > 100) {
    nameError.value = "半荘名は100文字以下である必要があります";
    return false;
  }

  return true;
};

const validatePlayers = (): boolean => {
  playerErrors.value = ["", "", "", ""];

  const uniqueIds = new Set(selectedPlayerIds.value);
  if (uniqueIds.size !== 4) {
    playerErrors.value = ["参加者は重複して選択できません", "", "", ""];
    return false;
  }

  for (let i = 0; i < 4; i++) {
    if (!selectedPlayerIds.value[i]) {
      playerErrors.value[i] = "参加者を選択してください";
      return false;
    }
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

const loadHanchan = async (): Promise<void> => {
  if (!isEdit.value || !hanchanId.value) {
    return;
  }

  try {
    isLoading.value = true;
    error.value = null;

    const result = await getHanchan(hanchanId.value);

    if ("error" in result) {
      const errorResponse = result as ErrorResponse;
      error.value = errorResponse.error.message;
      return;
    }

    name.value = result.data.name || "";
    const sortedPlayers = [...result.data.hanchanPlayers].sort(
      (a, b) => a.seatPosition - b.seatPosition
    );
    selectedPlayerIds.value = sortedPlayers.map((hp) => hp.playerId);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Unknown error occurred";
  } finally {
    isLoading.value = false;
  }
};

const handleSave = async (): Promise<void> => {
  if (!validateName() || !validatePlayers()) {
    return;
  }

  try {
    isLoading.value = true;
    error.value = null;
    nameError.value = null;
    playerErrors.value = ["", "", "", ""];

    if (isEdit.value && hanchanId.value) {
      const request: UpdateHanchanRequest = {
        name: name.value.trim() || undefined,
      };
      const result = await updateHanchan(hanchanId.value, request);

      if ("error" in result) {
        const errorResponse = result as ErrorResponse;
        if (errorResponse.error.code === "VALIDATION_ERROR") {
          nameError.value = errorResponse.error.message;
        } else {
          error.value = errorResponse.error.message;
        }
        return;
      }
    } else {
      const request: CreateHanchanRequest = {
        name: name.value.trim() || undefined,
        playerIds: selectedPlayerIds.value,
        sessionId: sessionId.value,
      };
      const result = await createHanchan(request);

      if ("error" in result) {
        const errorResponse = result as ErrorResponse;
        if (errorResponse.error.code === "VALIDATION_ERROR") {
          if (errorResponse.error.message.includes("playerIds")) {
            playerErrors.value = [errorResponse.error.message, "", "", ""];
          } else {
            nameError.value = errorResponse.error.message;
          }
        } else {
          error.value = errorResponse.error.message;
        }
        return;
      }

      // 半荘作成成功後、セッション詳細画面から遷移した場合はセッション詳細画面へ、それ以外は局入力画面へ遷移
      if (!("error" in result) && result.data) {
        if (sessionId.value) {
          router.push(`/sessions/${sessionId.value}`);
        } else {
          router.push(`/hanchans/${result.data.id}/rounds`);
        }
        return;
      }
    }

    router.push("/hanchans");
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Unknown error occurred";
  } finally {
    isLoading.value = false;
  }
};

const getSeatLabel = (index: number): string => {
  const labels = ["東", "南", "西", "北"];
  return labels[index] || `参加者${index + 1}`;
};

const handleCancel = (): void => {
  router.push("/hanchans");
};

onMounted(async () => {
  await loadPlayers();
  await loadHanchan();
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
          {{ isEdit ? "半荘編集" : "半荘作成" }}
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
            label="半荘名（オプション）"
            :error-messages="nameError ? [nameError] : []"
            :disabled="isLoading"
            autofocus
          />

          <v-divider class="my-4" />

          <div class="text-h6 mb-2">参加者選択（4人）</div>
          <div
            v-for="(playerId, index) in selectedPlayerIds"
            :key="index"
            class="mb-4"
          >
            <PlayerSelectButton
              v-model="selectedPlayerIds[index]"
              :items="playerOptions"
              :label="getSeatLabel(index)"
              :disabled="isLoading"
              :required="true"
            />
            <v-alert
              v-if="playerErrors[index]"
              type="error"
              density="compact"
              class="mt-1"
            >
              {{ playerErrors[index] }}
            </v-alert>
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

