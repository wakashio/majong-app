import { getPrismaClient } from "../utils/prisma";
import {
  RoundResultType,
  SpecialDrawType,
  NakiType,
  RoundActionType,
  CreateRoundRequest,
  UpdateRoundRequest,
  CreateNakiRequest,
  CreateRiichiRequest,
  CreateRoundActionRequest,
  EndRoundRequest,
} from "../types/round";
import {
  calculateNextHonba,
  isDealerRenchan,
  calculateNextRoundNumber,
} from "./riichiHonbaCalculationService";
import { calculateScore } from "./scoreCalculationService";



export const roundService = {
  async findAll(hanchanId: string) {
    const where: { hanchanId: string } = { hanchanId };

    const rounds = await getPrismaClient().round.findMany({
      where,
      include: {
        dealerPlayer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        roundNumber: "asc",
      },
    });

    return rounds;
  },

  async findById(id: string, includeDetails = false) {
    const include: {
      dealerPlayer: { select: { id: true; name: true } };
      scores?: { include: { player: { select: { id: true; name: true } } } };
      actions?: {
        include: {
          player: { select: { id: true; name: true } };
          targetPlayer?: { select: { id: true; name: true } };
        };
      };
      nakis?: {
        include: {
          player: { select: { id: true; name: true } };
          targetPlayer?: { select: { id: true; name: true } };
        };
      };
      riichis?: { include: { player: { select: { id: true; name: true } } } };
    } = {
      dealerPlayer: {
        select: {
          id: true,
          name: true,
        },
      },
    };

    if (includeDetails) {
      include.scores = {
        include: {
          player: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      };
      include.actions = {
        include: {
          player: {
            select: {
              id: true,
              name: true,
            },
          },
          targetPlayer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      };
      include.nakis = {
        include: {
          player: {
            select: {
              id: true,
              name: true,
            },
          },
          targetPlayer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      };
      include.riichis = {
        include: {
          player: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      };
    }

    return await getPrismaClient().round.findUnique({
      where: { id },
      include,
    });
  },

  async create(hanchanId: string, data: CreateRoundRequest) {
    const prisma = getPrismaClient();

    const hanchan = await prisma.hanchan.findUnique({
      where: { id: hanchanId },
      include: {
        hanchanPlayers: {
          select: {
            playerId: true,
          },
        },
      },
    });

    if (!hanchan) {
      throw new Error("Hanchan not found");
    }

    if (hanchan.status !== "IN_PROGRESS") {
      throw new Error("Hanchan must be IN_PROGRESS to create rounds");
    }

    const playerIds = hanchan.hanchanPlayers.map((hp) => hp.playerId);
    if (!playerIds.includes(data.dealerPlayerId)) {
      throw new Error("dealerPlayerId must be a player in the hanchan");
    }

    // 前局を取得して連荘判定と本場設定を自動計算
    // フロントエンドから送られてきたroundNumberは無視し、最新の局を取得して前局を特定
    let calculatedHonba = data.honba ?? 0;
    let calculatedRoundNumber = data.roundNumber;
    
    // 前局の取得: 結果が設定されている最新の局を取得（roundNumberとhonbaの降順でソート）
    const previousRound = await prisma.round.findFirst({
      where: {
        hanchanId,
        resultType: {
          not: null,
        },
      },
      include: {
        scores: {
          select: {
            isDealer: true,
            isWinner: true,
            isTenpai: true,
          },
        },
      },
      orderBy: [
        {
          roundNumber: "desc",
        },
        {
          honba: "desc",
        },
      ],
    });

    // 前局が存在する場合、前局の結果から本場と局番号を計算
    if (previousRound?.resultType) {
      const previousIsDealerWinner = previousRound.scores.some(
        (s) => s.isDealer && s.isWinner
      );
      const previousDealerScore = previousRound.scores.find((s) => s.isDealer);
      const previousIsDealerTenpai = previousDealerScore?.isTenpai === true ? true : undefined;

      // 全員ノーテンを判定（流局時のみ）
      let previousIsAllNoten: boolean | undefined = undefined;
      if (
        previousRound.resultType === RoundResultType.DRAW ||
        previousRound.resultType === RoundResultType.SPECIAL_DRAW
      ) {
        // 全参加者がノーテン（isTenpai === false）の場合、全員ノーテン
        const allScoresHaveTenpaiInfo = previousRound.scores.every(
          (s) => s.isTenpai !== null
        );
        if (allScoresHaveTenpaiInfo) {
          const allNoten = previousRound.scores.every((s) => s.isTenpai === false);
          previousIsAllNoten = allNoten ? true : undefined;
        }
      }

      // 連荘を判定
      const isRenchan = isDealerRenchan(
        previousRound.resultType as RoundResultType,
        previousIsDealerWinner,
        previousIsDealerTenpai
      );

      // 局番号を計算（連荘の場合は前局と同じ、連荘でない場合は前局+1）
      calculatedRoundNumber = calculateNextRoundNumber(
        previousRound.roundNumber,
        isRenchan
      );

      // 本場を計算
      calculatedHonba = calculateNextHonba(
        previousRound.honba,
        previousRound.resultType as RoundResultType,
        previousIsDealerWinner,
        previousIsDealerTenpai,
        previousIsAllNoten
      );
    }

    // 局番号と本場の両方が同じ場合のみ重複とみなす
    const existingRound = await prisma.round.findFirst({
      where: {
        hanchanId,
        roundNumber: calculatedRoundNumber,
        honba: calculatedHonba,
      },
    });

    if (existingRound) {
      throw new Error("Round with the same round number and honba already exists in this hanchan");
    }

    const round = await prisma.round.create({
      data: {
        hanchanId,
        roundNumber: calculatedRoundNumber,
        wind: data.wind,
        dealerPlayerId: data.dealerPlayerId,
        honba: calculatedHonba,
        riichiSticks: data.riichiSticks ?? 0,
      },
      include: {
        dealerPlayer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return round;
  },

  async update(id: string, data: UpdateRoundRequest) {
    const prisma = getPrismaClient();

    const existingRound = await prisma.round.findUnique({
      where: { id },
      include: {
        hanchan: {
          include: {
            hanchanPlayers: {
              select: {
                playerId: true,
              },
            },
          },
        },
      },
    });

    if (!existingRound) {
      throw new Error("Round not found");
    }

    const updateData: {
      honba?: number;
      riichiSticks?: number;
      dealerPlayerId?: string;
      startedAt?: Date;
      endedAt?: Date;
    } = {};

    if (data.honba !== undefined) {
      updateData.honba = data.honba;
    }

    if (data.riichiSticks !== undefined) {
      updateData.riichiSticks = data.riichiSticks;
    }

    if (data.dealerPlayerId !== undefined) {
      const playerIds = existingRound.hanchan.hanchanPlayers.map(
        (hp) => hp.playerId
      );
      if (!playerIds.includes(data.dealerPlayerId)) {
        throw new Error("dealerPlayerId must be a player in the hanchan");
      }
      updateData.dealerPlayerId = data.dealerPlayerId;
    }

    if (data.startedAt !== undefined) {
      updateData.startedAt = data.startedAt;
    }

    if (data.endedAt !== undefined) {
      updateData.endedAt = data.endedAt;
    }

    const round = await prisma.round.update({
      where: { id },
      data: updateData,
      include: {
        dealerPlayer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return round;
  },

  async delete(id: string) {
    const existingRound = await getPrismaClient().round.findUnique({
      where: { id },
    });

    if (!existingRound) {
      throw new Error("Round not found");
    }

    await getPrismaClient().round.delete({
      where: { id },
    });
  },

  async createNaki(roundId: string, data: CreateNakiRequest) {
    const prisma = getPrismaClient();

    const round = await prisma.round.findUnique({
      where: { id: roundId },
      include: {
        hanchan: {
          include: {
            hanchanPlayers: {
              select: {
                playerId: true,
              },
            },
          },
        },
      },
    });

    if (!round) {
      throw new Error("Round not found");
    }

    const playerIds = round.hanchan.hanchanPlayers.map((hp) => hp.playerId);
    if (!playerIds.includes(data.playerId)) {
      throw new Error("playerId must be a player in the round");
    }

    if (
      (data.type === NakiType.PON ||
        data.type === NakiType.CHI ||
        data.type === NakiType.DAIMINKAN) &&
      !data.targetPlayerId
    ) {
      throw new Error(
        "targetPlayerId is required for PON, CHI, DAIMINKAN"
      );
    }

    if (data.targetPlayerId && !playerIds.includes(data.targetPlayerId)) {
      throw new Error("targetPlayerId must be a player in the round");
    }

    const naki = await prisma.naki.create({
      data: {
        roundId,
        playerId: data.playerId,
        type: data.type,
        targetPlayerId: data.targetPlayerId ?? null,
        tiles: data.tiles,
      },
      include: {
        player: {
          select: {
            id: true,
            name: true,
          },
        },
        targetPlayer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return naki;
  },

  async createRiichi(roundId: string, data: CreateRiichiRequest) {
    const prisma = getPrismaClient();

    const round = await prisma.round.findUnique({
      where: { id: roundId },
      include: {
        hanchan: {
          include: {
            hanchanPlayers: {
              select: {
                playerId: true,
              },
            },
          },
        },
      },
    });

    if (!round) {
      throw new Error("Round not found");
    }

    const playerIds = round.hanchan.hanchanPlayers.map((hp) => hp.playerId);
    if (!playerIds.includes(data.playerId)) {
      throw new Error("playerId must be a player in the round");
    }

    const existingRiichi = await prisma.riichi.findFirst({
      where: {
        roundId,
        playerId: data.playerId,
      },
    });

    if (existingRiichi) {
      throw new Error("Player has already declared riichi in this round");
    }

    const riichi = await prisma.riichi.create({
      data: {
        roundId,
        playerId: data.playerId,
        isDoubleRiichi: data.isDoubleRiichi ?? false,
        isIppatsu: data.isIppatsu ?? false,
        declaredAt: new Date(),
      },
      include: {
        player: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await prisma.round.update({
      where: { id: roundId },
      data: {
        riichiSticks: round.riichiSticks + 1,
      },
    });

    return riichi;
  },

  async createRoundAction(roundId: string, data: CreateRoundActionRequest) {
    const prisma = getPrismaClient();

    const round = await prisma.round.findUnique({
      where: { id: roundId },
      include: {
        hanchan: {
          include: {
            hanchanPlayers: {
              select: {
                playerId: true,
              },
            },
          },
        },
      },
    });

    if (!round) {
      throw new Error("Round not found");
    }

    const playerIds = round.hanchan.hanchanPlayers.map((hp) => hp.playerId);
    if (!playerIds.includes(data.playerId)) {
      throw new Error("playerId must be a player in the round");
    }

    if (data.type === RoundActionType.NAKI) {
      if (!data.nakiType) {
        throw new Error("nakiType is required for NAKI");
      }
      if (
        (data.nakiType === NakiType.PON ||
          data.nakiType === NakiType.CHI ||
          data.nakiType === NakiType.DAIMINKAN) &&
        !data.targetPlayerId
      ) {
        throw new Error(
          "targetPlayerId is required for PON, CHI, DAIMINKAN"
        );
      }
      if (data.targetPlayerId && !playerIds.includes(data.targetPlayerId)) {
        throw new Error("targetPlayerId must be a player in the round");
      }

      const existingAction = await prisma.roundAction.findFirst({
        where: {
          roundId,
          playerId: data.playerId,
          type: RoundActionType.RIICHI,
        },
      });

      if (existingAction) {
        throw new Error(
          "Player cannot have both naki and riichi in the same round"
        );
      }
    } else if (data.type === RoundActionType.RIICHI) {
      const existingAction = await prisma.roundAction.findFirst({
        where: {
          roundId,
          playerId: data.playerId,
          type: RoundActionType.RIICHI,
        },
      });

      if (existingAction) {
        throw new Error("Player has already declared riichi in this round");
      }

      const existingNaki = await prisma.roundAction.findFirst({
        where: {
          roundId,
          playerId: data.playerId,
          type: RoundActionType.NAKI,
        },
      });

      if (existingNaki) {
        throw new Error(
          "Player cannot have both naki and riichi in the same round"
        );
      }
    } else {
      throw new Error("type must be NAKI or RIICHI");
    }

    const actionData: {
      roundId: string;
      playerId: string;
      type: RoundActionType;
      declaredAt: Date | null;
      nakiType: NakiType | null;
      targetPlayerId: string | null;
      tiles: string[];
    } = {
      roundId,
      playerId: data.playerId,
      type: data.type,
      declaredAt: null,
      nakiType: null,
      targetPlayerId: null,
      tiles: [],
    };

    if (data.type === RoundActionType.NAKI) {
      actionData.nakiType = data.nakiType!;
      actionData.targetPlayerId = data.targetPlayerId ?? null;
      actionData.tiles = data.tiles || [];
      actionData.declaredAt = null;
    } else {
      actionData.declaredAt = new Date();
      actionData.nakiType = null;
      actionData.targetPlayerId = null;
      actionData.tiles = [];
    }

    // トランザクション内でリーチ記録を作成
    const result = await prisma.$transaction(async (tx) => {
      const action = await tx.roundAction.create({
        data: actionData,
        include: {
          player: {
            select: {
              id: true,
              name: true,
            },
          },
          targetPlayer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (data.type === RoundActionType.RIICHI) {
        // 積み棒を1増やす（Scoreは作成しない、局終了時に一括で計算する）
        await tx.round.update({
          where: { id: roundId },
          data: {
            riichiSticks: round.riichiSticks + 1,
          },
        });
      }

      return action;
    });

    return result;
  },

  async deleteRoundAction(roundId: string, actionId: string) {
    const prisma = getPrismaClient();

    const action = await prisma.roundAction.findUnique({
      where: { id: actionId },
      include: {
        round: true,
      },
    });

    if (!action) {
      throw new Error("RoundAction not found");
    }

    if (action.roundId !== roundId) {
      throw new Error("RoundAction does not belong to the specified round");
    }

    // トランザクション内でリーチ記録を削除
    await prisma.$transaction(async (tx) => {
      if (action.type === RoundActionType.RIICHI) {
        // 積み棒を減らす（Scoreは削除しない、局終了時に一括で計算する）
        if (action.round.riichiSticks > 0) {
          await tx.round.update({
            where: { id: roundId },
            data: {
              riichiSticks: action.round.riichiSticks - 1,
            },
          });
        }
      }

      // リーチ記録を削除
      await tx.roundAction.delete({
        where: { id: actionId },
      });
    });
  },

  async endRound(roundId: string, data: EndRoundRequest) {
    const prisma = getPrismaClient();

    const round = await prisma.round.findUnique({
      where: { id: roundId },
      include: {
        hanchan: {
          include: {
            hanchanPlayers: {
              select: {
                playerId: true,
                seatPosition: true,
              },
            },
          },
        },
        actions: {
          where: {
            type: RoundActionType.RIICHI,
          },
          select: {
            playerId: true,
          },
        },
      },
    });

    if (!round) {
      throw new Error("Round not found");
    }

    const playerIds = round.hanchan.hanchanPlayers.map((hp) => hp.playerId);

    if (
      data.resultType === RoundResultType.TSUMO ||
      data.resultType === RoundResultType.RON
    ) {
      if (!data.scores || data.scores.length === 0) {
        throw new Error("scores are required for TSUMO or RON");
      }

      // 点数(scoreChange)が必須であることを確認
      for (const scoreData of data.scores) {
        if (scoreData.scoreChange === undefined || scoreData.scoreChange === null) {
          throw new Error("scoreChange is required for all scores");
        }
      }

      // ツモの場合: 和了者が1人
      if (data.resultType === RoundResultType.TSUMO) {
        // isWinnerが未設定の場合、scoreChangeから自動判定
        const winnerCount = data.scores.filter((s) => {
          if (s.isWinner !== undefined) {
            return s.isWinner === true;
          }
          // isWinnerが未設定の場合、scoreChange > 0で判定
          return s.scoreChange > 0;
        }).length;
        if (winnerCount !== 1) {
          throw new Error("Exactly one winner is required for TSUMO");
        }
      }

      // ロンの場合: 和了者が1-3人、放銃者が1人
      if (data.resultType === RoundResultType.RON) {
        // isWinnerが未設定の場合、scoreChangeから自動判定
        const winnerCount = data.scores.filter((s) => {
          if (s.isWinner !== undefined) {
            return s.isWinner === true;
          }
          // isWinnerが未設定の場合、scoreChange > 0で判定
          return s.scoreChange > 0;
        }).length;
        if (winnerCount < 1 || winnerCount > 3) {
          throw new Error("Between 1 and 3 winners are required for RON");
        }

        const ronTargetCount = data.scores.filter(
          (s) => s.isRonTarget === true
        ).length;
        if (ronTargetCount !== 1) {
          throw new Error("Exactly one ron target is required for RON");
        }
      }

      for (const scoreData of data.scores) {
        if (!playerIds.includes(scoreData.playerId)) {
          throw new Error(
            "playerId must be a player in the round"
          );
        }
      }
    }

    // 流局の場合: スコアデータにテンパイ情報を含める(任意)
    if (data.resultType === RoundResultType.DRAW) {
      if (data.scores && data.scores.length > 0) {
        for (const scoreData of data.scores) {
          if (!playerIds.includes(scoreData.playerId)) {
            throw new Error(
              "playerId must be a player in the round"
            );
          }
        }
      }
    }

    if (
      data.resultType === RoundResultType.SPECIAL_DRAW &&
      !data.specialDrawType
    ) {
      throw new Error("specialDrawType is required for SPECIAL_DRAW");
    }

    // round.updateの前に、honbaとriichiSticksを取得（update後に取得すると値が変わる可能性があるため）
    const roundForCalculation = await prisma.round.findUnique({
      where: { id: roundId },
      select: { honba: true, riichiSticks: true },
    });

    const updateData: {
      resultType: RoundResultType;
      specialDrawType?: SpecialDrawType;
      endedAt: Date;
    } = {
      resultType: data.resultType,
      endedAt: new Date(),
    };

    if (data.specialDrawType) {
      updateData.specialDrawType = data.specialDrawType;
    }

    await prisma.round.update({
      where: { id: roundId },
      data: updateData,
    });

    if (data.scores && data.scores.length > 0) {
      let scoresToCreate: Array<{
        roundId: string;
        playerId: string;
        scoreChange: number;
        isDealer: boolean;
        isWinner: boolean;
        isRonTarget: boolean | null;
        isTenpai: boolean | null;
        han: number | null;
        fu: number | null;
        yaku: string[];
      }>;

      // ツモ・ロンの場合: 和了者の点数から自動計算
      if (
        data.resultType === RoundResultType.TSUMO ||
        data.resultType === RoundResultType.RON
      ) {
        const winnerScoreData = data.scores.find((s) => s.isWinner === true);
        if (!winnerScoreData || winnerScoreData.scoreChange === undefined || winnerScoreData.scoreChange === null) {
          throw new Error("winner scoreChange is required for TSUMO or RON");
        }

        const winnerPlayerId = winnerScoreData.playerId;
        const winnerScore = winnerScoreData.scoreChange;
        const ronTargetPlayerId = data.resultType === RoundResultType.RON
          ? data.scores.find((s) => s.isRonTarget === true)?.playerId
          : undefined;

        if (!roundForCalculation) {
          throw new Error("Failed to get round for calculation");
        }

        // 和了者の点数から自動計算
        const calculatedScores = calculateScore({
          resultType: data.resultType,
          winnerPlayerId,
          ronTargetPlayerId,
          winnerScore,
          yaku: winnerScoreData.yaku,
          dealerPlayerId: round.dealerPlayerId,
          playerIds,
          honba: roundForCalculation.honba,
          riichiSticks: roundForCalculation.riichiSticks,
        });

        // 計算結果をscoresToCreateに変換
        scoresToCreate = calculatedScores.map((calculated) => {
          const originalScore = data.scores?.find((s) => s.playerId === calculated.playerId);
          return {
            roundId,
            playerId: calculated.playerId,
            scoreChange: calculated.scoreChange,
            isDealer: calculated.isDealer,
            isWinner: calculated.isWinner,
            isRonTarget: calculated.isRonTarget ?? null,
            isTenpai: originalScore?.isTenpai ?? null,
            han: calculated.han ?? null,
            fu: calculated.fu ?? null,
            yaku: calculated.yaku ?? [],
          };
        });
      } else {
        // 流局時はテンパイの点数移動を計算してscoreChangeに含める
        scoresToCreate = data.scores.map((scoreData) => {
          return {
            roundId,
            playerId: scoreData.playerId,
            scoreChange: scoreData.scoreChange ?? 0,
            isDealer: scoreData.isDealer,
            isWinner: false,
            isRonTarget: null,
            isTenpai: scoreData.isTenpai ?? null,
            han: null,
            fu: null,
            yaku: [],
          };
        });
      }

      // 流局時: テンパイの点数移動を計算
      if (
        data.resultType === RoundResultType.DRAW ||
        data.resultType === RoundResultType.SPECIAL_DRAW
      ) {
        const tenpaiPlayers = scoresToCreate.filter((s) => s.isTenpai === true);
        const notenPlayers = scoresToCreate.filter((s) => s.isTenpai === false);

        // 全員ノーテンまたは全員テンパイの場合は点数移動なし
        if (tenpaiPlayers.length > 0 && notenPlayers.length > 0) {
          // ノーテン罰符: 場に3000点を供託し、テンパイ者で均等に分配
          const totalPenalty = 3000;
          const penaltyPerNoten = totalPenalty / notenPlayers.length;
          const rewardPerTenpai = totalPenalty / tenpaiPlayers.length;

          scoresToCreate = scoresToCreate.map((scoreData) => {
            let tenpaiScoreChange = 0;
            if (scoreData.isTenpai === false) {
              // ノーテン者: 罰符を支払う
              tenpaiScoreChange = -penaltyPerNoten;
            } else if (scoreData.isTenpai === true) {
              // テンパイ者: 罰符を受け取る
              tenpaiScoreChange = rewardPerTenpai;
            }

            return {
              ...scoreData,
              scoreChange: scoreData.scoreChange + tenpaiScoreChange,
            };
          });
        }
      }

      // 局終了時に、リーチ記録、本場、積み棒の点数変動を一括で計算して統合する
      // リーチ記録による点数変動を計算（round.actionsから取得）
      const riichiScoreChanges: Map<string, number> = new Map();
      if (round.actions && round.actions.length > 0) {
        for (const riichiAction of round.actions) {
          const currentChange = riichiScoreChanges.get(riichiAction.playerId) || 0;
          riichiScoreChanges.set(riichiAction.playerId, currentChange - 1000);
        }
      }

      // 本場による点数変動を計算
      // 注意: ツモ・ロンの場合、本場の点数は既にcalculateScoreで計算に含まれているため、
      // ここでは追加計算しない（二重計算を防ぐ）
      const honbaScoreChanges: Map<string, number> = new Map();

      // 積み棒による点数変動を計算
      // 注意: ツモ・ロンの場合、積み棒は既にcalculateScoreで計算に含まれているため、
      // ここでは追加計算しない（二重計算を防ぐ）
      // 流し満貫の場合のみ、ここで積み棒を計算する
      const riichiSticksScoreChanges: Map<string, number> = new Map();
      if (data.resultType === RoundResultType.NAGASHI_MANGAN) {
        // 積み棒が存在する場合のみ加算（0の場合は加算しない）
        const riichiSticks = roundForCalculation?.riichiSticks ?? round.riichiSticks;
        if (riichiSticks > 0) {
          const riichiSticksPoints = riichiSticks * 1000;
          // 流し満貫時: 流し満貫を達成した参加者が`round.riichiSticks × 1000`点を獲得
          const nagashiManganPlayer = scoresToCreate.find((s) => s.isWinner);
          if (nagashiManganPlayer) {
            riichiSticksScoreChanges.set(nagashiManganPlayer.playerId, riichiSticksPoints);
          }
        }
      }
      // 流局時: 積み棒による点数変動は0（次局に持ち越される）

      // リーチ記録、本場、積み棒の点数変動を統合
      const finalScores = scoresToCreate.map((scoreData) => {
        let totalScoreChange = scoreData.scoreChange;
        // リーチ記録による点数変動を加算
        const riichiChange = riichiScoreChanges.get(scoreData.playerId) || 0;
        totalScoreChange += riichiChange;
        // 本場による点数変動を加算
        const honbaChange = honbaScoreChanges.get(scoreData.playerId) || 0;
        totalScoreChange += honbaChange;
        // 積み棒による点数変動を加算
        const riichiSticksChange = riichiSticksScoreChanges.get(scoreData.playerId) || 0;
        totalScoreChange += riichiSticksChange;

        return {
          ...scoreData,
          scoreChange: totalScoreChange,
        };
      });

      // トランザクション内で処理
      await prisma.$transaction(async (tx) => {
        // 既存のScoreを削除（上書き対応）
        await tx.score.deleteMany({
          where: { roundId },
        });
        // 統合されたScoreを保存
        await tx.score.createMany({
          data: finalScores,
        });
      });
    }

    const roundWithScores = await prisma.round.findUnique({
      where: { id: roundId },
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
        },
      },
    });

    if (!roundWithScores) {
      throw new Error("Round not found");
    }

    return roundWithScores;
  },
};

