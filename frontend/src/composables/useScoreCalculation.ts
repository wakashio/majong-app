import type { Round, Score } from "../types/round";
import { RoundResultType } from "../types/round";
import type { HanchanPlayer } from "../types/hanchan";

/**
 * リーチ者を取得
 */
export function getRiichiPlayers(
  roundId: string | null,
  getAllActions: (roundId: string) => Array<{ type: string; playerId: string }>
): string[] {
  if (!roundId) {
    return [];
  }
  const actions = getAllActions(roundId);
  const riichiActions = actions.filter((action) => action.type === "RIICHI");
  return riichiActions.map((action) => action.playerId);
}

/**
 * 上家のseatPositionを計算する
 */
function calculateUpperSeatPosition(ronTargetSeatPosition: number): number {
  return (ronTargetSeatPosition + 3) % 4;
}

/**
 * ダブロン・トリロンの判定
 */
function isDoubleRon(resultType: RoundResultType | null, winnerCount: number): boolean {
  return resultType === RoundResultType.RON && winnerCount >= 2;
}

/**
 * 放銃者から見て最も近い上家の和了者を取得
 */
function findUpperSeatWinner(
  winners: Score[],
  ronTargetPlayerId: string,
  hanchanPlayers: HanchanPlayer[]
): Score | null {
  const ronTargetPlayer = hanchanPlayers.find((hp) => hp.playerId === ronTargetPlayerId);
  if (!ronTargetPlayer) {
    return null;
  }

  const upperSeatPosition = calculateUpperSeatPosition(ronTargetPlayer.seatPosition);
  const upperSeatPlayer = hanchanPlayers.find((hp) => hp.seatPosition === upperSeatPosition);
  if (!upperSeatPlayer) {
    return null;
  }

  const upperSeatWinner = winners.find((w) => w.playerId === upperSeatPlayer.playerId);
  return upperSeatWinner || null;
}

/**
 * 打点記録テーブル用: 積み棒による点数変動を計算
 */
export function getRiichiSticksScoreChangeForTable(
  score: Score,
  round: Round,
  riichiPlayers: string[],
  allScores: Score[],
  hanchanPlayers: HanchanPlayer[]
): number {
  const riichiSticks = round.riichiSticks || 0;
  let scoreChange = 0;

  // リーチ棒による点数変動（リーチを宣言したプレイヤーは-1000点）
  if (riichiPlayers.includes(score.playerId)) {
    scoreChange -= 1000;
  }

  // 積み棒による点数変動（和了時のみ）
  if (
    (round.resultType === RoundResultType.TSUMO ||
      round.resultType === RoundResultType.RON ||
      round.resultType === RoundResultType.NAGASHI_MANGAN) &&
    riichiSticks > 0
  ) {
    if (round.resultType === RoundResultType.RON) {
      // ロンの場合、ダブロン判定
      const winners = allScores.filter((s) => s.isWinner);
      const winnerCount = winners.length;
      const isDoubleRonResult = isDoubleRon(round.resultType, winnerCount);

      if (isDoubleRonResult) {
        // ダブロン・トリロン: 放銃者から見て最も近い上家のみが積み棒を獲得
        // まず加算対象を特定
        const ronTarget = allScores.find((s) => s.isRonTarget === true);
        if (ronTarget) {
          const upperSeatWinner = findUpperSeatWinner(winners, ronTarget.playerId, hanchanPlayers);
          // 特定した一人にのみ加算
          if (upperSeatWinner && upperSeatWinner.playerId === score.playerId) {
            scoreChange += riichiSticks * 1000;
          }
        }
      } else {
        // 通常のロン: 和了者が積み棒を獲得
        if (score.isWinner) {
          scoreChange += riichiSticks * 1000;
        }
      }
    } else {
      // ツモ・流し満貫: 和了者が積み棒を獲得
      if (score.isWinner) {
        scoreChange += riichiSticks * 1000;
      }
    }
  }

  return scoreChange;
}

/**
 * 打点記録テーブル用: 本場による点数変動を計算
 */
export function getHonbaScoreChangeForTable(
  score: Score,
  round: Round,
  allScores: Score[],
  hanchanPlayers: HanchanPlayer[]
): number {
  const honba = round.honba || 0;
  if (honba === 0) {
    return 0;
  }

  let scoreChange = 0;

  // 本場による点数変動
  if (round.resultType === RoundResultType.TSUMO) {
    if (score.isWinner) {
      // 和了者は本場 × 300点を獲得（ツモ時、親子の差はない）
      scoreChange += honba * 300;
    } else {
      // 非和了者は本場 × 100点を支払う（ツモ時、親子の差はない）
      scoreChange -= honba * 100;
    }
  } else if (round.resultType === RoundResultType.RON) {
    const winners = allScores.filter((s) => s.isWinner);
    const winnerCount = winners.length;
    const isDoubleRonResult = isDoubleRon(round.resultType, winnerCount);

    if (isDoubleRonResult) {
      // ダブロン・トリロン: 放銃者から見て最も近い上家のみが本場の点数を受け取る
      // まず加算対象を特定
      const ronTarget = allScores.find((s) => s.isRonTarget === true);
      if (ronTarget) {
        const upperSeatWinner = findUpperSeatWinner(winners, ronTarget.playerId, hanchanPlayers);
        // 特定した一人にのみ本場の点数を加算
        if (score.isWinner && upperSeatWinner && upperSeatWinner.playerId === score.playerId) {
          // 最も近い上家のみが本場の点数を受け取る（親子の差はない）
          // 本場 × 300点を獲得
          scoreChange += honba * 300;
        }
        // 他の和了者は本場の点数を受け取らない（scoreChangeは0のまま）
        // 放銃者への減算
        if (score.isRonTarget) {
          // 放銃者は本場の点数を支払う（親子の差はない）
          // 本場 × 300点を支払う
          scoreChange -= honba * 300;
        }
      }
    } else {
      // 通常のロン: 和了者は本場の点数を受け取る
      if (score.isWinner) {
        // 和了者は本場 × 300点を獲得（ロン時、親子の差はない）
        scoreChange += honba * 300;
      } else if (score.isRonTarget) {
        // 放銃者は本場の点数を支払う（親子の差はない）
        // 放銃者は本場 × 300点を支払う
        scoreChange -= honba * 300;
      }
    }
  }

  return scoreChange;
}

