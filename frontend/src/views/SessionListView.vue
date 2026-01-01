<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { getSessions, deleteSession } from "../utils/sessionApi";
import Breadcrumbs from "../components/Breadcrumbs.vue";
import type { SessionListItem, ErrorResponse } from "../types/session";

const router = useRouter();

const sessions = ref<SessionListItem[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

const formattedSessions = computed(() => {
  return sessions.value.map((session) => ({
    ...session,
    name: session.name || "無題",
    date: new Date(session.date).toLocaleDateString("ja-JP"),
    playerNames: session.players.map((p) => p.name).join(", "),
  }));
});

const loadSessions = async (): Promise<void> => {
  try {
    isLoading.value = true;
    error.value = null;

    const result = await getSessions(50, 0);

    if ("error" in result) {
      const errorResponse = result as ErrorResponse;
      error.value = errorResponse.error.message;
      return;
    }

    sessions.value = result.data;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Unknown error occurred";
  } finally {
    isLoading.value = false;
  }
};

const handleCreate = (): void => {
  router.push("/sessions/new");
};

const handleEdit = (id: string): void => {
  router.push(`/sessions/${id}/edit`);
};

const handleDelete = async (id: string): Promise<void> => {
  if (!confirm("このセッションを削除しますか？")) {
    return;
  }

  try {
    isLoading.value = true;
    error.value = null;

    const result = await deleteSession(id);

    if ("error" in result) {
      const errorResponse = result as ErrorResponse;
      error.value = errorResponse.error.message;
      return;
    }

    await loadSessions();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Unknown error occurred";
  } finally {
    isLoading.value = false;
  }
};

const handleDetail = (id: string): void => {
  router.push(`/sessions/${id}`);
};

onMounted(() => {
  loadSessions();
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
        <h1 class="text-h4 mb-4">セッション一覧</h1>
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
      <v-col cols="12" class="text-right">
        <v-btn color="primary" @click="handleCreate">新規作成</v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>セッション一覧</v-card-title>
          <v-card-text>
            <v-data-table
              :headers="[
                { title: '日付', key: 'date' },
                { title: 'セッション名', key: 'name' },
                { title: '参加者', key: 'playerNames' },
                { title: '参加者数', key: 'playerCount' },
                { title: '半荘数', key: 'hanchanCount' },
                { title: '操作', key: 'actions', sortable: false },
              ]"
              :items="formattedSessions"
              :loading="isLoading"
              :items-per-page="10"
            >
              <template #item="{ item }">
                <tr>
                  <td>{{ item.date }}</td>
                  <td>{{ item.name }}</td>
                  <td>{{ item.playerNames }}</td>
                  <td>{{ item.playerCount }}</td>
                  <td>{{ item.hanchanCount }}</td>
                  <td>
                    <v-btn
                      size="small"
                      color="primary"
                      variant="text"
                      @click="handleDetail(item.id)"
                    >
                      詳細
                    </v-btn>
                    <v-btn
                      size="small"
                      color="primary"
                      variant="text"
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

