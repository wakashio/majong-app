<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { getHanchans, deleteHanchan } from "../utils/hanchanApi";
import Breadcrumbs from "../components/Breadcrumbs.vue";
import type { Hanchan, ErrorResponse, HanchanStatus } from "../types/hanchan";

const router = useRouter();

const hanchans = ref<Hanchan[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const statusFilter = ref<HanchanStatus | "">("");

const formattedHanchans = computed(() => {
  return hanchans.value.map((hanchan) => ({
    ...hanchan,
    name: hanchan.name || "無題",
    startedAt: new Date(hanchan.startedAt).toLocaleString("ja-JP"),
    endedAt: hanchan.endedAt ? new Date(hanchan.endedAt).toLocaleString("ja-JP") : "-",
    playerNames: hanchan.hanchanPlayers.map((hp) => hp.player.name).join(", "),
    statusText: hanchan.status === "IN_PROGRESS" ? "進行中" : "完了済み",
  }));
});

const loadHanchans = async (): Promise<void> => {
  try {
    isLoading.value = true;
    error.value = null;

    const result = await getHanchans(statusFilter.value || undefined);

    if ("error" in result) {
      const errorResponse = result as ErrorResponse;
      error.value = errorResponse.error.message;
      return;
    }

    hanchans.value = result.data;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Unknown error occurred";
  } finally {
    isLoading.value = false;
  }
};

const handleCreate = (): void => {
  router.push("/hanchans/new");
};

const handleEdit = (id: string): void => {
  router.push(`/hanchans/${id}/edit`);
};

const handleDelete = async (id: string): Promise<void> => {
  if (!confirm("この半荘を削除しますか？")) {
    return;
  }

  try {
    isLoading.value = true;
    error.value = null;

    const result = await deleteHanchan(id);

    if (result && "error" in result) {
      const errorResponse = result as ErrorResponse;
      error.value = errorResponse.error.message;
      return;
    }

    await loadHanchans();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Unknown error occurred";
  } finally {
    isLoading.value = false;
  }
};

const handleFilterChange = (): void => {
  loadHanchans();
};

onMounted(() => {
  loadHanchans();
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
      <v-col cols="12" class="d-flex justify-space-between align-center">
        <h1 class="text-h4 mb-0">半荘一覧</h1>
        <v-btn color="primary" @click="handleCreate">
          新規作成
        </v-btn>
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
      <v-col cols="12" md="4">
        <v-select
          v-model="statusFilter"
          :items="[
            { title: 'すべて', value: '' },
            { title: '進行中', value: 'IN_PROGRESS' },
            { title: '完了済み', value: 'COMPLETED' },
          ]"
          label="ステータス"
          @update:model-value="handleFilterChange"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>半荘一覧</v-card-title>
          <v-card-text>
            <v-data-table
              :headers="[
                { title: '半荘名', key: 'name' },
                { title: '参加者', key: 'playerNames' },
                { title: '開始日時', key: 'startedAt' },
                { title: '終了日時', key: 'endedAt' },
                { title: 'ステータス', key: 'statusText' },
                { title: '操作', key: 'actions', sortable: false },
              ]"
              :items="formattedHanchans"
              :loading="isLoading"
              :items-per-page="10"
            >
              <template #[`item.statusText`]="{ item }">
                <v-chip
                  :color="item.status === 'IN_PROGRESS' ? 'primary' : 'success'"
                  size="small"
                >
                  {{ item.statusText }}
                </v-chip>
              </template>
              <template #item="{ item }">
                <tr>
                  <td>{{ item.name }}</td>
                  <td>{{ item.playerNames }}</td>
                  <td>{{ item.startedAt }}</td>
                  <td>{{ item.endedAt }}</td>
                  <td>
                    <v-chip
                      :color="item.status === 'IN_PROGRESS' ? 'primary' : 'success'"
                      size="small"
                    >
                      {{ item.statusText }}
                    </v-chip>
                  </td>
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
  </v-container>
</template>

