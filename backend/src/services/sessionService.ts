import { getPrismaClient } from "../utils/prisma";
import { Prisma } from "@prisma/client";
import type { UmaOkaConfig } from "./umaOkaCalculationService";

export interface CreateSessionData {
  date: string;
  name?: string;
  playerIds: string[];
  umaOkaConfig?: UmaOkaConfig;
}

export interface UpdateSessionData {
  name?: string;
  playerIds?: string[];
  umaOkaConfig?: UmaOkaConfig;
}

export const sessionService = {
  async findAll(limit = 50, offset = 0) {
    const [sessions, total] = await Promise.all([
      getPrismaClient().session.findMany({
        include: {
          sessionPlayers: {
            include: {
              player: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              hanchans: true,
            },
          },
        },
        orderBy: {
          date: "desc",
        },
        take: limit,
        skip: offset,
      }),
      getPrismaClient().session.count(),
    ]);

    const listItems = sessions.map((session) => ({
      id: session.id,
      date: session.date.toISOString(),
      name: session.name || undefined,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      playerCount: session.sessionPlayers.length,
      hanchanCount: session._count.hanchans,
      players: session.sessionPlayers.map((sp) => ({
        id: sp.player.id,
        name: sp.player.name,
      })),
    }));

    return { sessions: listItems, total };
  },

  async findById(id: string) {
    return await getPrismaClient().session.findUnique({
      where: { id },
      include: {
        sessionPlayers: {
          include: {
            player: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        hanchans: {
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
          orderBy: {
            startedAt: "desc",
          },
        },
      },
    });
  },

  async create(data: CreateSessionData) {
    const { date, name, playerIds, umaOkaConfig } = data;

    const prisma = getPrismaClient();

    const players = await prisma.player.findMany({
      where: {
        id: {
          in: playerIds,
        },
      },
    });

    if (players.length !== playerIds.length) {
      throw new Error("One or more players not found");
    }

    const uniqueIds = new Set(playerIds);
    if (uniqueIds.size !== playerIds.length) {
      throw new Error("playerIds must be unique");
    }

    if (playerIds.length < 4) {
      throw new Error("playerIds must contain at least 4 elements");
    }

    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    return await prisma.$transaction(async (tx) => {
      const session = await tx.session.create({
        data: {
          date: dateObj,
          name,
          umaOkaConfig: umaOkaConfig ? (umaOkaConfig as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
          sessionPlayers: {
            create: playerIds.map((playerId) => ({
              playerId,
            })),
          },
        },
        include: {
          sessionPlayers: {
            include: {
              player: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      return session;
    });
  },

  async update(id: string, data: UpdateSessionData) {
    const { name, playerIds, umaOkaConfig } = data;

    const prisma = getPrismaClient();

    const updateData: {
      name?: string;
      umaOkaConfig?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
    } = {};

    if (name !== undefined) {
      updateData.name = name.trim() || undefined;
    }

    if (umaOkaConfig !== undefined) {
      updateData.umaOkaConfig = umaOkaConfig
        ? (umaOkaConfig as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull;
    }

    if (playerIds !== undefined) {
      const players = await prisma.player.findMany({
        where: {
          id: {
            in: playerIds,
          },
        },
      });

      if (players.length !== playerIds.length) {
        throw new Error("One or more players not found");
      }

      const uniqueIds = new Set(playerIds);
      if (uniqueIds.size !== playerIds.length) {
        throw new Error("playerIds must be unique");
      }

      if (playerIds.length < 4) {
        throw new Error("playerIds must contain at least 4 elements");
      }

      return await prisma.$transaction(async (tx) => {
        await tx.sessionPlayer.deleteMany({
          where: {
            sessionId: id,
          },
        });

        const session = await tx.session.update({
          where: { id },
          data: {
            ...updateData,
            sessionPlayers: {
              create: playerIds.map((playerId) => ({
                playerId,
              })),
            },
          },
          include: {
            sessionPlayers: {
              include: {
                player: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        });

        return session;
      });
    }

    return await prisma.session.update({
      where: { id },
      data: updateData,
      include: {
        sessionPlayers: {
          include: {
            player: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  },

  async delete(id: string) {
    const prisma = getPrismaClient();

    return await prisma.$transaction(async (tx) => {
      await tx.hanchan.updateMany({
        where: {
          sessionId: id,
        },
        data: {
          sessionId: null,
        },
      });

      await tx.session.delete({
        where: { id },
      });

      return { id, deleted: true };
    });
  },

  async getStatistics(id: string) {
    const prisma = getPrismaClient();

    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        hanchans: {
          include: {
            rounds: {
              include: {
                scores: {
                  include: {
                    player: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
            hanchanPlayers: {
              include: {
                player: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        sessionPlayers: {
          include: {
            player: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new Error("Session not found");
    }

    const totalRounds = session.hanchans.reduce(
      (sum, hanchan) => sum + hanchan.rounds.length,
      0
    );
    const totalHanchans = session.hanchans.length;

    const playerStatsMap = new Map<
      string,
      {
        playerId: string;
        playerName: string;
        totalWins: number;
        totalTsumo: number;
        totalRon: number;
        totalDealIn: number;
        totalFinalScore: number;
      }
    >();

    session.sessionPlayers.forEach((sp) => {
      playerStatsMap.set(sp.playerId, {
        playerId: sp.playerId,
        playerName: sp.player.name,
        totalWins: 0,
        totalTsumo: 0,
        totalRon: 0,
        totalDealIn: 0,
        totalFinalScore: 0,
      });
    });

    session.hanchans.forEach((hanchan) => {
      hanchan.rounds.forEach((round) => {
        round.scores.forEach((score) => {
          const stats = playerStatsMap.get(score.playerId);
          if (stats) {
            if (score.isWinner) {
              stats.totalWins++;
              if (round.resultType === "TSUMO") {
                stats.totalTsumo++;
              } else if (round.resultType === "RON") {
                stats.totalRon++;
              }
            }
            if (score.isRonTarget) {
              stats.totalDealIn++;
            }
          }
        });
      });

      // 各半荘の返し点換算したfinalScoreWithUmaOkaを合計
      // finalScoreWithUmaOkaは既に返し点を引いた値になっているため、単に1000で割るだけでよい
      hanchan.hanchanPlayers.forEach((hp) => {
        const stats = playerStatsMap.get(hp.playerId);
        if (stats && hp.finalScoreWithUmaOka !== null) {
          const convertedScore = hp.finalScoreWithUmaOka / 1000;
          stats.totalFinalScore += convertedScore;
        }
      });
    });

    const playerStatistics = Array.from(playerStatsMap.values())
      .map((stats) => ({
        playerId: stats.playerId,
        playerName: stats.playerName,
        totalWins: stats.totalWins,
        totalTsumo: stats.totalTsumo,
        totalRon: stats.totalRon,
        totalDealIn: stats.totalDealIn,
        totalFinalScore: stats.totalFinalScore,
        rank: 0,
      }))
      .sort((a, b) => b.totalFinalScore - a.totalFinalScore)
      .map((stats, index) => ({
        ...stats,
        rank: index + 1,
      }));

    return {
      sessionId: id,
      totalRounds,
      totalHanchans,
      playerStatistics,
    };
  },
};

