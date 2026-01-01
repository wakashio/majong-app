/**
 * ウマオカ計算サービス
 * 半荘終了時の最終得点を計算します
 */

export interface UmaOkaConfig {
  /** 持ち点（デフォルト: 25000） */
  initialScore: number;
  /** 返し点（デフォルト: 30000） */
  returnScore: number;
  /** ウマ設定（1位, 2位, 3位, 4位の順、デフォルト: [30, 10, -10, -30]、1000点単位で表現） */
  uma: [number, number, number, number];
}

export interface PlayerScore {
  playerId: string;
  currentScore: number;
}

export interface FinalScore {
  playerId: string;
  currentScore: number;
  rank: number;
  oka: number;
  uma: number;
  finalScore: number;
}

/**
 * ウマオカを計算して最終得点を算出する
 * @param playerScores - 各プレイヤーの現在の持ち点
 * @param config - ウマオカ設定
 * @returns 各プレイヤーの最終得点情報
 */
export function calculateUmaOka(
  playerScores: PlayerScore[],
  config: UmaOkaConfig = {
    initialScore: 25000,
    returnScore: 30000,
    uma: [30, 10, -10, -30],
  }
): FinalScore[] {
  if (playerScores.length !== 4) {
    throw new Error("Player scores must contain exactly 4 players");
  }

  // 持ち点でソート（降順、同点の場合は元の順序を維持）
  const sortedScores = [...playerScores].sort((a, b) => {
    if (b.currentScore !== a.currentScore) {
      return b.currentScore - a.currentScore;
    }
    // 同点の場合は元の順序を維持（先に出現した方が上位）
    const originalIndexA = playerScores.findIndex((p) => p.playerId === a.playerId);
    const originalIndexB = playerScores.findIndex((p) => p.playerId === b.playerId);
    return originalIndexA - originalIndexB;
  });

  // 順位を決定
  const rankedScores: (PlayerScore & { rank: number })[] = sortedScores.map((score, index) => ({
    ...score,
    rank: index + 1,
  }));

  // オカを計算（返し点 - 持ち点）
  const oka = config.returnScore - config.initialScore;

  // 各プレイヤーの最終得点を計算
  const finalScores: FinalScore[] = rankedScores.map((rankedScore) => {
    // ウマの値は1000点単位なので、1000倍する
    const uma = config.uma[rankedScore.rank - 1] * 1000;
    
    // 全員から返し点を減算
    let finalScore = rankedScore.currentScore - config.returnScore + uma;
    
    // 1位に20000を加算
    if (rankedScore.rank === 1) {
      finalScore += 20000;
    }

    return {
      playerId: rankedScore.playerId,
      currentScore: rankedScore.currentScore,
      rank: rankedScore.rank,
      oka,
      uma,
      finalScore: Math.round(finalScore),
    };
  });

  return finalScores;
}

