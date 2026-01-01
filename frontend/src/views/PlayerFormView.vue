<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { createPlayer, updatePlayer, getPlayer } from "../utils/playerApi";
import Breadcrumbs from "../components/Breadcrumbs.vue";
import type { CreatePlayerRequest, UpdatePlayerRequest, ErrorResponse } from "../types/player";

const router = useRouter();
const route = useRoute();

const isEdit = computed(() => route.params.id !== "new");
const playerId = computed(() => (isEdit.value ? (route.params.id as string) : null));

const name = ref("");
const isLoading = ref(false);
const error = ref<string | null>(null);
const nameError = ref<string | null>(null);

const validateName = (): boolean => {
  nameError.value = null;

  if (!name.value.trim()) {
    nameError.value = "参加者名は必須です";
    return false;
  }

  if (name.value.length > 100) {
    nameError.value = "参加者名は100文字以下である必要があります";
    return false;
  }

  return true;
};

const loadPlayer = async (): Promise<void> => {
  if (!isEdit.value || !playerId.value) {
    return;
  }

  try {
    isLoading.value = true;
    error.value = null;

    const result = await getPlayer(playerId.value);

    if ("error" in result) {
      const errorResponse = result as ErrorResponse;
      error.value = errorResponse.error.message;
      return;
    }

    name.value = result.data.name;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Unknown error occurred";
  } finally {
    isLoading.value = false;
  }
};

const handleSave = async (): Promise<void> => {
  if (!validateName()) {
    return;
  }

  try {
    isLoading.value = true;
    error.value = null;
    nameError.value = null;

    if (isEdit.value && playerId.value) {
      const request: UpdatePlayerRequest = { name: name.value.trim() };
      const result = await updatePlayer(playerId.value, request);

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
      const request: CreatePlayerRequest = { name: name.value.trim() };
      const result = await createPlayer(request);

      if ("error" in result) {
        const errorResponse = result as ErrorResponse;
        if (errorResponse.error.code === "VALIDATION_ERROR") {
          nameError.value = errorResponse.error.message;
        } else {
          error.value = errorResponse.error.message;
        }
        return;
      }
    }

    router.push("/players");
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Unknown error occurred";
  } finally {
    isLoading.value = false;
  }
};

const handleCancel = (): void => {
  router.push("/players");
};

onMounted(() => {
  loadPlayer();
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
          {{ isEdit ? "参加者編集" : "参加者登録" }}
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
            label="参加者名"
            :error-messages="nameError ? [nameError] : []"
            :disabled="isLoading"
            required
            autofocus
          />

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

