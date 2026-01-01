import { ref } from "vue";

/**
 * ExpansionPanelの展開状態管理Composable
 */
export function useRoundExpansion() {
  const expandedPanels = ref<string[]>([]);

  const expandPanel = (roundId: string): void => {
    if (!expandedPanels.value.includes(roundId)) {
      expandedPanels.value = [...expandedPanels.value, roundId];
    }
  };

  const collapsePanel = (roundId: string): void => {
    expandedPanels.value = expandedPanels.value.filter((id) => id !== roundId);
  };

  const clearPanels = (): void => {
    expandedPanels.value = [];
  };

  return {
    expandedPanels,
    expandPanel,
    collapsePanel,
    clearPanels,
  };
}

