import {
  RoundResultType,
} from "../types/round";

/**
 * ツモ点数表の型定義
 */
interface TsumoScoreTable {
  dealer: {
    [totalScore: number]: {
      fromNonDealer: number;
    };
  };
  nonDealer: {
    [totalScore: number]: {
      fromDealer: number;
      fromNonDealer: number;
    };
  };
}

/**
 * ツモ点数表
 * 点数表の範囲: 1000点〜144000点（トリプル役満まで）
 * 本場・積み棒は含まれず、別途計算して加算
 */
const tsumoScoreTable: TsumoScoreTable = {
  dealer: {
    1500: { fromNonDealer: 500 },
    2100: { fromNonDealer: 700 },
    2400: { fromNonDealer: 800 },
    3000: { fromNonDealer: 1000 },
    3900: { fromNonDealer: 1300 },
    4500: { fromNonDealer: 1500 },
    4800: { fromNonDealer: 1600 },
    5400: { fromNonDealer: 1800 },
    6000: { fromNonDealer: 2000 },
    6900: { fromNonDealer: 2300 },
    7800: { fromNonDealer: 2600 },
    8700: { fromNonDealer: 2900 },
    9600: { fromNonDealer: 3200 },
    10600: { fromNonDealer: 3600 },
    12000: { fromNonDealer: 4000 },
    18000: { fromNonDealer: 6000 },
    24000: { fromNonDealer: 8000 },
    36000: { fromNonDealer: 12000 },
    48000: { fromNonDealer: 16000 },
    96000: { fromNonDealer: 32000 },
    144000: { fromNonDealer: 48000 },
  },
  nonDealer: {
    1100: { fromDealer: 500, fromNonDealer: 300 },
    1500: { fromDealer: 700, fromNonDealer: 400 },
    1600: { fromDealer: 800, fromNonDealer: 400 },
    2000: { fromDealer: 1000, fromNonDealer: 500 },
    2400: { fromDealer: 1200, fromNonDealer: 600 },
    2600: { fromDealer: 1300, fromNonDealer: 700 },
    2900: { fromDealer: 1500, fromNonDealer: 800 },
    3200: { fromDealer: 1600, fromNonDealer: 800 },
    3600: { fromDealer: 1800, fromNonDealer: 900 },
    4000: { fromDealer: 2000, fromNonDealer: 1000 },
    4400: { fromDealer: 2300, fromNonDealer: 1200 },
    5200: { fromDealer: 2600, fromNonDealer: 1300 },
    5600: { fromDealer: 2900, fromNonDealer: 1500 },
    6400: { fromDealer: 3200, fromNonDealer: 1600 },
    6800: { fromDealer: 3400, fromNonDealer: 1700 },
    7200: { fromDealer: 3600, fromNonDealer: 1800 },
    8000: { fromDealer: 4000, fromNonDealer: 2000 },
    12000: { fromDealer: 6000, fromNonDealer: 3000 },
    16000: { fromDealer: 8000, fromNonDealer: 4000 },
    24000: { fromDealer: 12000, fromNonDealer: 6000 },
    32000: { fromDealer: 16000, fromNonDealer: 8000 },
    64000: { fromDealer: 32000, fromNonDealer: 16000 },
    96000: { fromDealer: 48000, fromNonDealer: 24000 },
  },
};

/**
 * 基本点を計算する
 * @param han - 飜数
 * @param fu - 符
 * @returns 基本点
 */
