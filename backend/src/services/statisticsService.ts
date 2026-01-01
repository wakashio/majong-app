import { getPrismaClient } from "../utils/prisma";
import type { PlayerStatistics } from "../types/player";
import type { HanchanStatistics, HanchanPlayerStatistics } from "../types/hanchan";
import { RoundResultType, RoundActionType } from "../types/round";

/**
 * 参加者の統計情報を取得する
 * @param playerId - 参加者ID
 * @returns 統計情報
 */
export async function getPlayerStatistics(playerId: string): Promise<PlayerStatistics> {
  const prisma = getPrismaClient();

  // 参加者情報を取得
  const player = await prisma.player.findUnique({
    where: { id: playerId },
  });

  if (!player) {
    throw new Error("Player not found");
  }

  // 参加した半荘数
  const totalHanchans = await prisma.hanchanPlayer.count({
    where: { playerId },
  });

  // 参加した局数
  const totalRounds = await prisma.round.count({
    where: {
      hanchan: {
        hanchanPlayers: {
          some: { playerId },
        },
      },
    },
  });

  // 総和了回数
  const totalWins = await prisma.score.count({
    where: {
      playerId,
      isWinner: true,
    },
  });

  // ツモ回数
  const totalTsumo = await prisma.score.count({
    where: {
      playerId,
      isWinner: true,
      round: {
        resultType: RoundResultType.TSUMO,
      },
    },
  });

  // ロン回数
  const totalRon = await prisma.score.count({
    where: {
      playerId,
      isWinner: true,
      round: {
        resultType: RoundResultType.RON,
      },
    },
  });

  // 放銃回数
  const totalRonTarget = await prisma.score.count({
    where: {
      playerId,
      isRonTarget: true,
    },
  });

  // 平均順位を計算
  const hanchanPlayersWithFinalScore = await prisma.hanchanPlayer.findMany({
    where: {
      playerId,
      finalScore: { not: null },
    },
    include: {
      hanchan: {
        include: {
          hanchanPlayers: {
            where: {
              finalScore: { not: null },
            },
            orderBy: {
              finalScore: "desc",
            },
          },
        },
      },
    },
  });

  let totalRank = 0;
  let completedHanchans = 0;

  for (const hp of hanchanPlayersWithFinalScore) {
    const players = hp.hanchan.hanchanPlayers;
    const rank = players.findIndex((p) => p.playerId === playerId) + 1;
    if (rank > 0) {
      totalRank += rank;
      completedHanchans++;
    }
  }

  const averageRank = completedHanchans > 0 ? totalRank / completedHanchans : 0;

  // 返し点換算した合計最終得点
  // finalScoreWithUmaOkaは既に返し点を引いた値になっているため、単に1000で割るだけでよい
  const hanchanPlayersForFinalScore = await prisma.hanchanPlayer.findMany({
    where: {
      playerId,
      finalScoreWithUmaOka: { not: null },
    },
  });

  let totalFinalScore = 0;
  for (const hp of hanchanPlayersForFinalScore) {
    if (hp.finalScoreWithUmaOka !== null) {
      const convertedScore = hp.finalScoreWithUmaOka / 1000;
      totalFinalScore += convertedScore;
    }
  }

  // 最高最終得点
  const maxResult = await prisma.hanchanPlayer.aggregate({
    where: {
      playerId,
      finalScore: { not: null },
    },
    _max: {
      finalScore: true,
    },
  });

  const maxScore = maxResult._max.finalScore ?? 0;

  // 最低最終得点
  const minResult = await prisma.hanchanPlayer.aggregate({
    where: {
      playerId,
      finalScore: { not: null },
    },
    _min: {
      finalScore: true,
    },
  });

  const minScore = minResult._min.finalScore ?? 0;

  // 和了率
  const winRate = totalRounds > 0 ? totalWins / totalRounds : 0;

  // 放銃率
  const ronTargetRate = totalRounds > 0 ? totalRonTarget / totalRounds : 0;

  return {
    playerId,
    playerName: player.name,
    totalHanchans,
    totalRounds,
    totalWins,
    totalTsumo,
    totalRon,
    totalRonTarget,
    averageRank: Math.round(averageRank * 100) / 100,
    totalFinalScore,
    maxScore,
    minScore,
    winRate: Math.round(winRate * 1000) / 1000,
    ronTargetRate: Math.round(ronTargetRate * 1000) / 1000,
  };
}

/**
 * 半荘の統計情報を取得する
 * @param hanchanId - 半荘ID
 * @returns 統計情報
 */
