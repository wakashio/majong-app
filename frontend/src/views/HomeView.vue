<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getHanchans } from '../utils/hanchanApi'
import { getSessions } from '../utils/sessionApi'
import Breadcrumbs from '../components/Breadcrumbs.vue'
import type { Hanchan, HanchansListResponse, ErrorResponse } from '../types/hanchan'
import type { SessionListItem, SessionsListResponse } from '../types/session'

const router = useRouter()
const recentSessions = ref<SessionListItem[]>([])
const recentHanchans = ref<Hanchan[]>([])
const sessionsLoading = ref(false)
const hanchansLoading = ref(false)
const sessionsError = ref<string | null>(null)
const hanchansError = ref<string | null>(null)

const loadRecentSessions = async () => {
  sessionsLoading.value = true
  sessionsError.value = null

  try {
    const response = await getSessions(5, 0)
    if ('error' in response) {
      sessionsError.value = (response as ErrorResponse).error.message || 'セッション一覧の取得に失敗しました'
      return
    }

    const data = response as SessionsListResponse
    recentSessions.value = data.data
  } catch (err) {
    sessionsError.value = 'セッション一覧の取得に失敗しました'
    console.error(err)
  } finally {
    sessionsLoading.value = false
  }
}

const loadRecentHanchans = async () => {
  hanchansLoading.value = true
  hanchansError.value = null

  try {
    const response = await getHanchans()
    if ('error' in response) {
      hanchansError.value = (response as ErrorResponse).error.message || '半荘一覧の取得に失敗しました'
      return
    }

    const data = response as HanchansListResponse
    recentHanchans.value = data.data
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime()
        const dateB = new Date(b.createdAt).getTime()
        return dateB - dateA
      })
      .slice(0, 5)
  } catch (err) {
    hanchansError.value = '半荘一覧の取得に失敗しました'
    console.error(err)
  } finally {
    hanchansLoading.value = false
  }
}

const navigateToSession = (sessionId: string) => {
  router.push(`/sessions/${sessionId}`)
}

const navigateToHanchan = (hanchanId: string) => {
  router.push(`/hanchans/${hanchanId}/rounds`)
}

const navigateToNewHanchan = () => {
  router.push('/hanchans/new')
}

const navigateToPlayers = () => {
  router.push('/players')
}

const navigateToHanchans = () => {
  router.push('/hanchans')
}

const navigateToNewSession = () => {
  router.push('/sessions/new')
}

const getStatusText = (status: string) => {
  return status === 'IN_PROGRESS' ? '進行中' : '完了済み'
}

const getStatusColor = (status: string) => {
  return status === 'IN_PROGRESS' ? 'primary' : 'success'
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('ja-JP')
}

const getSessionPlayerNames = (session: SessionListItem) => {
  if (!session.players || session.players.length === 0) {
    return '参加者未設定'
  }
  return session.players.map((p) => p.name).join(', ')
}

const getPlayerNames = (hanchan: Hanchan) => {
  if (!hanchan.hanchanPlayers || hanchan.hanchanPlayers.length === 0) {
    return '参加者未設定'
  }
  return hanchan.hanchanPlayers
    .sort((a, b) => a.seatPosition - b.seatPosition)
    .map((hp) => hp.player.name)
    .join(', ')
}

onMounted(() => {
  loadRecentSessions()
  loadRecentHanchans()
})
</script>

<template>
  <v-container>
    <v-row>
      <v-col cols="12" class="mb-2">
        <Breadcrumbs />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" md="8">
        <v-card class="mb-4">
          <v-card-title>最近のセッション</v-card-title>
          <v-card-text>
            <v-alert
              v-if="sessionsError"
              type="error"
              class="mb-4"
            >
              {{ sessionsError }}
            </v-alert>

            <v-progress-linear
              v-if="sessionsLoading"
              indeterminate
              color="primary"
              class="mb-4"
            ></v-progress-linear>

            <v-list v-else-if="recentSessions.length > 0">
              <v-list-item
                v-for="session in recentSessions"
                :key="session.id"
                :title="session.name || '無題'"
                :subtitle="`参加者: ${getSessionPlayerNames(session)} | 日付: ${formatDate(session.date)}`"
              >
                <template v-slot:append>
                  <v-btn
                    variant="text"
                    size="small"
                    @click="navigateToSession(session.id)"
                  >
                    詳細
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>

            <v-alert
              v-else
              type="info"
            >
              セッションがまだありません。
            </v-alert>
          </v-card-text>
        </v-card>

        <v-card class="mb-4">
          <v-card-title>最近の半荘</v-card-title>
          <v-card-text>
            <v-alert
              v-if="hanchansError"
              type="error"
              class="mb-4"
            >
              {{ hanchansError }}
            </v-alert>

            <v-progress-linear
              v-if="hanchansLoading"
              indeterminate
              color="primary"
              class="mb-4"
            ></v-progress-linear>

            <v-list v-else-if="recentHanchans.length > 0">
              <v-list-item
                v-for="hanchan in recentHanchans"
                :key="hanchan.id"
                :title="hanchan.name || '無題'"
                :subtitle="`参加者: ${getPlayerNames(hanchan)} | 開始日時: ${formatDate(hanchan.createdAt)}`"
              >
                <template v-slot:append>
                  <v-chip
                    :color="getStatusColor(hanchan.status)"
                    size="small"
                    class="mr-2"
                  >
                    {{ getStatusText(hanchan.status) }}
                  </v-chip>
                  <v-btn
                    variant="text"
                    size="small"
                    @click="navigateToHanchan(hanchan.id)"
                  >
                    詳細
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>

            <v-alert
              v-else
              type="info"
            >
              半荘がまだありません。新規半荘を作成してください。
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>クイックアクション</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item
                prepend-icon="mdi-calendar-clock"
                title="新規セッション作成"
                @click="navigateToNewSession"
              ></v-list-item>
              <v-list-item
                prepend-icon="mdi-plus-circle"
                title="新規半荘開始"
                @click="navigateToNewHanchan"
              ></v-list-item>
              <v-list-item
                prepend-icon="mdi-account-group"
                title="参加者管理"
                @click="navigateToPlayers"
              ></v-list-item>
              <v-list-item
                prepend-icon="mdi-cards"
                title="半荘一覧"
                @click="navigateToHanchans"
              ></v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
