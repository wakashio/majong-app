import { ref, computed } from "vue";
import { getHanchan, getHanchanStatistics } from "../utils/hanchanApi";
import type { Hanchan, HanchanStatistics } from "../types/hanchan";
import type { ErrorResponse } from "../types/round";

export function useHanchanData() {
  const hanchan = ref<Hanchan | null>(null);
  const hanchanStatistics = ref<HanchanStatistics | null>(null);
  const isLoadingStatistics = ref(false);
  const error = ref<string | null>(null);

  const playerOptions = computed(() => {
    if (!hanchan.value?.hanchanPlayers || hanchan.value.hanchanPlayers.length === 0) {
      return [];
    }
    return hanchan.value.hanchanPlayers
      .filter((hp) => hp && hp.player && hp.player.name)
      .map((hp) => ({
        title: hp.player.name,
        value: hp.playerId,
      }));
  });

  const loadHanchan = async (hanchanId: string): Promise<void> => {
    try {
      const result = await getHanchan(hanchanId);

      if ("error" in result) {
        const errorResponse = result as ErrorResponse;
        error.value = errorResponse.error.message;
        return;
      }

      hanchan.value = result.data;
      // 統計情報も取得
      await loadHanchanStatistics(hanchanId);
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Unknown error occurred";
    }
  };

  const loadHanchanStatistics = async (hanchanId: string): Promise<void> => {
    try {
      isLoadingStatistics.value = true;
      const result = await getHanchanStatistics(hanchanId);

      if ("error" in result) {
        const errorResponse = result as ErrorResponse;
        console.error("統計情報取得エラー:", errorResponse.error.message);
        return;
      }

      hanchanStatistics.value = result.data;
    } catch (err) {
      console.error("統計情報取得エラー:", err);
    } finally {
      isLoadingStatistics.value = false;
    }
  };

  return {
    hanchan,
    hanchanStatistics,
    isLoadingStatistics,
    error,
    playerOptions,
    loadHanchan,
    loadHanchanStatistics,
  };
}