export function calculateBaseScore(han: number, fu: number): number {
  if (han < 1) {
    throw new Error("han must be 1 or greater");
  }
  if (fu < 20) {
    throw new Error("fu must be 20 or greater");
  }

  // 満貫以上の場合は上限を適用（基本点の上限）
  // 役満（13飜以上）: 基本点上限8000点
  if (han >= 13) {
    return 8000;
  }
  // 三倍満（11-12飜）: 基本点上限6000点
  if (han === 11 || han === 12) {
    return 6000;
  }
  // 倍満（8-10飜）: 基本点上限4000点
  if (han >= 8 && han <= 10) {
    return 4000;
  }
  // 跳満（6-7飜）: 基本点上限3000点
  if (han === 6 || han === 7) {
    return 3000;
  }
  // 満貫（5飜、または4飜40符以上、または3飜70符以上）: 基本点上限2000点
  if (han === 5 || (han === 4 && fu >= 40) || (han === 3 && fu >= 70)) {
    return 2000;
  }

  // 基本点 = fu × 2^(han+2)
  const baseScore = fu * Math.pow(2, han + 2);

  // 1000点未満は切り上げ（100点単位）
  if (baseScore < 1000) {
    return Math.ceil(baseScore / 100) * 100;
  }

  // 満貫以上の場合は上限を適用
  if (baseScore >= 2000) {
    return 2000;
  }

  return baseScore;
}

/**
 * ツモの打点を計算する（点数表を使用）
 * フロー:
 * 1. 和了の点数を入力（フロントエンド） - totalScore（本場・積み棒を含まない）
 * 2. 点数表から支払い点数を取得し、本場を加算（バックエンド）
 * 3. 受け取る点数を支払う点数の合計と積み棒から算出（バックエンド）
 * @param totalScore - 和了点（本場・積み棒を含まない）
 * @param honba - 本場
 * @param riichiSticks - 積み棒
 * @param isDealer - 親かどうか
 * @returns 和了者の打点と供託者の打点
 */
export function calculateTsumoScore(
  totalScore: number,
  honba: number,
  riichiSticks: number,
  isDealer: boolean
): {
  winnerScore: number;
  loserScores: {
    fromDealer: number;
    fromNonDealer: number;
  };
} {
  if (isDealer) {
    // 親がツモ
    const scoreEntry = tsumoScoreTable.dealer[totalScore];
    if (!scoreEntry) {
      throw new Error(`Invalid total score for dealer tsumo: ${totalScore}`);
    }
    // 点数表から子1人あたりの支払い点数を取得し、本場を加算
    const fromNonDealer = scoreEntry.fromNonDealer + honba * 100;
    // 受け取る点数を支払う点数の合計と積み棒から算出
    const actualWinnerScore = fromNonDealer * 3 + riichiSticks * 1000;
    return {
      winnerScore: actualWinnerScore,
      loserScores: {
        fromDealer: 0,
        fromNonDealer,
      },
    };
  } else {
    // 子がツモ
    const scoreEntry = tsumoScoreTable.nonDealer[totalScore];
    if (!scoreEntry) {
      throw new Error(`Invalid total score for non-dealer tsumo: ${totalScore}`);
    }
    // 点数表から親からの支払い点数と子からの支払い点数を取得し、本場を加算
    const fromDealer = scoreEntry.fromDealer + honba * 100;
    const fromNonDealer = scoreEntry.fromNonDealer + honba * 100;
    // 受け取る点数を支払う点数の合計と積み棒から算出
    const actualWinnerScore = fromDealer + fromNonDealer * 2 + riichiSticks * 1000;
    return {
      winnerScore: actualWinnerScore,
      loserScores: {
        fromDealer,
        fromNonDealer,
      },
    };
  }
}

/**
 * ロンの打点を計算する
 * フロー:
 * 1. 和了の点数を入力（フロントエンド） - winnerScore（積み棒を含まない）
 * 2. 支払う点数を本場を含めて算出（バックエンド）
 * 3. 受け取る点数を支払う点数の合計と積み棒から算出（バックエンド）
 * @param winnerScore - 和了者の点数（積み棒を含まない）
 * @param _honba - 本場（現在は使用していないが、将来の拡張のために保持）
 * @param riichiSticks - 積み棒
 * @param _isDealer - 和了者が親かどうか（現在は使用していないが、将来の拡張のために保持）
 * @param _isTargetDealer - 放銃者が親かどうか（現在は使用していないが、将来の拡張のために保持）
 * @returns 和了者の打点と放銃者の打点
 */
