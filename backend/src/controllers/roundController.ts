import { Request, Response } from "express";
import { roundService } from "../services/roundService";
import { calculateScore, getTsumoScoreLabels } from "../services/scoreCalculationService";
import {
  calculateNextRoundSettings,
  calculateNextRoundNumber,
  calculateNextWind,
  calculateIsRenchan,
} from "../services/riichiHonbaCalculationService";
import { getPrismaClient } from "../utils/prisma";
import {
  Wind,
  RoundResultType,
  SpecialDrawType,
  NakiType,
  RoundActionType,
  ErrorResponse,
  CreateRoundRequest,
  UpdateRoundRequest,
  CreateNakiRequest,
  CreateRiichiRequest,
  CreateRoundActionRequest,
  EndRoundRequest,
  CalculateScoreRequest,
  CalculateScoreResponse,
  CalculateNextSettingsRequest,
  CalculateNextSettingsResponse,
} from "../types/round";

function validateRoundNumber(roundNumber: unknown): number {
  if (typeof roundNumber !== "number") {
    throw new Error("roundNumber must be a number");
  }
  if (roundNumber < 1 || roundNumber > 16) {
    throw new Error("roundNumber must be between 1 and 16");
  }
  return roundNumber;
}

function validateWind(wind: unknown): Wind {
  if (typeof wind !== "string") {
    throw new Error("wind must be a string");
  }
  if (
    wind !== Wind.EAST &&
    wind !== Wind.SOUTH &&
    wind !== Wind.WEST &&
    wind !== Wind.NORTH
  ) {
    throw new Error("wind must be EAST, SOUTH, WEST, or NORTH");
  }
  return wind as Wind;
}

function validateDealerPlayerId(dealerPlayerId: unknown): string {
  if (typeof dealerPlayerId !== "string") {
    throw new Error("dealerPlayerId must be a string");
  }
  return dealerPlayerId;
}

function validateHonba(honba: unknown): number | undefined {
  if (honba === undefined || honba === null) {
    return undefined;
  }
  if (typeof honba !== "number") {
    throw new Error("honba must be a number");
  }
  if (honba < 0) {
    throw new Error("honba must be 0 or greater");
  }
  return honba;
}

function validateRiichiSticks(riichiSticks: unknown): number | undefined {
  if (riichiSticks === undefined || riichiSticks === null) {
    return undefined;
  }
  if (typeof riichiSticks !== "number") {
    throw new Error("riichiSticks must be a number");
  }
  if (riichiSticks < 0) {
    throw new Error("riichiSticks must be 0 or greater");
  }
  return riichiSticks;
}


function validateResultType(resultType: unknown): RoundResultType {
  if (typeof resultType !== "string") {
    throw new Error("resultType must be a string");
  }
  if (
    resultType !== RoundResultType.TSUMO &&
    resultType !== RoundResultType.RON &&
    resultType !== RoundResultType.DRAW &&
    resultType !== RoundResultType.NAGASHI_MANGAN &&
    resultType !== RoundResultType.SPECIAL_DRAW
  ) {
    throw new Error(
      "resultType must be TSUMO, RON, DRAW, NAGASHI_MANGAN, or SPECIAL_DRAW"
    );
  }
  return resultType as RoundResultType;
}

function validateSpecialDrawType(
  specialDrawType: unknown
): SpecialDrawType | undefined {
  if (specialDrawType === undefined || specialDrawType === null) {
    return undefined;
  }
  if (typeof specialDrawType !== "string") {
    throw new Error("specialDrawType must be a string");
  }
  if (
    specialDrawType !== SpecialDrawType.FOUR_KAN &&
    specialDrawType !== SpecialDrawType.FOUR_WIND &&
    specialDrawType !== SpecialDrawType.NINE_TERMINALS
  ) {
    throw new Error(
      "specialDrawType must be FOUR_KAN, FOUR_WIND, or NINE_TERMINALS"
    );
  }
  return specialDrawType as SpecialDrawType;
}

function validateNakiType(type: unknown): NakiType {
  if (typeof type !== "string") {
    throw new Error("type must be a string");
  }
  if (
    type !== NakiType.PON &&
    type !== NakiType.CHI &&
    type !== NakiType.DAIMINKAN &&
    type !== NakiType.ANKAN
  ) {
    throw new Error("type must be PON, CHI, DAIMINKAN, or ANKAN");
  }
  return type as NakiType;
}