export async function getHanchanStatistics(hanchanId: string): Promise<HanchanStatistics> {
  const prisma = getPrismaClient();

  // 半荘情報を取得
  const hanchan = await prisma.hanchan.findUnique({
    where: { id: hanchanId },
    include: {
      hanchanPlayers: {
        include: {
          player: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          seatPosition: "asc",
        },
      },
    },
  });

  if (!hanchan) {
    throw new Error("Hanchan not found");
  }

  // 局数
  const totalRounds = await prisma.round.count({
    where: { hanchanId },
  });

  // 参加者ごとの統計情報を計算
  const playerStatistics: HanchanPlayerStatistics[] = [];

  for (const hp of hanchan.hanchanPlayers) {
    // 和了回数
    const totalWins = await prisma.score.count({
      where: {
        playerId: hp.playerId,
        round: {
          hanchanId,
        },
        isWinner: true,
      },
    });

    // ツモ回数
    const totalTsumo = await prisma.score.count({
      where: {
        playerId: hp.playerId,
        round: {
          hanchanId,
          resultType: RoundResultType.TSUMO,
        },
        isWinner: true,
      },
    });

    // ロン回数
    const totalRon = await prisma.score.count({
      where: {
        playerId: hp.playerId,
        round: {
          hanchanId,
          resultType: RoundResultType.RON,
        },
        isWinner: true,
      },
    });

    // 放銃回数
    const totalRonTarget = await prisma.score.count({
      where: {
        playerId: hp.playerId,
        round: {
          hanchanId,
        },
        isRonTarget: true,
      },
    });

    // 流局時テンパイ回数
    const totalTenpaiOnDraw = await prisma.score.count({
      where: {
        playerId: hp.playerId,
        round: {
          hanchanId,
          resultType: {
            in: [RoundResultType.DRAW, RoundResultType.SPECIAL_DRAW, RoundResultType.NAGASHI_MANGAN],
          },
        },
        isTenpai: true,
      },
    });

    // リーチ回数
    const totalRiichi = await prisma.roundAction.count({
      where: {
        playerId: hp.playerId,
        round: {
          hanchanId,
        },
        type: RoundActionType.RIICHI,
      },
    });

    // 現在の持ち点を計算（初期得点 + これまでの得点変動の合計）
    const scoreSumResult = await prisma.score.aggregate({
      where: {
        playerId: hp.playerId,
        round: {
          hanchanId,
        },
      },
      _sum: {
        scoreChange: true,
      },
    });

    const currentScore = hp.initialScore + (scoreSumResult._sum.scoreChange ?? 0);

    // 順位を計算（半荘が完了している場合のみ）
    let rank: number | undefined;
    if (hp.finalScore !== null && hanchan.status === "COMPLETED") {
      const allPlayers = await prisma.hanchanPlayer.findMany({
        where: {
          hanchanId,
          finalScore: { not: null },
        },
        orderBy: {
          finalScore: "desc",
        },
      });

      const playerIndex = allPlayers.findIndex((p) => p.playerId === hp.playerId);
      rank = playerIndex >= 0 ? playerIndex + 1 : undefined;
    }

    playerStatistics.push({
      playerId: hp.playerId,
      playerName: hp.player.name,
      seatPosition: hp.seatPosition,
      initialScore: hp.initialScore,
      currentScore,
      currentRank: 0, // 後で計算
      finalScore: hp.finalScore ?? undefined,
      rank,
      totalWins,
      totalTsumo,
      totalRon,
      totalRonTarget,
      totalTenpaiOnDraw,
      totalRiichi,
    });
  }

  // 現在の順位を計算（現在の持ち点順、同点の場合はseatPositionで順序を決定）
  playerStatistics.sort((a, b) => {
    if (b.currentScore !== a.currentScore) {
      return b.currentScore - a.currentScore;
    }
    return a.seatPosition - b.seatPosition;
  });

  playerStatistics.forEach((stat, index) => {
    stat.currentRank = index + 1;
  });

  // seatPosition順に戻す（元の順序を維持）
  playerStatistics.sort((a, b) => a.seatPosition - b.seatPosition);

  return {
    hanchanId: hanchan.id,
    hanchanName: hanchan.name ?? undefined,
    startedAt: hanchan.startedAt.toISOString(),
    endedAt: hanchan.endedAt?.toISOString(),
    status: hanchan.status,
    totalRounds,
    players: playerStatistics,
  };
}

