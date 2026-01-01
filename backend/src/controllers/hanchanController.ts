import { Request, Response } from "express";
import { hanchanService } from "../services/hanchanService";
import { getHanchanStatistics } from "../services/statisticsService";
import { getHanchanHistory } from "../services/historyService";
import { HanchanStatus, ErrorResponse, HanchanStatisticsResponse, HanchanHistoryResponse } from "../types/hanchan";
import type { UmaOkaConfig } from "../services/umaOkaCalculationService";

function validateName(name: unknown): string | undefined {
  if (name === undefined || name === null) {
    return undefined;
  }
  if (typeof name !== "string") {
    throw new Error("name must be a string");
  }
  if (name.length > 100) {
    throw new Error("name must be 100 characters or less");
  }
  return name.trim() || undefined;
}

function validatePlayerIds(playerIds: unknown): string[] {
  if (!Array.isArray(playerIds)) {
    throw new Error("playerIds must be an array");
  }
  if (playerIds.length !== 4) {
    throw new Error("playerIds must contain exactly 4 elements");
  }
  const uniqueIds = new Set(playerIds);
  if (uniqueIds.size !== 4) {
    throw new Error("playerIds must be unique");
  }
  for (const id of playerIds) {
    if (typeof id !== "string") {
      throw new Error("playerIds must be an array of strings");
    }
  }
  return playerIds;
}

function validateSeatPositions(seatPositions: unknown): number[] | undefined {
  if (seatPositions === undefined || seatPositions === null) {
    return undefined;
  }
  if (!Array.isArray(seatPositions)) {
    throw new Error("seatPositions must be an array");
  }
  if (seatPositions.length !== 4) {
    throw new Error("seatPositions must contain exactly 4 elements");
  }
  const uniquePositions = new Set(seatPositions);
  if (uniquePositions.size !== 4) {
    throw new Error("seatPositions must be unique");
  }
  for (const pos of seatPositions) {
    if (typeof pos !== "number" || pos < 0 || pos > 3) {
      throw new Error("seatPositions must be integers between 0 and 3");
    }
  }
  return seatPositions;
}

function validateStatus(status: unknown): HanchanStatus | undefined {
  if (status === undefined || status === null) {
    return undefined;
  }
  if (typeof status !== "string") {
    throw new Error("status must be a string");
  }
  if (status !== HanchanStatus.IN_PROGRESS && status !== HanchanStatus.COMPLETED) {
    throw new Error("status must be IN_PROGRESS or COMPLETED");
  }
  return status as HanchanStatus;
}

function validateSessionId(sessionId: unknown): string {
  if (typeof sessionId !== "string") {
    throw new Error("sessionId must be a string");
  }
  return sessionId;
}

