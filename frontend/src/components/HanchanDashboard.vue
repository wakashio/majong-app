<script setup lang="ts">
import type { HanchanStatistics } from "../types/hanchan";

interface Props {
  hanchanStatistics: HanchanStatistics | null;
  isLoading: boolean;
  getRankColor: (rank: number) => string;
}

const props = defineProps<Props>();

const dashboardHeaders = [
  { title: "参加者", key: "playerName", sortable: false },
  { title: "現在の得点", key: "currentScore", sortable: false },
  { title: "順位", key: "currentRank", sortable: false },
  { title: "和了", key: "totalWins", sortable: false },
  { title: "リーチ", key: "totalRiichi", sortable: false },
];
</script>

<template>
  <v-card v-if="props.hanchanStatistics" class="mb-4">
    <v-card-title>ダッシュボード</v-card-title>
    <v-card-text>
      <v-progress-linear
        v-if="props.isLoading"
        indeterminate
        color="primary"
        class="mb-4"
      ></v-progress-linear>
      <v-data-table
        v-else
        :headers="dashboardHeaders"
        :items="props.hanchanStatistics.players"
        :items-per-page="-1"
        hide-default-footer
        class="elevation-1 dashboard-table"
      >
        <template #[`item.playerName`]="{ item }">
          <strong>{{ item.playerName }}</strong>
        </template>
        <template #[`item.currentScore`]="{ item }">
          {{ item.currentScore.toLocaleString() }}点
        </template>
        <template #[`item.currentRank`]="{ item }">
          <v-chip :color="props.getRankColor(item.currentRank)" size="small">
            {{ item.currentRank }}位
          </v-chip>
        </template>
        <template #[`item.totalWins`]="{ item }">
          ツモ: {{ item.totalTsumo }} / ロン: {{ item.totalRon }}
        </template>
        <template #[`item.totalRiichi`]="{ item }">
          {{ item.totalRiichi }}
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.dashboard-table :deep(.v-data-table__td),
.dashboard-table :deep(.v-data-table__th) {
  white-space: nowrap;
}
</style>
