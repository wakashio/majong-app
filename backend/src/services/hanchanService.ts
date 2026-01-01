import { getPrismaClient } from "../utils/prisma";
import { HanchanStatus } from "../types/hanchan";
import { Wind } from "../types/round";
import {
  calculateUmaOka,
  type UmaOkaConfig,
  type PlayerScore,
} from "./umaOkaCalculationService";

export interface CreateHanchanData {
  name?: string;
  playerIds: string[];
  seatPositions?: number[];
  sessionId?: string;
}

export interface UpdateHanchanData {
  name?: string;
  status?: HanchanStatus;
  finalScores?: Record<string, number>;
  umaOkaConfig?: UmaOkaConfig;
}

export const hanchanService = {
  async findAll(status?: HanchanStatus, limit = 100, offset = 0) {
    const where = status ? { status } : {};
    const [hanchans, total] = await Promise.all([
      getPrismaClient().hanchan.findMany({
        where,
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
          createdAt: "desc",
        },
        take: limit,
        skip: offset,
      }),
      getPrismaClient().hanchan.count({ where }),
    ]);

    return { hanchans, total };
  },

  async findById(id: string) {
    return await getPrismaClient().hanchan.findUnique({
      where: { id },
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
        rounds: {
          select: {
            id: true,
            roundNumber: true,
            wind: true,
            dealerPlayerId: true,
            honba: true,
            riichiSticks: true,
            startedAt: true,
            endedAt: true,
          },
          orderBy: {
            roundNumber: "asc",
          },
        },
      },
    });
  },

  async create(data: CreateHanchanData) {
    const { name, playerIds, seatPositions, sessionId } = data;

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

    if (sessionId) {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          sessionPlayers: true,
        },
      });

      if (!session) {
        throw new Error("Session not found");
      }
    }

    const positions = seatPositions || playerIds.map((_, index) => index);

    return await prisma.$transaction(async (tx) => {
      const hanchan = await tx.hanchan.create({
        data: {
          name,
          startedAt: new Date(),
          status: HanchanStatus.IN_PROGRESS,
          sessionId: sessionId || null,
          hanchanPlayers: {
            create: playerIds.map((playerId, index) => ({
              playerId,
              seatPosition: positions[index],
              initialScore: 25000,
            })),
          },
        },
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

      const dealerPlayer = hanchan.hanchanPlayers.find(
        (hp) => hp.seatPosition === 0
      );

      if (!dealerPlayer) {
        throw new Error("Player with seatPosition 0 not found");
      }

      await tx.round.create({
        data: {
          hanchanId: hanchan.id,
          roundNumber: 1,
          wind: Wind.EAST,
          dealerPlayerId: dealerPlayer.playerId,
          honba: 0,
          riichiSticks: 0,
        },
      });

      return hanchan;
    });
  },

  async update(id: string, data: UpdateHanchanData) {
    const { name, status, finalScores, umaOkaConfig } = data;

    const updateData: {
      name?: string;
      status?: HanchanStatus;
      endedAt?: Date | null;
    } = {};

    if (name !== undefined) {
      updateData.name = name;
    }

    if (status !== undefined) {
      updateData.status = status;
      if (status === HanchanStatus.COMPLETED) {
        updateData.endedAt = new Date();
      } else if (status === HanchanStatus.IN_PROGRESS) {
        updateData.endedAt = null;
      }
    }

    const prisma = getPrismaClient();

    // 半荘を取得
    const hanchan = await prisma.hanchan.findUnique({
      where: { id },
      include: {
        hanchanPlayers: true,
      },
    });

    if (!hanchan) {
      throw new Error("Hanchan not found");
    }

    // 半荘を終了する場合、ウマオカを計算してfinalScoresを設定
    if (status === HanchanStatus.COMPLETED && !finalScores) {
      // セッションからウマオカ設定を取得（セッションIDがある場合）
      let sessionUmaOkaConfig: UmaOkaConfig | undefined;
      if (hanchan.sessionId) {
        const session = await prisma.session.findUnique({
          where: { id: hanchan.sessionId },
          select: { umaOkaConfig: true },
        });
        if (session?.umaOkaConfig) {
          sessionUmaOkaConfig = session.umaOkaConfig as unknown as UmaOkaConfig;
        }
      }

      // 各プレイヤーの現在の持ち点を計算
      const playerScores: PlayerScore[] = await Promise.all(
        hanchan.hanchanPlayers.map(async (hp) => {
          const scoreSumResult = await prisma.score.aggregate({
            where: {
              playerId: hp.playerId,
              round: {
                hanchanId: id,
              },
            },
            _sum: {
              scoreChange: true,
            },
          });

          const currentScore = hp.initialScore + (scoreSumResult._sum.scoreChange ?? 0);

          return {
            playerId: hp.playerId,
            currentScore,
          };
        })
      );

      // ウマオカを計算（優先順位: umaOkaConfig > セッションの設定 > デフォルト）
      const calculatedFinalScores = calculateUmaOka(
        playerScores,
        umaOkaConfig || sessionUmaOkaConfig || {
          initialScore: 25000,
          returnScore: 30000,
          uma: [30, 10, -10, -30],
        }
      );

      // finalScoresを設定
      await Promise.all(
        calculatedFinalScores.map((finalScore) => {
          const hp = hanchan.hanchanPlayers.find((p) => p.playerId === finalScore.playerId);
          if (!hp) {
            throw new Error(`Player ${finalScore.playerId} not found in hanchan`);
          }
          return prisma.hanchanPlayer.update({
            where: { id: hp.id },
            data: {
              finalScore: finalScore.currentScore, // ウマオカ考慮前の値（currentScore）
              finalScoreWithUmaOka: finalScore.finalScore, // ウマオカ考慮後の値
            },
          });
        })
      );
    } else if (finalScores) {
      // finalScoresが明示的に指定された場合
      const playerIds = Object.keys(finalScores);
      const validPlayerIds = hanchan.hanchanPlayers.map((hp) => hp.playerId);

      for (const playerId of playerIds) {
        if (!validPlayerIds.includes(playerId)) {
          throw new Error(`Player ${playerId} not found in hanchan`);
        }
      }

      // 各参加者の現在の持ち点を計算
      const playerScores: PlayerScore[] = await Promise.all(
        hanchan.hanchanPlayers.map(async (hp) => {
          const scoreSumResult = await prisma.score.aggregate({
            where: {
              playerId: hp.playerId,
              round: {
                hanchanId: id,
              },
            },
            _sum: {
              scoreChange: true,
            },
          });

          const currentScore = hp.initialScore + (scoreSumResult._sum.scoreChange ?? 0);

          return {
            playerId: hp.playerId,
            currentScore,
          };
        })
      );

      await Promise.all(
        hanchan.hanchanPlayers.map((hp) => {
          const finalScoreWithUmaOka = finalScores[hp.playerId];
          if (finalScoreWithUmaOka !== undefined) {
            const playerScore = playerScores.find((ps) => ps.playerId === hp.playerId);
            const currentScore = playerScore?.currentScore ?? hp.initialScore;
            return prisma.hanchanPlayer.update({
              where: { id: hp.id },
              data: {
                finalScore: currentScore, // ウマオカ考慮前の値（currentScore）
                finalScoreWithUmaOka, // ウマオカ考慮後の値（指定された値）
              },
            });
          }
          return Promise.resolve();
        })
      );
    }

    return await prisma.hanchan.update({
      where: { id },
      data: updateData,
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
  },

  async delete(id: string): Promise<void> {
    await getPrismaClient().hanchan.delete({
      where: { id },
    });
  },
};