export const roundController = {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const hanchanId = req.params.hanchanId;

      const rounds = await roundService.findAll(hanchanId);

      res.json({
        data: rounds.map((round) => ({
          id: round.id,
          hanchanId: round.hanchanId,
          roundNumber: round.roundNumber,
          wind: round.wind,
          dealerPlayerId: round.dealerPlayerId,
          dealerPlayer: {
            id: round.dealerPlayer.id,
            name: round.dealerPlayer.name,
          },
          honba: round.honba,
          riichiSticks: round.riichiSticks,
          resultType: round.resultType || null,
          specialDrawType: round.specialDrawType || null,
          startedAt: round.startedAt?.toISOString() || null,
          endedAt: round.endedAt?.toISOString() || null,
          createdAt: round.createdAt.toISOString(),
          updatedAt: round.updatedAt.toISOString(),
        })),
      });
    } catch (error) {
      console.error("Error fetching rounds:", error);
      const errorResponse: ErrorResponse = {
        error: {
          code: "INTERNAL_ERROR",
          message: "Internal server error",
        },
      };
      res.status(500).json(errorResponse);
    }
  },

  async get(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const round = await roundService.findById(id, true);

      if (!round) {
        const errorResponse: ErrorResponse = {
          error: {
            code: "NOT_FOUND",
            message: "Round not found",
          },
        };
        res.status(404).json(errorResponse);
        return;
      }

      const roundWithDetails = round as any;

      res.json({
        data: {
          id: round.id,
          hanchanId: round.hanchanId,
          roundNumber: round.roundNumber,
          wind: round.wind,
          dealerPlayerId: round.dealerPlayerId,
          dealerPlayer: {
            id: round.dealerPlayer.id,
            name: round.dealerPlayer.name,
          },
          honba: round.honba,
          riichiSticks: round.riichiSticks,
          resultType: round.resultType || null,
          specialDrawType: round.specialDrawType || null,
          startedAt: round.startedAt?.toISOString() || null,
          endedAt: round.endedAt?.toISOString() || null,
          createdAt: round.createdAt.toISOString(),
          updatedAt: round.updatedAt.toISOString(),
          scores: roundWithDetails.scores?.map((score: any) => ({
            id: score.id,
            playerId: score.playerId,
            player: {
              id: score.player.id,
              name: score.player.name,
            },
            scoreChange: score.scoreChange,
            isDealer: score.isDealer,
            isWinner: score.isWinner,
            isRonTarget: score.isRonTarget || null,
            isTenpai: score.isTenpai ?? null,
            han: score.han || null,
            fu: score.fu || null,
            yaku: score.yaku || [],
          })) || [],
          actions: roundWithDetails.actions?.map((action: any) => ({
            id: action.id,
            roundId: action.roundId,
            playerId: action.playerId,
            player: {
              id: action.player.id,
              name: action.player.name,
            },
            type: action.type,
            declaredAt: action.declaredAt ? action.declaredAt.toISOString() : null,
            nakiType: action.nakiType || null,
            targetPlayerId: action.targetPlayerId || null,
            targetPlayer: action.targetPlayer
              ? {
                  id: action.targetPlayer.id,
                  name: action.targetPlayer.name,
                }
              : null,
            tiles: action.tiles || [],
            createdAt: action.createdAt.toISOString(),
            updatedAt: action.updatedAt.toISOString(),
          })) || [],
          nakis: roundWithDetails.nakis?.map((naki: any) => ({
            id: naki.id,
            playerId: naki.playerId,
            player: {
              id: naki.player.id,
              name: naki.player.name,
            },
            type: naki.type,
            targetPlayerId: naki.targetPlayerId || null,
            targetPlayer: naki.targetPlayer
              ? {
                  id: naki.targetPlayer.id,
                  name: naki.targetPlayer.name,
                }
              : null,
            tiles: naki.tiles,
          })) || [],
          riichis: roundWithDetails.riichis?.map((riichi: any) => ({
            id: riichi.id,
            playerId: riichi.playerId,
            player: {
              id: riichi.player.id,
              name: riichi.player.name,
            },
            isDoubleRiichi: riichi.isDoubleRiichi,
            isIppatsu: riichi.isIppatsu,
            declaredAt: riichi.declaredAt.toISOString(),
          })) || [],
        },
      });
    } catch (error) {
      console.error("Error fetching round:", error);
      const errorResponse: ErrorResponse = {
        error: {
          code: "INTERNAL_ERROR",
          message: "Internal server error",
        },
      };
      res.status(500).json(errorResponse);
    }
  },

  async create(req: Request, res: Response): Promise<void> {
    try {
      const hanchanId = req.params.hanchanId;
      const body = req.body;

      const roundNumber = validateRoundNumber(body.roundNumber);
      const wind = validateWind(body.wind);
      const dealerPlayerId = validateDealerPlayerId(body.dealerPlayerId);
      const honba = validateHonba(body.honba);
      const riichiSticks = validateRiichiSticks(body.riichiSticks);

      const createData: CreateRoundRequest = {
        roundNumber,
        wind,
        dealerPlayerId,
        honba,
        riichiSticks,
      };

      const round = await roundService.create(hanchanId, createData);

      res.status(201).json({
        data: {
          id: round.id,
          hanchanId: round.hanchanId,
          roundNumber: round.roundNumber,
          wind: round.wind,
          dealerPlayerId: round.dealerPlayerId,
          dealerPlayer: {
            id: round.dealerPlayer.id,
            name: round.dealerPlayer.name,
          },
          honba: round.honba,
          riichiSticks: round.riichiSticks,
          resultType: round.resultType || null,
          specialDrawType: round.specialDrawType || null,
          startedAt: round.startedAt?.toISOString() || null,
          endedAt: round.endedAt?.toISOString() || null,
          createdAt: round.createdAt.toISOString(),
          updatedAt: round.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error("Error creating round:", error);
      if (error instanceof Error) {
        if (error.message === "Hanchan not found") {
          const errorResponse: ErrorResponse = {
            error: {
              code: "NOT_FOUND",
              message: error.message,
            },
          };
          res.status(404).json(errorResponse);
          return;
        }
        if (
          error.message === "Hanchan must be IN_PROGRESS to create rounds" ||
          error.message === "dealerPlayerId must be a player in the hanchan" ||
          error.message === "Round number already exists in this hanchan" ||
          error.message === "Round with the same round number and honba already exists in this hanchan"
        ) {
          const errorResponse: ErrorResponse = {
            error: {
              code: "VALIDATION_ERROR",
              message: error.message,
            },
          };
          res.status(422).json(errorResponse);
          return;
        }
      }
      const errorResponse: ErrorResponse = {
        error: {
          code: "INTERNAL_ERROR",
          message: "Internal server error",
        },
      };
      res.status(500).json(errorResponse);
    }
  },

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const body = req.body;

      const updateData: UpdateRoundRequest = {};

      if (body.honba !== undefined) {
        updateData.honba = validateHonba(body.honba);
      }
      if (body.riichiSticks !== undefined) {
        updateData.riichiSticks = validateRiichiSticks(body.riichiSticks);
      }
      if (body.dealerPlayerId !== undefined) {
        updateData.dealerPlayerId = validateDealerPlayerId(body.dealerPlayerId);
      }

      const round = await roundService.update(id, updateData);

      res.json({
        data: {
          id: round.id,
          hanchanId: round.hanchanId,
          roundNumber: round.roundNumber,
          wind: round.wind,
          dealerPlayerId: round.dealerPlayerId,
          dealerPlayer: {
            id: round.dealerPlayer.id,
            name: round.dealerPlayer.name,
          },
          honba: round.honba,
          riichiSticks: round.riichiSticks,
          resultType: round.resultType || null,
          specialDrawType: round.specialDrawType || null,
          startedAt: round.startedAt?.toISOString() || null,
          endedAt: round.endedAt?.toISOString() || null,
          createdAt: round.createdAt.toISOString(),
          updatedAt: round.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error("Error updating round:", error);
      if (error instanceof Error) {
        if (error.message === "Round not found") {
          const errorResponse: ErrorResponse = {
            error: {
              code: "NOT_FOUND",
              message: error.message,
            },
          };
          res.status(404).json(errorResponse);
          return;
        }
        if (error.message === "dealerPlayerId must be a player in the hanchan") {
          const errorResponse: ErrorResponse = {
            error: {
              code: "VALIDATION_ERROR",
              message: error.message,
            },
          };
          res.status(422).json(errorResponse);
          return;
        }
      }
      const errorResponse: ErrorResponse = {
        error: {
          code: "INTERNAL_ERROR",
          message: "Internal server error",
        },
      };
      res.status(500).json(errorResponse);
    }
  },

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      await roundService.delete(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting round:", error);
      if (error instanceof Error) {
        if (error.message === "Round not found") {
          const errorResponse: ErrorResponse = {
            error: {
              code: "NOT_FOUND",
              message: error.message,
            },
          };
          res.status(404).json(errorResponse);
          return;
        }
      }
      const errorResponse: ErrorResponse = {
        error: {
          code: "INTERNAL_ERROR",
          message: "Internal server error",
        },
      };
      res.status(500).json(errorResponse);
    }
  },

  async createNaki(req: Request, res: Response): Promise<void> {
    try {
      const roundId = req.params.id;
      const body = req.body;

      const playerId = validateDealerPlayerId(body.playerId);
      const type = validateNakiType(body.type);
      const targetPlayerId = body.targetPlayerId
        ? validateDealerPlayerId(body.targetPlayerId)
        : undefined;
      const tiles = body.tiles;

      if (!Array.isArray(tiles)) {
        const errorResponse: ErrorResponse = {
          error: {
            code: "VALIDATION_ERROR",
            message: "tiles must be an array",
          },
        };
        res.status(400).json(errorResponse);
        return;
      }

      const createData: CreateNakiRequest = {
        playerId,
        type,
        targetPlayerId,
        tiles,
      };

      const naki = await roundService.createNaki(roundId, createData);

      res.status(201).json({
        data: {
          id: naki.id,
          roundId: naki.roundId,
          playerId: naki.playerId,
          player: {
            id: naki.player.id,
            name: naki.player.name,
          },
          type: naki.type,
          targetPlayerId: naki.targetPlayerId || null,
          targetPlayer: naki.targetPlayer
            ? {
                id: naki.targetPlayer.id,
                name: naki.targetPlayer.name,
              }
            : null,
          tiles: naki.tiles,
          createdAt: naki.createdAt.toISOString(),
          updatedAt: naki.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error("Error creating naki:", error);
      if (error instanceof Error) {
        if (error.message === "Round not found") {
          const errorResponse: ErrorResponse = {
            error: {
              code: "NOT_FOUND",
              message: error.message,
            },
          };
          res.status(404).json(errorResponse);
          return;
        }
        if (
          error.message === "playerId must be a player in the round" ||
          error.message === "targetPlayerId is required for PON, CHI, DAIMINKAN" ||
          error.message === "targetPlayerId must be a player in the round"
        ) {
          const errorResponse: ErrorResponse = {
            error: {
              code: "VALIDATION_ERROR",
              message: error.message,
            },
          };
          res.status(422).json(errorResponse);
          return;
        }
      }
      const errorResponse: ErrorResponse = {
        error: {
          code: "INTERNAL_ERROR",
          message: "Internal server error",
        },
      };
      res.status(500).json(errorResponse);
    }
  },

  async createRiichi(req: Request, res: Response): Promise<void> {
    try {
      const roundId = req.params.id;
      const body = req.body;

      const playerId = validateDealerPlayerId(body.playerId);
      const isDoubleRiichi = body.isDoubleRiichi ?? false;
      const isIppatsu = body.isIppatsu ?? false;

      const createData: CreateRiichiRequest = {
        playerId,
        isDoubleRiichi,
        isIppatsu,
      };

      const riichi = await roundService.createRiichi(roundId, createData);

      res.status(201).json({
        data: {
          id: riichi.id,
          roundId: riichi.roundId,
          playerId: riichi.playerId,
          player: {
            id: riichi.player.id,
            name: riichi.player.name,
          },
          isDoubleRiichi: riichi.isDoubleRiichi,
          isIppatsu: riichi.isIppatsu,
          declaredAt: riichi.declaredAt.toISOString(),
          createdAt: riichi.createdAt.toISOString(),
          updatedAt: riichi.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error("Error creating riichi:", error);
      if (error instanceof Error) {
        if (error.message === "Round not found") {
          const errorResponse: ErrorResponse = {
            error: {
              code: "NOT_FOUND",
              message: error.message,
            },
          };
          res.status(404).json(errorResponse);
          return;
        }
        if (
          error.message === "playerId must be a player in the round" ||
          error.message === "Player has already declared riichi in this round"
        ) {
          const errorResponse: ErrorResponse = {
            error: {
              code: error.message.includes("already") ? "CONFLICT" : "VALIDATION_ERROR",
              message: error.message,
            },
          };
          res.status(error.message.includes("already") ? 409 : 422).json(errorResponse);
          return;
        }
      }
      const errorResponse: ErrorResponse = {
        error: {
          code: "INTERNAL_ERROR",
          message: "Internal server error",
        },
      };
      res.status(500).json(errorResponse);
    }
  },

  async createRoundAction(req: Request, res: Response): Promise<void> {
    try {
      const roundId = req.params.id;
      const body = req.body;

      if (!body.type || (body.type !== RoundActionType.NAKI && body.type !== RoundActionType.RIICHI)) {
        const errorResponse: ErrorResponse = {
          error: {
            code: "VALIDATION_ERROR",
            message: "type must be NAKI or RIICHI",
          },
        };
        res.status(400).json(errorResponse);
        return;
      }

      const playerId = validateDealerPlayerId(body.playerId);

      const createData: CreateRoundActionRequest = {
        type: body.type,
        playerId,
        nakiType: body.nakiType,
        targetPlayerId: body.targetPlayerId,
        tiles: body.tiles,
      };

      const action = await roundService.createRoundAction(roundId, createData);

      res.status(201).json({
        data: {
          id: action.id,
          roundId: action.roundId,
          playerId: action.playerId,
          player: {
            id: action.player.id,
            name: action.player.name,
          },
          type: action.type,
          declaredAt: action.declaredAt ? action.declaredAt.toISOString() : null,
          nakiType: action.nakiType,
          targetPlayerId: action.targetPlayerId,
          targetPlayer: action.targetPlayer
            ? {
                id: action.targetPlayer.id,
                name: action.targetPlayer.name,
              }
            : null,
          tiles: action.tiles,
          createdAt: action.createdAt.toISOString(),
          updatedAt: action.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error("Error creating round action:", error);
      if (error instanceof Error) {
        if (error.message === "Round not found") {
          const errorResponse: ErrorResponse = {
            error: {
              code: "NOT_FOUND",
              message: error.message,
            },
          };
          res.status(404).json(errorResponse);
          return;
        }
        if (
          error.message === "playerId must be a player in the round" ||
          error.message === "nakiType is required for NAKI" ||
          error.message === "targetPlayerId is required for PON, CHI, DAIMINKAN" ||
          error.message === "targetPlayerId must be a player in the round" ||
          error.message === "type must be NAKI or RIICHI"
        ) {
          const errorResponse: ErrorResponse = {
            error: {
              code: "VALIDATION_ERROR",
              message: error.message,
            },
          };
          res.status(422).json(errorResponse);
          return;
        }
        if (
          error.message === "Player has already declared riichi in this round" ||
          error.message === "Player cannot have both naki and riichi in the same round"
        ) {
          const errorResponse: ErrorResponse = {
            error: {
              code: "CONFLICT",
              message: error.message,
            },
          };
          res.status(409).json(errorResponse);
          return;
        }
      }
      const errorResponse: ErrorResponse = {
        error: {
          code: "INTERNAL_ERROR",
          message: "Internal server error",
        },
      };
      res.status(500).json(errorResponse);
    }
  },

  async deleteRoundAction(req: Request, res: Response): Promise<void> {
    try {
      const roundId = req.params.id;
      const actionId = req.params.actionId;

      await roundService.deleteRoundAction(roundId, actionId);

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting round action:", error);
      if (error instanceof Error) {
        if (error.message === "RoundAction not found") {
          const errorResponse: ErrorResponse = {
            error: {
              code: "NOT_FOUND",
              message: error.message,
            },
          };
          res.status(404).json(errorResponse);
          return;
        }
        if (error.message === "RoundAction does not belong to the specified round") {
          const errorResponse: ErrorResponse = {
            error: {
              code: "VALIDATION_ERROR",
              message: error.message,
            },
          };
          res.status(422).json(errorResponse);
          return;
        }
      }
      const errorResponse: ErrorResponse = {
        error: {
          code: "INTERNAL_ERROR",
          message: "Internal server error",
        },
      };
      res.status(500).json(errorResponse);
    }
  },

  async endRound(req: Request, res: Response): Promise<void> {
    try {
      const roundId = req.params.id;
      const body = req.body;

      const resultType = validateResultType(body.resultType);
      const specialDrawType = body.specialDrawType
        ? validateSpecialDrawType(body.specialDrawType)
        : undefined;
      const scores = body.scores;

      if (
        (resultType === RoundResultType.TSUMO ||
          resultType === RoundResultType.RON) &&
        (!scores || !Array.isArray(scores) || scores.length === 0)
      ) {
        const errorResponse: ErrorResponse = {
          error: {
            code: "VALIDATION_ERROR",
            message: "scores are required for TSUMO or RON",
          },
        };
        res.status(400).json(errorResponse);
        return;
      }

      if (
        resultType === RoundResultType.SPECIAL_DRAW &&
        !specialDrawType
      ) {
        const errorResponse: ErrorResponse = {
          error: {
            code: "VALIDATION_ERROR",
            message: "specialDrawType is required for SPECIAL_DRAW",
          },
        };
        res.status(400).json(errorResponse);
        return;
      }

      const endData: EndRoundRequest = {
        resultType,
        specialDrawType,
        scores,
      };

      const round = await roundService.endRound(roundId, endData);

      if (!round) {
        const errorResponse: ErrorResponse = {
          error: {
            code: "NOT_FOUND",
            message: "Round not found",
          },
        };
        res.status(404).json(errorResponse);
        return;
      }

      res.json({
        data: {
          id: round.id,
          hanchanId: round.hanchanId,
          roundNumber: round.roundNumber,
          wind: round.wind,
          dealerPlayerId: round.dealerPlayerId,
          dealerPlayer: {
            id: round.dealerPlayer.id,
            name: round.dealerPlayer.name,
          },
          honba: round.honba,
          riichiSticks: round.riichiSticks,
          resultType: round.resultType || null,
          specialDrawType: round.specialDrawType || null,
          startedAt: round.startedAt?.toISOString() || null,
          endedAt: round.endedAt?.toISOString() || null,
          createdAt: round.createdAt.toISOString(),
          updatedAt: round.updatedAt.toISOString(),
          scores: round.scores?.map((score) => ({
            id: score.id,
            playerId: score.playerId,
            player: {
              id: score.player.id,
              name: score.player.name,
            },
            scoreChange: score.scoreChange,
            isDealer: score.isDealer,
            isWinner: score.isWinner,
            isRonTarget: score.isRonTarget || null,
            isTenpai: score.isTenpai ?? null,
            han: score.han || null,
            fu: score.fu || null,
            yaku: score.yaku || [],
          })) || [],
        },
      });
    } catch (error) {
      console.error("Error ending round:", error);
      if (error instanceof Error) {
        if (error.message === "Round not found") {
          const errorResponse: ErrorResponse = {
            error: {
              code: "NOT_FOUND",
              message: error.message,
            },
          };
          res.status(404).json(errorResponse);
          return;
        }
        if (
          error.message === "Round must be IN_PROGRESS to end" ||
          error.message === "scores are required for TSUMO or RON" ||
          error.message === "Exactly one winner is required" ||
          error.message === "Exactly one ron target is required for RON" ||
          error.message === "playerId must be a player in the round" ||
          error.message === "specialDrawType is required for SPECIAL_DRAW"
        ) {
          const errorResponse: ErrorResponse = {
            error: {
              code: "VALIDATION_ERROR",
              message: error.message,
            },
          };
          res.status(422).json(errorResponse);
          return;
        }
      }
      const errorResponse: ErrorResponse = {
        error: {
          code: "INTERNAL_ERROR",
          message: "Internal server error",
        },
      };
      res.status(500).json(errorResponse);
    }
  },

  async calculateScore(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const body = req.body as CalculateScoreRequest;

      // バリデーション
      if (!body.resultType) {
        const errorResponse: ErrorResponse = {
          error: {
            code: "VALIDATION_ERROR",
            message: "resultType is required",
          },
        };
        res.status(400).json(errorResponse);
        return;
      }

      // 局の情報を取得
      const round = await roundService.findById(id, false);
      if (!round) {
        const errorResponse: ErrorResponse = {
          error: {
            code: "NOT_FOUND",
            message: "Round not found",
          },
        };
        res.status(404).json(errorResponse);
        return;
      }


      // 半荘の参加者情報を取得
      const prisma = getPrismaClient();
      const hanchan = await prisma.hanchan.findUnique({
        where: { id: round.hanchanId },
        include: {
          hanchanPlayers: {
            select: {
              playerId: true,
            },
          },
        },
      });

      if (!hanchan) {
        const errorResponse: ErrorResponse = {
          error: {
            code: "NOT_FOUND",
            message: "Hanchan not found",
          },
        };
        res.status(404).json(errorResponse);
        return;
      }

      const playerIds = hanchan.hanchanPlayers.map((hp) => hp.playerId);

      // バリデーション
      if (
        body.resultType === RoundResultType.TSUMO ||
        body.resultType === RoundResultType.RON
      ) {
        if (!body.winnerPlayerId) {
          const errorResponse: ErrorResponse = {
            error: {
              code: "VALIDATION_ERROR",
              message: "winnerPlayerId is required for TSUMO or RON",
            },
          };
          res.status(400).json(errorResponse);
          return;
        }

        if (!playerIds.includes(body.winnerPlayerId)) {
          const errorResponse: ErrorResponse = {
            error: {
              code: "VALIDATION_ERROR",
              message: "winnerPlayerId must be a player in the round",
            },
          };
          res.status(422).json(errorResponse);
          return;
        }

        if (body.resultType === RoundResultType.RON) {
          if (!body.ronTargetPlayerId) {
            const errorResponse: ErrorResponse = {
              error: {
                code: "VALIDATION_ERROR",
                message: "ronTargetPlayerId is required for RON",
              },
            };
            res.status(400).json(errorResponse);
            return;
          }

          if (!playerIds.includes(body.ronTargetPlayerId)) {
            const errorResponse: ErrorResponse = {
              error: {
                code: "VALIDATION_ERROR",
                message: "ronTargetPlayerId must be a player in the round",
              },
            };
            res.status(422).json(errorResponse);
            return;
          }
        }

        if (body.winnerScore === undefined) {
          const errorResponse: ErrorResponse = {
            error: {
              code: "VALIDATION_ERROR",
              message: "winnerScore is required for TSUMO or RON",
            },
          };
          res.status(400).json(errorResponse);
          return;
        }
      }

      // 打点を計算
      const calculatedScores = calculateScore({
        resultType: body.resultType,
        winnerPlayerId: body.winnerPlayerId,
        ronTargetPlayerId: body.ronTargetPlayerId,
        winnerScore: body.winnerScore,
        yaku: body.yaku,
        isNagashiMangan: body.isNagashiMangan,
        dealerPlayerId: round.dealerPlayerId,
        playerIds,
        honba: round.honba,
        riichiSticks: round.riichiSticks,
      });

      const response: CalculateScoreResponse = {
        data: {
          scores: calculatedScores,
          totalRiichiSticks: round.riichiSticks,
          totalHonba: round.honba,
        },
      };

      res.json(response);
    } catch (error) {
      console.error("Error calculating score:", error);
      if (error instanceof Error) {
        if (
          error.message.includes("must be") ||
          error.message.includes("required")
        ) {
          const errorResponse: ErrorResponse = {
            error: {
              code: "VALIDATION_ERROR",
              message: error.message,
            },
          };
          res.status(422).json(errorResponse);
          return;
        }
      }
      const errorResponse: ErrorResponse = {
        error: {
          code: "INTERNAL_ERROR",
          message: "Internal server error",
        },
      };
      res.status(500).json(errorResponse);
    }
  },

  async calculateNextSettings(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const body = req.body as CalculateNextSettingsRequest;

      // バリデーション
      if (!body.resultType) {
        const errorResponse: ErrorResponse = {
          error: {
            code: "VALIDATION_ERROR",
            message: "resultType is required",
          },
        };
        res.status(400).json(errorResponse);
        return;
      }

      // 局の情報を取得
      const round = await roundService.findById(id, false);
      if (!round) {
        const errorResponse: ErrorResponse = {
          error: {
            code: "NOT_FOUND",
            message: "Round not found",
          },
        };
        res.status(404).json(errorResponse);
        return;
      }


      // 半荘の参加者情報を取得
      const prisma = getPrismaClient();
      const hanchan = await prisma.hanchan.findUnique({
        where: { id: round.hanchanId },
        include: {
          hanchanPlayers: {
            select: {
              playerId: true,
            },
          },
        },
      });

      if (!hanchan) {
        const errorResponse: ErrorResponse = {
          error: {
            code: "NOT_FOUND",
            message: "Hanchan not found",
          },
        };
        res.status(404).json(errorResponse);
        return;
      }

      const playerIds = hanchan.hanchanPlayers.map((hp) => hp.playerId);

      // バリデーション
      let isDealerWinner = false;
      if (
        body.resultType === RoundResultType.TSUMO ||
        body.resultType === RoundResultType.RON
      ) {
        if (!body.winnerPlayerId) {
          const errorResponse: ErrorResponse = {
            error: {
              code: "VALIDATION_ERROR",
              message: "winnerPlayerId is required for TSUMO or RON",
            },
          };
          res.status(400).json(errorResponse);
          return;
        }

        if (!playerIds.includes(body.winnerPlayerId)) {
          const errorResponse: ErrorResponse = {
            error: {
              code: "VALIDATION_ERROR",
              message: "winnerPlayerId must be a player in the round",
            },
          };
          res.status(422).json(errorResponse);
          return;
        }

        isDealerWinner = body.winnerPlayerId === round.dealerPlayerId;
      }

      // 次局の設定を計算
      const nextSettings = calculateNextRoundSettings({
        currentRiichiSticks: round.riichiSticks,
        currentHonba: round.honba,
        resultType: body.resultType,
        isDealerWinner,
        isDealerTenpai: body.isDealerTenpai,
      });

      // 連荘を判定（次局の番号と風の計算に必要）
      const isRenchan = calculateIsRenchan(
        body.resultType,
        isDealerWinner,
        body.isDealerTenpai
      );

      // 次の局の番号と風を計算
      const nextRoundNumber = calculateNextRoundNumber(
        round.roundNumber,
        isRenchan
      );
      const nextWind = calculateNextWind(
        round.roundNumber,
        isRenchan
      );

      const response: CalculateNextSettingsResponse = {
        data: {
          nextRiichiSticks: nextSettings.nextRiichiSticks,
          nextHonba: nextSettings.nextHonba,
          isRenchan,
          nextRoundNumber,
          nextWind,
        },
      };

      res.json(response);
    } catch (error) {
      console.error("Error calculating next settings:", error);
      if (error instanceof Error) {
        if (
          error.message.includes("must be") ||
          error.message.includes("required")
        ) {
          const errorResponse: ErrorResponse = {
            error: {
              code: "VALIDATION_ERROR",
              message: error.message,
            },
          };
          res.status(422).json(errorResponse);
          return;
        }
      }
      const errorResponse: ErrorResponse = {
        error: {
          code: "INTERNAL_ERROR",
          message: "Internal server error",
        },
      };
      res.status(500).json(errorResponse);
    }
  },

  async getTsumoScoreLabels(req: Request, res: Response): Promise<void> {
    try {
      const isDealer = req.query.isDealer === "true";
      const labels = getTsumoScoreLabels(isDealer);
      res.json({ data: labels });
    } catch (error) {
      console.error("Error getting tsumo score labels:", error);
      const errorResponse: ErrorResponse = {
        error: {
          code: "INTERNAL_ERROR",
          message: "Internal server error",
        },
      };
      res.status(500).json(errorResponse);
    }
  },
};