export function calculateRonScore(
  winnerScore: number,
  _honba: number,
  riichiSticks: number,
  _isDealer: boolean,
  _isTargetDealer: boolean
): {
  winnerScore: number;
  loserScore: number;
} {
  // 2. 支払う点数を本場を含めて算出（ロンの場合、和了者の点数 = 放銃者の支払い）
  const loserScore = winnerScore;
  // 3. 受け取る点数を支払う点数の合計と積み棒から算出
  const actualWinnerScore = loserScore + riichiSticks * 1000;
  return {
    winnerScore: actualWinnerScore,
    loserScore,
  };
}

/**
 * 流局の打点を計算する
 * @param resultType - 結果タイプ
 * @param isNagashiMangan - 流し満貫かどうか
 * @returns 各参加者の打点（通常は0、流し満貫の場合は-2000）
 */
export function calculateDrawScore(
  resultType: RoundResultType,
  isNagashiMangan: boolean
): {
  scores: number[];
} {
  if (resultType === RoundResultType.NAGASHI_MANGAN || isNagashiMangan) {
    // 流し満貫: 各参加者から2000点を徴収
    return {
      scores: [-2000, -2000, -2000, -2000],
    };
  } else {
    // 通常の流局、特殊流局: 点数変動なし
    return {
      scores: [0, 0, 0, 0],
    };
  }
}

/**
 * 打点計算の結果
 */
export interface CalculatedScoreResult {
  playerId: string;
  scoreChange: number;
  isDealer: boolean;
  isWinner: boolean;
  isRonTarget?: boolean;
  han?: number;
  fu?: number;
  yaku?: string[];
  calculatedScore: number;
}

/**
 * 打点を計算する（和了者の点数から直接計算）
 * @param params - 計算パラメータ
 * @returns 計算結果
 */
