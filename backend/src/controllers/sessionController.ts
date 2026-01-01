import { Request, Response } from "express";
import { sessionService } from "../services/sessionService";
import {
  ErrorResponse,
  SessionResponse,
  SessionsListResponse,
  DeleteSessionResponse,
  SessionStatisticsResponse,
} from "../types/session";
import type { UmaOkaConfig } from "../services/umaOkaCalculationService";

function validateDate(date: unknown): string {
  if (typeof date !== "string") {
    throw new Error("date must be a string");
  }
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    throw new Error("date must be in YYYY-MM-DD format");
  }
  return date;
}

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
  if (playerIds.length < 4) {
    throw new Error("playerIds must contain at least 4 elements");
  }
  const uniqueIds = new Set(playerIds);
  if (uniqueIds.size !== playerIds.length) {
    throw new Error("playerIds must be unique");
  }
  for (const id of playerIds) {
    if (typeof id !== "string") {
      throw new Error("playerIds must be an array of strings");
    }
  }
  return playerIds;
}

export const sessionController = {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      if (limit < 1 || limit > 100) {
        const errorResponse: ErrorResponse = {
          error: {
            code: "VALIDATION_ERROR",
            message: "limit must be between 1 and 100",
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

      const { sessions, total } = await sessionService.findAll(limit, offset);

      const response: SessionsListResponse = {
        data: sessions,
        pagination: {
          total,
          limit,
          offset,
        },
      };

      res.json(response);
    } catch (error) {
      console.error("Error fetching sessions:", error);
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
      const session = await sessionService.findById(id);

      if (!session) {
        const errorResponse: ErrorResponse = {
          error: {
            code: "NOT_FOUND",
            message: "Session not found",
          },
        };
        res.status(404).json(errorResponse);
        return;
      }

      const sessionWithIncludes = session as {
        id: string;
        date: Date;
        name: string | null;
        umaOkaConfig: unknown;
        createdAt: Date;
        updatedAt: Date;
        sessionPlayers: Array<{
          id: string;
          sessionId: string;
          playerId: string;
          player: { id: string; name: string };
          createdAt: Date;
          updatedAt: Date;
        }>;
        hanchans?: Array<{
          id: string;
          name: string | null;
          startedAt: Date;
          endedAt: Date | null;
          status: string;
          hanchanPlayers: Array<{
            id: string;
            playerId: string;
            player: { id: string; name: string };
            seatPosition: number;
            initialScore: number;
            finalScore: number | null;
            finalScoreWithUmaOka: number | null;
          }>;
        }>;
      };

      const response: SessionResponse = {
        data: {
          id: sessionWithIncludes.id,
          date: sessionWithIncludes.date.toISOString(),
          name: sessionWithIncludes.name || undefined,
          umaOkaConfig: sessionWithIncludes.umaOkaConfig
            ? (sessionWithIncludes.umaOkaConfig as unknown as UmaOkaConfig)
            : undefined,
          createdAt: sessionWithIncludes.createdAt.toISOString(),
          updatedAt: sessionWithIncludes.updatedAt.toISOString(),
          sessionPlayers: sessionWithIncludes.sessionPlayers.map((sp) => ({
            id: sp.id,
            sessionId: sp.sessionId,
            playerId: sp.playerId,
            player: {
              id: sp.player.id,
              name: sp.player.name,
            },
            createdAt: sp.createdAt.toISOString(),
            updatedAt: sp.updatedAt.toISOString(),
          })),
          hanchans: sessionWithIncludes.hanchans?.map((hanchan) => ({
            id: hanchan.id,
            name: hanchan.name,
            startedAt: hanchan.startedAt.toISOString(),
            endedAt: hanchan.endedAt?.toISOString() || null,
            status: hanchan.status,
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
        },
      };

      res.json(response);
    } catch (error) {
      console.error("Error fetching session:", error);
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
      const date = validateDate(req.body.date);
      const name = validateName(req.body.name);
      const playerIds = validatePlayerIds(req.body.playerIds);
      const umaOkaConfig = req.body.umaOkaConfig as UmaOkaConfig | undefined;

      if (umaOkaConfig !== undefined && typeof umaOkaConfig !== "object") {
        const errorResponse: ErrorResponse = {
          error: {
            code: "VALIDATION_ERROR",
            message: "umaOkaConfig must be an object",
          },
        };
        res.status(400).json(errorResponse);
        return;
      }

      const session = await sessionService.create({
        date,
        name,
        playerIds,
        umaOkaConfig,
      });

      const response: SessionResponse = {
        data: {
          id: session.id,
          date: session.date.toISOString(),
          name: session.name || undefined,
          umaOkaConfig: (session as { umaOkaConfig?: unknown }).umaOkaConfig
            ? ((session as { umaOkaConfig: unknown }).umaOkaConfig as unknown as UmaOkaConfig)
            : undefined,
          createdAt: session.createdAt.toISOString(),
          updatedAt: session.updatedAt.toISOString(),
          sessionPlayers: (session as unknown as { sessionPlayers: Array<{ id: string; sessionId: string; playerId: string; player: { id: string; name: string }; createdAt: Date; updatedAt: Date }> }).sessionPlayers.map((sp) => ({
            id: sp.id,
            sessionId: sp.sessionId,
            playerId: sp.playerId,
            player: {
              id: sp.player.id,
              name: sp.player.name,
            },
            createdAt: sp.createdAt.toISOString(),
            updatedAt: sp.updatedAt.toISOString(),
          })),
        },
      };

      res.status(201).json(response);
    } catch (error) {
      console.error("Error creating session:", error);
      if (error instanceof Error) {
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
        if (error.message.includes("must") || error.message.includes("must be")) {
          const errorResponse: ErrorResponse = {
            error: {
              code: "VALIDATION_ERROR",
              message: error.message,
            },
          };
          res.status(400).json(errorResponse);
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
      const { id } = req.params;
      const name = validateName(req.body.name);
      const playerIds = req.body.playerIds !== undefined ? validatePlayerIds(req.body.playerIds) : undefined;
      const umaOkaConfig = req.body.umaOkaConfig as UmaOkaConfig | undefined;

      if (umaOkaConfig !== undefined && typeof umaOkaConfig !== "object") {
        const errorResponse: ErrorResponse = {
          error: {
            code: "VALIDATION_ERROR",
            message: "umaOkaConfig must be an object",
          },
        };
        res.status(400).json(errorResponse);
        return;
      }

      const session = await sessionService.update(id, {
        name,
        playerIds,
        umaOkaConfig,
      });

      const response: SessionResponse = {
        data: {
          id: session.id,
          date: session.date.toISOString(),
          name: session.name || undefined,
          umaOkaConfig: (session as { umaOkaConfig?: unknown }).umaOkaConfig
            ? ((session as { umaOkaConfig: unknown }).umaOkaConfig as unknown as UmaOkaConfig)
            : undefined,
          createdAt: session.createdAt.toISOString(),
          updatedAt: session.updatedAt.toISOString(),
          sessionPlayers: (session as unknown as { sessionPlayers: Array<{ id: string; sessionId: string; playerId: string; player: { id: string; name: string }; createdAt: Date; updatedAt: Date }> }).sessionPlayers.map((sp) => ({
            id: sp.id,
            sessionId: sp.sessionId,
            playerId: sp.playerId,
            player: {
              id: sp.player.id,
              name: sp.player.name,
            },
            createdAt: sp.createdAt.toISOString(),
            updatedAt: sp.updatedAt.toISOString(),
          })),
        },
      };

      res.json(response);
    } catch (error) {
      console.error("Error updating session:", error);
      if (error instanceof Error) {
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
        if (error.message.includes("must") || error.message.includes("must be")) {
          const errorResponse: ErrorResponse = {
            error: {
              code: "VALIDATION_ERROR",
              message: error.message,
            },
          };
          res.status(400).json(errorResponse);
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
      const { id } = req.params;
      const result = await sessionService.delete(id);

      const response: DeleteSessionResponse = {
        data: result,
      };

      res.json(response);
    } catch (error) {
      console.error("Error deleting session:", error);
      if (error instanceof Error && error.message.includes("not found")) {
        const errorResponse: ErrorResponse = {
          error: {
            code: "NOT_FOUND",
            message: error.message,
          },
        };
        res.status(404).json(errorResponse);
        return;
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

  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const statistics = await sessionService.getStatistics(id);

      const response: SessionStatisticsResponse = {
        data: statistics,
      };

      res.json(response);
    } catch (error) {
      console.error("Error fetching session statistics:", error);
      if (error instanceof Error && error.message.includes("not found")) {
        const errorResponse: ErrorResponse = {
          error: {
            code: "NOT_FOUND",
            message: error.message,
          },
        };
        res.status(404).json(errorResponse);
        return;
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
};

