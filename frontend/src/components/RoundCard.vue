<script setup lang="ts">
import { type Round, type RoundAction, type Score } from "../types/round";
import ActionList from "./ActionList.vue";
import ScoreTable from "./ScoreTable.vue";
import RoundActionButtons from "./RoundActionButtons.vue";

interface Props {
  round: Round;
  roundLabel: string;
  actions: RoundAction[];
  scores: Score[];
  isLoading: boolean;
  getActionText: (action: RoundAction) => string;
  getRiichiSticksScoreChangeForTable: (score: Score, round: Round, riichiPlayers: string[]) => number;
  getHonbaScoreChangeForTable: (score: Score, round: Round) => number;
  getRiichiPlayers: (roundId: string) => string[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "add-action": [roundId: string];
  "delete-action": [roundId: string, actionId: string];
  "end-round": [roundId: string];
  "next-round": [roundId: string];
  "delete-round": [roundId: string];
}>();

const handleAddAction = (): void => {
  emit("add-action", props.round.id);
};

const handleDeleteAction = (actionId: string): void => {
  emit("delete-action", props.round.id, actionId);
};

const handleEndRound = (): void => {
  emit("end-round", props.round.id);
};

const handleNextRound = (): void => {
  emit("next-round", props.round.id);
};

const handleDeleteRound = (): void => {
  emit("delete-round", props.round.id);
};
</script>

<template>
  <div>
    <ActionList
      :round-id="props.round.id"
      :actions="props.actions"
      :is-loading="props.isLoading"
      :get-action-text="props.getActionText"
      @add="handleAddAction"
      @delete="handleDeleteAction"
    />
    <ScoreTable
      v-if="props.round.endedAt && props.scores.length > 0"
      :round-id="props.round.id"
      :scores="props.scores"
      :round="props.round"
      :get-riichi-sticks-score-change-for-table="props.getRiichiSticksScoreChangeForTable"
      :get-honba-score-change-for-table="props.getHonbaScoreChangeForTable"
      :get-riichi-players="props.getRiichiPlayers"
    />
    <RoundActionButtons
      :round="props.round"
      :is-loading="props.isLoading"
      @end="handleEndRound"
      @next="handleNextRound"
      @delete="handleDeleteRound"
    />
  </div>
</template>

