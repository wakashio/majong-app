<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { getSession, deleteSession, getSessionStatistics } from "../utils/sessionApi";
import Breadcrumbs from "../components/Breadcrumbs.vue";
import type { Session, ErrorResponse, SessionStatistics } from "../types/session";

const router = useRouter();
const route = useRoute();

const sessionId = computed(() => route.params.id as string);

const session = ref<Session | null>(null);
const statistics = ref<SessionStatistics | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

const formattedDate = computed(() => {
  if (!session.value) return "";
  return new Date(session.value.date).toLocaleDateString("ja-JP");
});

const loadSession = async (): Promise<void> => {
  try {
    isLoading.value = true;
    error.value = null;

    const result = await getSession(sessionId.value);

    if ("error" in result) {
      const errorResponse = result as ErrorResponse;
      error.value = errorResponse.error.message;
      return;
    }

    session.value = result.data;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Unknown error occurred";
  } finally {
    isLoading.value = false;
  }
};

const loadStatistics = async (): Promise<void> => {
  try {
    const result = await getSessionStatistics(sessionId.value);

    if ("error" in result) {
      return;
    }

    statistics.value = result.data;
  } catch {
    // 統計情報の取得失敗は無視
  }
};

const handleEdit = (): void => {
  router.push(`/sessions/${sessionId.value}/edit`);
};

const handleDelete = async (): Promise<void> => {
  if (!confirm("このセッションを削除しますか？")) {
    return;
  }

  try {
    isLoading.value = true;
    error.value = null;

    const result = await deleteSession(sessionId.value);

    if ("error" in result) {
      const errorResponse = result as ErrorResponse;
      error.value = errorResponse.error.message;
      return;
    }

    router.push("/sessions");
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Unknown error occurred";
  } finally {
    isLoading.value = false;
  }
};

const handleCreateHanchan = (): void => {
  router.push(`/hanchans/new?sessionId=${sessionId.value}`);
};

const handleHanchanDetail = (hanchanId: string): void => {
  router.push(`/hanchans/${hanchanId}/rounds`);
};

onMounted(async () => {
  await loadSession();
  await loadStatistics();
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
        <div class="d-flex justify-space-between align-center">
          <h1 class="text-h4 mb-4">セッション詳細</h1>
          <div>
            <v-btn
              color="primary"
              variant="text"
              class="mr-2"
              :disabled="isLoading"
              @click="handleEdit"
            >
              編集
            </v-btn>
            <v-btn
              color="error"
              variant="text"
              :disabled="isLoading"
              @click="handleDelete"
            >
              削除
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>

    <v-row v-if="error">
      <v-col cols="12">
        <v-alert type="error" dismissible @click:close="error = null">
          {{ error }}
        </v-alert>
      </v-col>
    </v-row>

    <v-row v-if="session">
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>セッション情報</v-card-title>
          <v-card-text>
            <div class="mb-2">
              <strong>日付:</strong> {{ formattedDate }}
            </div>
            <div class="mb-2">
              <strong>セッション名:</strong> {{ session.name || "無題" }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>参加者一覧</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item
                v-for="sp in session.sessionPlayers"
                :key="sp.id"
              >
                {{ sp.player.name }}
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-if="statistics">
      <v-col cols="12">
        <v-card>
          <v-card-title>統計情報</v-card-title>
          <v-card-text>
            <div class="mb-2">
              <strong>総局数:</strong> {{ statistics.totalRounds }}
            </div>
            <div class="mb-2">
              <strong>総半荘数:</strong> {{ statistics.totalHanchans }}
            </div>
            <v-data-table
              :headers="[
                { title: '順位', key: 'rank' },
                { title: '参加者名', key: 'playerName' },
                { title: '和了回数', key: 'totalWins' },
                { title: 'ツモ回数', key: 'totalTsumo' },
                { title: 'ロン回数', key: 'totalRon' },
                { title: '放銃回数', key: 'totalDealIn' },
                { title: '合計点数（返し点換算）', key: 'totalFinalScore' },
              ]"
              hide-default-footer
              :items="statistics.playerStatistics"
            >
              <template #[`item.totalFinalScore`]="{ item }">
                {{ item.totalFinalScore.toFixed(1) }}点
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            <span>半荘一覧</span>
            <v-btn
              color="primary"
              :disabled="isLoading"
              @click="handleCreateHanchan"
            >
              新規作成
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-data-table
              v-if="session && session.hanchans"
              :headers="[
                { title: '半荘名', key: 'name' },
                { title: '参加者', key: 'playerNames' },
                { title: '開始日時', key: 'startedAt' },
                { title: '終了日時', key: 'endedAt' },
                { title: 'ステータス', key: 'status' },
                { title: '操作', key: 'actions', sortable: false },
              ]"
              :items="session.hanchans.map((hanchan) => ({
                ...hanchan,
                name: hanchan.name || '無題',
                playerNames: hanchan.hanchanPlayers.map((hp) => hp.player.name).join(', '),
                startedAt: new Date(hanchan.startedAt).toLocaleString('ja-JP'),
                endedAt: hanchan.endedAt ? new Date(hanchan.endedAt).toLocaleString('ja-JP') : '-',
                status: hanchan.status === 'IN_PROGRESS' ? '進行中' : '完了済み',
              }))"
              :loading="isLoading"
            >
              <template #[`item.status`]="{ item }">
                <v-chip
                  :color="item.status === '進行中' ? 'primary' : 'success'"
                  size="small"
                >
                  {{ item.status }}
                </v-chip>
              </template>
              <template #[`item.actions`]="{ item }">
                <v-btn
                  size="small"
                  color="primary"
                  variant="text"
                  @click="handleHanchanDetail(item.id)"
                >
                  詳細
                </v-btn>
              </template>
            </v-data-table>
            <v-alert v-else-if="session && (!session.hanchans || session.hanchans.length === 0)" type="info">
              半荘がありません
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