export function calculateScore(params: {
  resultType: RoundResultType;
  winnerPlayerId?: string;
  ronTargetPlayerId?: string;
  winnerScore?: number;
  yaku?: string[];
  isNagashiMangan?: boolean;
  dealerPlayerId: string;
  playerIds: string[];
  honba: number;
  riichiSticks: number;
}): CalculatedScoreResult[] {
  const {
    resultType,
    winnerPlayerId,
    ronTargetPlayerId,
    winnerScore,
    yaku,
    isNagashiMangan,
    dealerPlayerId,
    playerIds,
    honba,
    riichiSticks,
  } = params;

  if (resultType === RoundResultType.DRAW || resultType === RoundResultType.SPECIAL_DRAW) {
    // 流局の場合
    const drawResult = calculateDrawScore(resultType, isNagashiMangan || false);
    return playerIds.map((playerId, index) => ({
      playerId,
      scoreChange: drawResult.scores[index] || 0,
      isDealer: playerId === dealerPlayerId,
      isWinner: false,
      isRonTarget: undefined,
      han: undefined,
      fu: undefined,
      yaku: undefined,
      calculatedScore: Math.abs(drawResult.scores[index] || 0),
    }));
  }

  if (resultType === RoundResultType.NAGASHI_MANGAN) {
    // 流し満貫の場合
    const drawResult = calculateDrawScore(resultType, true);
    return playerIds.map((playerId, index) => ({
      playerId,
      scoreChange: drawResult.scores[index] || 0,
      isDealer: playerId === dealerPlayerId,
      isWinner: false,
      isRonTarget: undefined,
      han: undefined,
      fu: undefined,
      yaku: undefined,
      calculatedScore: Math.abs(drawResult.scores[index] || 0),
    }));
  }

  if (!winnerPlayerId || winnerScore === undefined) {
    throw new Error("winnerPlayerId and winnerScore are required for TSUMO or RON");
  }

  if (!playerIds.includes(winnerPlayerId)) {
    throw new Error("winnerPlayerId must be a player in the round");
  }

  const isWinnerDealer = winnerPlayerId === dealerPlayerId;

  if (resultType === RoundResultType.TSUMO) {
    // ツモの場合
    const tsumoResult = calculateTsumoScore(
      winnerScore,
      honba,
      riichiSticks,
      isWinnerDealer
    );

    return playerIds.map((playerId) => {
      const isDealer = playerId === dealerPlayerId;
      const isWinner = playerId === winnerPlayerId;

      if (isWinner) {
        return {
          playerId,
          scoreChange: tsumoResult.winnerScore,
          isDealer,
          isWinner: true,
          isRonTarget: undefined,
          han: undefined,
          fu: undefined,
          yaku,
          calculatedScore: tsumoResult.winnerScore,
        };
      } else {
        const scoreChange = isDealer
          ? -tsumoResult.loserScores.fromDealer
          : -tsumoResult.loserScores.fromNonDealer;
        return {
          playerId,
          scoreChange,
          isDealer,
          isWinner: false,
          isRonTarget: undefined,
          han: undefined,
          fu: undefined,
          yaku: undefined,
          calculatedScore: Math.abs(scoreChange),
        };
      }
    });
  }

  if (resultType === RoundResultType.RON) {
    // ロンの場合
    if (!ronTargetPlayerId) {
      throw new Error("ronTargetPlayerId is required for RON");
    }

    if (!playerIds.includes(ronTargetPlayerId)) {
      throw new Error("ronTargetPlayerId must be a player in the round");
    }

    const isTargetDealer = ronTargetPlayerId === dealerPlayerId;
    const ronResult = calculateRonScore(
      winnerScore,
      honba,
      riichiSticks,
      isWinnerDealer,
      isTargetDealer
    );

    return playerIds.map((playerId) => {
      const isDealer = playerId === dealerPlayerId;
      const isWinner = playerId === winnerPlayerId;
      const isRonTarget = playerId === ronTargetPlayerId;

      if (isWinner) {
        return {
          playerId,
          scoreChange: ronResult.winnerScore,
          isDealer,
          isWinner: true,
          isRonTarget: false,
          han: undefined,
          fu: undefined,
          yaku,
          calculatedScore: ronResult.winnerScore,
        };
      } else if (isRonTarget) {
        return {
          playerId,
          scoreChange: -ronResult.loserScore,
          isDealer,
          isWinner: false,
          isRonTarget: true,
          han: undefined,
          fu: undefined,
          yaku: undefined,
          calculatedScore: ronResult.loserScore,
        };
      } else {
        return {
          playerId,
          scoreChange: 0,
          isDealer,
          isWinner: false,
          isRonTarget: false,
          han: undefined,
          fu: undefined,
          yaku: undefined,
          calculatedScore: 0,
        };
      }
    });
  }

  throw new Error(`Unsupported resultType: ${resultType}`);
}

/**
 * 点数表のラベル一覧を取得する
 * @param isDealer - 親かどうか
 * @returns 点数とラベルの配列
 */
export interface ScoreLabel {
  score: number;
  label: string;
}

export function getTsumoScoreLabels(isDealer: boolean): ScoreLabel[] {
  if (isDealer) {
    // 親がツモ: 「子1人あたりの点数」+「オール」
    return Object.keys(tsumoScoreTable.dealer)
      .map(Number)
      .sort((a, b) => a - b)
      .map((score) => ({
        score,
        label: `${tsumoScoreTable.dealer[score].fromNonDealer}オール`,
      }));
  } else {
    // 子がツモ: 「子からの点数」+「/」+「親からの点数」
    return Object.keys(tsumoScoreTable.nonDealer)
      .map(Number)
      .sort((a, b) => a - b)
      .map((score) => ({
        score,
        label: `${tsumoScoreTable.nonDealer[score].fromNonDealer}/${tsumoScoreTable.nonDealer[score].fromDealer}`,
      }));
  }
}

