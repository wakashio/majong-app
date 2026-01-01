<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { getPlayers, deletePlayer, bulkCreatePlayer } from "../utils/playerApi";
import Breadcrumbs from "../components/Breadcrumbs.vue";
import type { Player, ErrorResponse } from "../types/player";

const router = useRouter();

const players = ref<Player[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

// 一括登録ダイアログ
const showBulkCreateDialog = ref(false);
const bulkCreateText = ref("");
const bulkCreateError = ref<string | null>(null);

const formattedPlayers = computed(() => {
  return players.value.map((player) => ({
    ...player,
    createdAt: new Date(player.createdAt).toLocaleString("ja-JP"),
    updatedAt: new Date(player.updatedAt).toLocaleString("ja-JP"),
  }));
});

const loadPlayers = async (): Promise<void> => {
  try {
    isLoading.value = true;
    error.value = null;

    const result = await getPlayers();

    if ("error" in result) {
      const errorResponse = result as ErrorResponse;
      error.value = errorResponse.error.message;
      return;
    }

    players.value = result.data;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Unknown error occurred";
  } finally {
    isLoading.value = false;
  }
};

const handleCreate = (): void => {
  router.push("/players/new");
};

const handleOpenBulkCreateDialog = (): void => {
  showBulkCreateDialog.value = true;
  bulkCreateText.value = "";
  bulkCreateError.value = null;
};

const handleCloseBulkCreateDialog = (): void => {
  showBulkCreateDialog.value = false;
  bulkCreateText.value = "";
  bulkCreateError.value = null;
};

const handleBulkCreate = async (): Promise<void> => {
  try {
    isLoading.value = true;
    bulkCreateError.value = null;

    // テキストを改行で分割して、空行や空白のみの行を除外
    const names = bulkCreateText.value
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (names.length === 0) {
      bulkCreateError.value = "少なくとも1人の名前を入力してください";
      return;
    }

    const result = await bulkCreatePlayer({ names });

    if ("error" in result) {
      const errorResponse = result as ErrorResponse;
      bulkCreateError.value = errorResponse.error.message;
      return;
    }

    // 成功したらダイアログを閉じて一覧を再読み込み
    handleCloseBulkCreateDialog();
    await loadPlayers();
  } catch (err) {
    bulkCreateError.value = err instanceof Error ? err.message : "Unknown error occurred";
  } finally {
    isLoading.value = false;
  }
};

const handleEdit = (id: string): void => {
  router.push(`/players/${id}/edit`);
};

const handleDelete = async (id: string): Promise<void> => {
  if (!confirm("この参加者を削除しますか？")) {
    return;
  }

  try {
    isLoading.value = true;
    error.value = null;

    const result = await deletePlayer(id);

    if (result && "error" in result) {
      const errorResponse = result as ErrorResponse;
      error.value = errorResponse.error.message;
      return;
    }

    await loadPlayers();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Unknown error occurred";
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadPlayers();
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
        <h1 class="text-h4 mb-4">参加者一覧</h1>
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
      <v-col cols="12" class="d-flex justify-end gap-2">
        <v-btn color="primary" @click="handleOpenBulkCreateDialog">
          一括登録
        </v-btn>
        <v-btn color="primary" @click="handleCreate">
          新規登録
        </v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>参加者一覧</v-card-title>
          <v-card-text>
            <v-data-table
              :headers="[
                { title: '参加者名', key: 'name' },
                { title: '作成日時', key: 'createdAt' },
                { title: '更新日時', key: 'updatedAt' },
                { title: '操作', key: 'actions', sortable: false },
              ]"
              :items="formattedPlayers"
              :loading="isLoading"
              :items-per-page="10"
            >
              <template #item="{ item }">
                <tr>
                  <td>{{ item.name }}</td>
                  <td>{{ item.createdAt }}</td>
                  <td>{{ item.updatedAt }}</td>
                  <td>
                    <v-btn
                      size="small"
                      color="primary"
                      variant="text"
                      class="mr-2"
                      @click="handleEdit(item.id)"
                    >
                      編集
                    </v-btn>
                    <v-btn
                      size="small"
                      color="error"
                      variant="text"
                      @click="handleDelete(item.id)"
                    >
                      削除
                    </v-btn>
                  </td>
                </tr>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 一括登録ダイアログ -->
    <v-dialog v-model="showBulkCreateDialog" max-width="600" persistent>
      <v-card>
        <v-card-title>参加者一括登録</v-card-title>
        <v-card-text>
          <v-alert
            v-if="bulkCreateError"
            type="error"
            class="mb-4"
            dismissible
            @click:close="bulkCreateError = null"
          >
            {{ bulkCreateError }}
          </v-alert>

          <div class="text-body-2 mb-2 text-grey-darken-1">
            改行区切りで複数人の名前を入力してください
          </div>
          <v-textarea
            v-model="bulkCreateText"
            label="参加者名"
            placeholder="参加者1&#10;参加者2&#10;参加者3"
            rows="10"
            :disabled="isLoading"
            auto-grow
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="handleCloseBulkCreateDialog" :disabled="isLoading">
            キャンセル
          </v-btn>
          <v-btn color="primary" @click="handleBulkCreate" :loading="isLoading">
            登録
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