export const hanchanController = {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      if (status && status !== HanchanStatus.IN_PROGRESS && status !== HanchanStatus.COMPLETED) {
        const errorResponse: ErrorResponse = {
          error: {
            code: "VALIDATION_ERROR",
            message: "status must be IN_PROGRESS or COMPLETED",
          },
        };
        res.status(400).json(errorResponse);
        return;
      }

      if (limit < 1 || limit > 1000) {
        const errorResponse: ErrorResponse = {
          error: {
            code: "VALIDATION_ERROR",
            message: "limit must be between 1 and 1000",
          },
        };
        res.status(400).json(errorResponse);
        return;
      }

      if (offset < 0) {
        const errorResponse: ErrorResponse = {
          error: {
            code: "VALIDATION_ERROR",
            message: "offset must be 0 or greater",
          },
        };
        res.status(400).json(errorResponse);
        return;
      }

      const hanchanStatus = status ? (status as HanchanStatus) : undefined;
      const { hanchans, total } = await hanchanService.findAll(hanchanStatus, limit, offset);

      res.json({
        data: hanchans.map((hanchan) => ({
          id: hanchan.id,
          name: hanchan.name,
          startedAt: hanchan.startedAt.toISOString(),
          endedAt: hanchan.endedAt?.toISOString() || null,
          status: hanchan.status,
          sessionId: hanchan.sessionId || null,
          createdAt: hanchan.createdAt.toISOString(),
          updatedAt: hanchan.updatedAt.toISOString(),
          hanchanPlayers: hanchan.hanchanPlayers.map((hp) => ({
            id: hp.id,
            playerId: hp.playerId,
            player: {
              id: hp.player.id,
              name: hp.player.name,
            },
            seatPosition: hp.seatPosition,
            initialScore: hp.initialScore,
            finalScore: hp.finalScore || null,
            finalScoreWithUmaOka: hp.finalScoreWithUmaOka || null,
          })),
        })),
        meta: {
          total,
          limit,
          offset,
        },
      });
    } catch (error) {
      console.error("Error fetching hanchans:", error);
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
      const { id } = req.params;
      const hanchan = await hanchanService.findById(id);

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

      res.json({
        data: {
          id: hanchan.id,
          name: hanchan.name,
          startedAt: hanchan.startedAt.toISOString(),
          endedAt: hanchan.endedAt?.toISOString() || null,
          status: hanchan.status,
          createdAt: hanchan.createdAt.toISOString(),
          updatedAt: hanchan.updatedAt.toISOString(),
          hanchanPlayers: hanchan.hanchanPlayers.map((hp) => ({
            id: hp.id,
            playerId: hp.playerId,
            player: {
              id: hp.player.id,
              name: hp.player.name,
            },
            seatPosition: hp.seatPosition,
            initialScore: hp.initialScore,
            finalScore: hp.finalScore || null,
            finalScoreWithUmaOka: hp.finalScoreWithUmaOka || null,
          })),
          rounds: hanchan.rounds?.map((round) => ({
            id: round.id,
            roundNumber: round.roundNumber,
            wind: round.wind,
            dealerPlayerId: round.dealerPlayerId,
            honba: round.honba,
            riichiSticks: round.riichiSticks,
            startedAt: round.startedAt?.toISOString() || null,
            endedAt: round.endedAt?.toISOString() || null,
          })),
        },
      });
    } catch (error) {
      console.error("Error fetching hanchan:", error);
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
      const name = validateName(req.body.name);
      const playerIds = validatePlayerIds(req.body.playerIds);
      const seatPositions = validateSeatPositions(req.body.seatPositions);
      const sessionId = req.body.sessionId ? validateSessionId(req.body.sessionId) : undefined;

      const hanchan = await hanchanService.create({
        name,
        playerIds,
        seatPositions,
        sessionId,
      });

      res.status(201).json({
        data: {
          id: hanchan.id,
          name: hanchan.name,
          startedAt: hanchan.startedAt.toISOString(),
          endedAt: hanchan.endedAt?.toISOString() || null,
          status: hanchan.status,
          sessionId: hanchan.sessionId || null,
          createdAt: hanchan.createdAt.toISOString(),
          updatedAt: hanchan.updatedAt.toISOString(),
          hanchanPlayers: hanchan.hanchanPlayers.map((hp) => ({
            id: hp.id,
            playerId: hp.playerId,
            player: {
              id: hp.player.id,
              name: hp.player.name,
            },
            seatPosition: hp.seatPosition,
            initialScore: hp.initialScore,
            finalScore: hp.finalScore || null,
            finalScoreWithUmaOka: hp.finalScoreWithUmaOka || null,
          })),
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("must be") || error.message.includes("must contain")) {
          const errorResponse: ErrorResponse = {
            error: {
              code: "VALIDATION_ERROR",
              message: error.message,
            },
          };
          res.status(400).json(errorResponse);
          return;
        }
        if (error.message.includes("not found")) {
          const errorResponse: ErrorResponse = {
            error: {
              code: "NOT_FOUND",
              message: error.message,
            },
          };
          res.status(404).json(errorResponse);
          return;
        }
        if (error.message.includes("must be unique")) {
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
      console.error("Error creating hanchan:", error);
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
      const { id } = req.params;
      const name = validateName(req.body.name);
      const status = validateStatus(req.body.status);
      const finalScores = req.body.finalScores as Record<string, number> | undefined;
      const umaOkaConfigRaw = req.body.umaOkaConfig as
        | {
            initialScore?: number;
            returnScore?: number;
            uma?: [number, number, number, number];
          }
        | undefined;

      if (finalScores !== undefined && typeof finalScores !== "object") {
        const errorResponse: ErrorResponse = {
          error: {
            code: "VALIDATION_ERROR",
            message: "finalScores must be an object",
          },
        };
        res.status(400).json(errorResponse);
        return;
      }

      let umaOkaConfig: UmaOkaConfig | undefined;
      if (umaOkaConfigRaw !== undefined) {
        if (typeof umaOkaConfigRaw !== "object") {
          const errorResponse: ErrorResponse = {
            error: {
              code: "VALIDATION_ERROR",
              message: "umaOkaConfig must be an object",
            },
          };
          res.status(400).json(errorResponse);
          return;
        }
        // すべてのフィールドが存在する場合のみUmaOkaConfigとして扱う
        if (
          umaOkaConfigRaw.initialScore !== undefined &&
          umaOkaConfigRaw.returnScore !== undefined &&
          umaOkaConfigRaw.uma !== undefined
        ) {
          umaOkaConfig = {
            initialScore: umaOkaConfigRaw.initialScore,
            returnScore: umaOkaConfigRaw.returnScore,
            uma: umaOkaConfigRaw.uma,
          };
        }
      }

      const existingHanchan = await hanchanService.findById(id);
      if (!existingHanchan) {
        const errorResponse: ErrorResponse = {
          error: {
            code: "NOT_FOUND",
            message: "Hanchan not found",
          },
        };
        res.status(404).json(errorResponse);
        return;
      }

      const hanchan = await hanchanService.update(id, {
        name,
        status,
        finalScores,
        umaOkaConfig,
      });

      res.json({
        data: {
          id: hanchan.id,
          name: hanchan.name,
          startedAt: hanchan.startedAt.toISOString(),
          endedAt: hanchan.endedAt?.toISOString() || null,
          status: hanchan.status,
          createdAt: hanchan.createdAt.toISOString(),
          updatedAt: hanchan.updatedAt.toISOString(),
          hanchanPlayers: hanchan.hanchanPlayers.map((hp) => ({
            id: hp.id,
            playerId: hp.playerId,
            player: {
              id: hp.player.id,
              name: hp.player.name,
            },
            seatPosition: hp.seatPosition,
            initialScore: hp.initialScore,
            finalScore: hp.finalScore || null,
            finalScoreWithUmaOka: hp.finalScoreWithUmaOka || null,
          })),
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("must be") || error.message.includes("Invalid")) {
          const errorResponse: ErrorResponse = {
            error: {
              code: "VALIDATION_ERROR",
              message: error.message,
            },
          };
          res.status(400).json(errorResponse);
          return;
        }
        if (error.message.includes("not found")) {
          const errorResponse: ErrorResponse = {
            error: {
              code: error.message.includes("Player") ? "VALIDATION_ERROR" : "NOT_FOUND",
              message: error.message,
            },
          };
          const statusCode = error.message.includes("Player") ? 422 : 404;
          res.status(statusCode).json(errorResponse);
          return;
        }
      }
      console.error("Error updating hanchan:", error);
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
      const { id } = req.params;

      const existingHanchan = await hanchanService.findById(id);
      if (!existingHanchan) {
        const errorResponse: ErrorResponse = {
          error: {
            code: "NOT_FOUND",
            message: "Hanchan not found",
          },
        };
        res.status(404).json(errorResponse);
        return;
      }

      await hanchanService.delete(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting hanchan:", error);
      const errorResponse: ErrorResponse = {
        error: {
          code: "INTERNAL_ERROR",
          message: "Internal server error",
        },
      };
      res.status(500).json(errorResponse);
    }
  },

  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const statistics = await getHanchanStatistics(id);
      const response: HanchanStatisticsResponse = {
        data: statistics,
      };
      res.json(response);
    } catch (error) {
      if (error instanceof Error && error.message === "Hanchan not found") {
        const errorResponse: ErrorResponse = {
          error: {
            code: "NOT_FOUND",
            message: "Hanchan not found",
          },
        };
        res.status(404).json(errorResponse);
        return;
      }
      console.error("Error fetching hanchan statistics:", error);
      const errorResponse: ErrorResponse = {
        error: {
          code: "INTERNAL_ERROR",
          message: "Internal server error",
        },
      };
      res.status(500).json(errorResponse);
    }
  },

  async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      if (limit < 1 || limit > 200) {
        const errorResponse: ErrorResponse = {
          error: {
            code: "VALIDATION_ERROR",
            message: "limit must be between 1 and 200",
          },
        };
        res.status(400).json(errorResponse);
        return;
      }

      if (offset < 0) {
        const errorResponse: ErrorResponse = {
          error: {
            code: "VALIDATION_ERROR",
            message: "offset must be 0 or greater",
          },
        };
        res.status(400).json(errorResponse);
        return;
      }

      const { data, total } = await getHanchanHistory(id, limit, offset);
      const response: HanchanHistoryResponse = {
        data,
        pagination: {
          total,
          limit,
          offset,
        },
      };
      res.json(response);
    } catch (error) {
      if (error instanceof Error && error.message === "Hanchan not found") {
        const errorResponse: ErrorResponse = {
          error: {
            code: "NOT_FOUND",
            message: "Hanchan not found",
          },
        };
        res.status(404).json(errorResponse);
        return;
      }
      console.error("Error fetching hanchan history:", error);
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

