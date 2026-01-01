<script setup lang="ts">
import type { Round, Score } from "../types/round";

interface Props {
  roundId: string;
  scores: Score[];
  round: Round;
  getRiichiSticksScoreChangeForTable: (score: Score, round: Round, riichiPlayers: string[]) => number;
  getHonbaScoreChangeForTable: (score: Score, round: Round) => number;
  getRiichiPlayers: (roundId: string) => string[];
}

const props = defineProps<Props>();

const scoreHeaders = [
  { title: "参加者", key: "player.name" },
  { title: "点数変動", key: "scoreChange" },
  { title: "積み棒", key: "riichiSticksScoreChange" },
  { title: "本場", key: "honbaScoreChange" },
];

const getRiichiSticksScoreChange = (score: Score): number => {
  const riichiPlayers = props.getRiichiPlayers(props.roundId);
  return props.getRiichiSticksScoreChangeForTable(score, props.round, riichiPlayers);
};

const getHonbaScoreChange = (score: Score): number => {
  return props.getHonbaScoreChangeForTable(score, props.round);
};
</script>

<template>
  <div v-if="props.scores.length > 0" class="mt-4">
    <div class="text-subtitle-2 mb-2">打点記録</div>
    <v-data-table
      :headers="scoreHeaders"
      :items="props.scores"
      :items-per-page="-1"
      hide-default-footer
      class="score-table"
    >
      <template #[`item.scoreChange`]="{ item }">
        <span v-if="(item.scoreChange || 0) !== 0" :class="(item.scoreChange || 0) >= 0 ? 'text-success' : 'text-error'">
          {{ (item.scoreChange || 0) >= 0 ? `+${item.scoreChange || 0}` : item.scoreChange || 0 }}
        </span>
        <span v-else class="text-grey-darken-1">-</span>
      </template>
      <template #[`item.riichiSticksScoreChange`]="{ item }">
        <span v-if="getRiichiSticksScoreChange(item) !== 0">
          {{ getRiichiSticksScoreChange(item) > 0 ? '+' : '' }}{{ getRiichiSticksScoreChange(item) }}
        </span>
        <span v-else class="text-grey-darken-1">-</span>
      </template>
      <template #[`item.honbaScoreChange`]="{ item }">
        <span v-if="getHonbaScoreChange(item) !== 0">
          {{ getHonbaScoreChange(item) > 0 ? '+' : '' }}{{ getHonbaScoreChange(item) }}
        </span>
        <span v-else class="text-grey-darken-1">-</span>
      </template>
    </v-data-table>
  </div>
</template>

