import { getPrismaClient } from "../utils/prisma";
import type { PlayerHistoryItem } from "../types/player";
import type { HanchanHistoryItem } from "../types/hanchan";

/**
 * 参加者の履歴情報を取得する
 * @param playerId - 参加者ID
 * @param limit - 取得件数
 * @param offset - オフセット
 * @returns 履歴情報とページネーション情報
 */
export async function getPlayerHistory(
  playerId: string,
  limit: number = 20,
  offset: number = 0
): Promise<{ data: PlayerHistoryItem[]; total: number }> {
  const prisma = getPrismaClient();

  // 参加者情報を取得
  const player = await prisma.player.findUnique({
    where: { id: playerId },
  });

  if (!player) {
    throw new Error("Player not found");
  }

  // 半荘一覧を取得
  const hanchanPlayers = await prisma.hanchanPlayer.findMany({
    where: { playerId },
    include: {
      hanchan: {
        include: {
          rounds: {
            select: {
              id: true,
            },
          },
        },
      },
    },
    orderBy: {
      hanchan: {
        startedAt: "desc",
      },
    },
    take: limit,
    skip: offset,
  });

  // 総件数
  const total = await prisma.hanchanPlayer.count({
    where: { playerId },
  });

  // 各半荘の順位を計算
  const data: PlayerHistoryItem[] = [];

  for (const hp of hanchanPlayers) {
    const hanchan = hp.hanchan;
    let rank: number | undefined;

    if (hp.finalScore !== null && hanchan.status === "COMPLETED") {
      const allPlayers = await prisma.hanchanPlayer.findMany({
        where: {
          hanchanId: hanchan.id,
          finalScore: { not: null },
        },
        orderBy: {
          finalScore: "desc",
        },
      });

      const playerIndex = allPlayers.findIndex((p) => p.playerId === playerId);
      rank = playerIndex >= 0 ? playerIndex + 1 : undefined;
    }

    data.push({
      hanchanId: hanchan.id,
      hanchanName: hanchan.name ?? undefined,
      startedAt: hanchan.startedAt.toISOString(),
      endedAt: hanchan.endedAt?.toISOString(),
      status: hanchan.status,
      seatPosition: hp.seatPosition,
      initialScore: hp.initialScore,
      finalScore: hp.finalScore ?? undefined,
      rank,
      totalRounds: hanchan.rounds.length,
    });
  }

  return { data, total };
}

/**
 * 半荘の履歴情報を取得する
 * @param hanchanId - 半荘ID
 * @param limit - 取得件数
 * @param offset - オフセット
 * @returns 履歴情報とページネーション情報
 */
export async function getHanchanHistory(
  hanchanId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ data: HanchanHistoryItem[]; total: number }> {
  const prisma = getPrismaClient();

  // 半荘情報を取得
  const hanchan = await prisma.hanchan.findUnique({
    where: { id: hanchanId },
  });

  if (!hanchan) {
    throw new Error("Hanchan not found");
  }

  // 局一覧を取得
  const rounds = await prisma.round.findMany({
    where: { hanchanId },
    include: {
      dealerPlayer: {
        select: {
          id: true,
          name: true,
        },
      },
      scores: {
        include: {
          player: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          scoreChange: "desc",
        },
      },
    },
    orderBy: {
      roundNumber: "asc",
    },
    take: limit,
    skip: offset,
  });

  // 総件数
  const total = await prisma.round.count({
    where: { hanchanId },
  });

  // 局情報を変換
  const data: HanchanHistoryItem[] = rounds.map((round) => ({
    roundId: round.id,
    roundNumber: round.roundNumber,
    wind: round.wind,
    dealerPlayerId: round.dealerPlayerId,
    dealerPlayerName: round.dealerPlayer.name,
    honba: round.honba,
    riichiSticks: round.riichiSticks,
    resultType: round.resultType ?? undefined,
    specialDrawType: round.specialDrawType ?? undefined,
    startedAt: round.startedAt?.toISOString(),
    endedAt: round.endedAt?.toISOString(),
    scores: round.scores.map((score) => ({
      playerId: score.playerId,
      playerName: score.player.name,
      scoreChange: score.scoreChange,
      isDealer: score.isDealer,
      isWinner: score.isWinner,
      isRonTarget: score.isRonTarget ?? undefined,
      han: score.han ?? undefined,
      fu: score.fu ?? undefined,
      yaku: score.yaku,
    })),
  }));

  return { data, total };
}
