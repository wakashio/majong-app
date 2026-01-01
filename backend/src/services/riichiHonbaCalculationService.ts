import { RoundResultType } from "../types/round";

/**
 * 次局の積み棒を計算する
 * @param currentRiichiSticks - 現在の積み棒数
 * @param resultType - 結果タイプ
 * @returns 次局の積み棒数
 */
export function calculateNextRiichiSticks(
  currentRiichiSticks: number,
  resultType: RoundResultType
): number {
  // 和了または流し満貫の場合、積み棒はリセット
  if (
    resultType === RoundResultType.TSUMO ||
    resultType === RoundResultType.RON ||
    resultType === RoundResultType.NAGASHI_MANGAN
  ) {
    return 0;
  }
  // 流局の場合、積み棒は持ち越される
  return currentRiichiSticks;
}

/**
 * 親が連荘する条件を判定する共通関数
 * @param resultType - 結果タイプ
 * @param isDealerWinner - 親が和了したかどうか
 * @param isDealerTenpai - 親がテンパイしているかどうか（流局時のみ有効）
 * @returns 親が連荘する場合true
 */
export function isDealerRenchan(
  resultType: RoundResultType,
  isDealerWinner: boolean,
  isDealerTenpai?: boolean
): boolean {
  // 親が和了した場合
  if (isDealerWinner) {
    return true;
  }
  // 流局（通常の流局・特殊流局）で親がテンパイしていた場合
  if (
    (resultType === RoundResultType.DRAW || resultType === RoundResultType.SPECIAL_DRAW) &&
    isDealerTenpai === true
  ) {
    return true;
  }
  return false;
}

/**
 * 次局の本場を計算する
 * @param currentHonba - 現在の本場数
 * @param resultType - 結果タイプ
 * @param isDealerWinner - 親が和了したかどうか
 * @param isDealerTenpai - 親がテンパイしているかどうか（流局時のみ有効）
 * @param isAllNoten - 全員ノーテンかどうか（流局時のみ有効）
 * @returns 次局の本場数
 */
export function calculateNextHonba(
  currentHonba: number,
  resultType: RoundResultType,
  isDealerWinner: boolean,
  isDealerTenpai?: boolean,
  isAllNoten?: boolean
): number {
  // 親が連荘する場合（親が和了した場合、または流局で親がテンパイした場合）
  if (isDealerRenchan(resultType, isDealerWinner, isDealerTenpai)) {
    return currentHonba + 1;
  }
  // 子が和了した場合、または流し満貫の場合
  if (
    resultType === RoundResultType.TSUMO ||
    resultType === RoundResultType.RON ||
    resultType === RoundResultType.NAGASHI_MANGAN
  ) {
    return 0;
  }
  // 流局で全員ノーテンの場合（連荘ではないが本場は増加）
  if (
    (resultType === RoundResultType.DRAW || resultType === RoundResultType.SPECIAL_DRAW) &&
    isAllNoten === true
  ) {
    return currentHonba + 1;
  }
  // 流局で親がノーテンで全員ノーテンでない場合
  return currentHonba;
}

/**
 * 連荘を判定する
 * @param resultType - 結果タイプ
 * @param isDealerWinner - 親が和了したかどうか
 * @param isDealerTenpai - 親がテンパイしているかどうか（流局時のみ有効）
 * @returns 連荘かどうか
 */
export function calculateIsRenchan(
  resultType: RoundResultType,
  isDealerWinner: boolean,
  isDealerTenpai?: boolean
): boolean {
  return isDealerRenchan(resultType, isDealerWinner, isDealerTenpai);
}

/**
 * 次局の積み棒・本場・連荘を一括計算する
 * @param params - 計算パラメータ
 * @returns 次局の設定
 */
export interface NextRoundSettings {
  nextRiichiSticks: number;
  nextHonba: number;
  isRenchan: boolean;
}

export function calculateNextRoundSettings(params: {
  currentRiichiSticks: number;
  currentHonba: number;
  resultType: RoundResultType;
  isDealerWinner: boolean;
  isDealerTenpai?: boolean;
  isAllNoten?: boolean;
}): NextRoundSettings {
  const {
    currentRiichiSticks,
    currentHonba,
    resultType,
    isDealerWinner,
    isDealerTenpai,
    isAllNoten,
  } = params;

  const nextRiichiSticks = calculateNextRiichiSticks(
    currentRiichiSticks,
    resultType
  );
  const nextHonba = calculateNextHonba(
    currentHonba,
    resultType,
    isDealerWinner,
    isDealerTenpai,
    isAllNoten
  );
  const isRenchan = calculateIsRenchan(
    resultType,
    isDealerWinner,
    isDealerTenpai
  );

  return {
    nextRiichiSticks,
    nextHonba,
    isRenchan,
  };
}

/**
 * 次の局の番号を計算する
 * @param currentRoundNumber - 現在の局番号
 * @param isRenchan - 連荘かどうか
 * @returns 次の局の番号
 */
export function calculateNextRoundNumber(
  currentRoundNumber: number,
  isRenchan: boolean
): number {
  // 連荘の場合: 現在の局番号を維持
  if (isRenchan) {
    return currentRoundNumber;
  }
  // 連荘でない場合: 局番号+1（最大16局まで）
  return Math.min(currentRoundNumber + 1, 16);
}

/**
 * 次の局の風を計算する
 * @param currentRoundNumber - 現在の局番号
 * @param isRenchan - 連荘かどうか
 * @returns 次の局の風
 */
export function calculateNextWind(
  currentRoundNumber: number,
  isRenchan: boolean
): "EAST" | "SOUTH" | "WEST" | "NORTH" {
  // 連荘の場合: 現在の風を維持（局番号から計算）
  if (isRenchan) {
    if (currentRoundNumber >= 1 && currentRoundNumber <= 4) return "EAST";
    if (currentRoundNumber >= 5 && currentRoundNumber <= 8) return "SOUTH";
    if (currentRoundNumber >= 9 && currentRoundNumber <= 12) return "WEST";
    if (currentRoundNumber >= 13 && currentRoundNumber <= 16) return "NORTH";
    return "EAST";
  }
  // 連荘でない場合: 次の風（局番号+1から計算）
  const nextRoundNumber = currentRoundNumber + 1;
  if (nextRoundNumber >= 1 && nextRoundNumber <= 4) return "EAST";
  if (nextRoundNumber >= 5 && nextRoundNumber <= 8) return "SOUTH";
  if (nextRoundNumber >= 9 && nextRoundNumber <= 12) return "WEST";
  if (nextRoundNumber >= 13 && nextRoundNumber <= 16) return "NORTH";
  return "EAST";
}

