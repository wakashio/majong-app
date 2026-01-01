import { Request, Response } from "express";
import { playerService } from "../services/playerService";
import { getPlayerStatistics } from "../services/statisticsService";
import { getPlayerHistory } from "../services/historyService";
import type { ErrorResponse, PlayerStatisticsResponse, PlayerHistoryResponse } from "../types/player";

function validateName(name: unknown): string {
  if (typeof name !== "string") {
    throw new Error("name must be a string");
  }
  if (name.trim().length === 0) {
    throw new Error("name is required");
  }
  if (name.length > 100) {
    throw new Error("name must be 100 characters or less");
  }
  return name.trim();
}

export const playerController = {
  async list(_req: Request, res: Response): Promise<void> {
    try {
      const players = await playerService.findAll();
      res.json({
        data: players.map((player) => ({
          id: player.id,
          name: player.name,
          createdAt: player.createdAt.toISOString(),
          updatedAt: player.updatedAt.toISOString(),
        })),
      });
    } catch (error) {
      console.error("Error fetching players:", error);
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
      const player = await playerService.findById(id);

      if (!player) {
        const errorResponse: ErrorResponse = {
          error: {
            code: "NOT_FOUND",
            message: "Player not found",
          },
        };
        res.status(404).json(errorResponse);
        return;
      }

      res.json({
        data: {
          id: player.id,
          name: player.name,
          createdAt: player.createdAt.toISOString(),
          updatedAt: player.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error("Error fetching player:", error);
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

      const existingPlayer = await playerService.findByName(name);
      if (existingPlayer) {
        const errorResponse: ErrorResponse = {
          error: {
            code: "VALIDATION_ERROR",
            message: "name must be unique",
          },
        };
        res.status(422).json(errorResponse);
        return;
      }

      const player = await playerService.create({ name });
      res.status(201).json({
        data: {
          id: player.id,
          name: player.name,
          createdAt: player.createdAt.toISOString(),
          updatedAt: player.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("must be")) {
        const errorResponse: ErrorResponse = {
          error: {
            code: "VALIDATION_ERROR",
            message: error.message,
          },
        };
        res.status(400).json(errorResponse);
        return;
      }
      console.error("Error creating player:", error);
      const errorResponse: ErrorResponse = {
        error: {
          code: "INTERNAL_ERROR",
          message: "Internal server error",
        },
      };
      res.status(500).json(errorResponse);
    }
  },

  async bulkCreate(req: Request, res: Response): Promise<void> {
    try {
      // リクエストボディのバリデーション
      if (!req.body.names) {
        const errorResponse: ErrorResponse = {
          error: {
            code: "VALIDATION_ERROR",
            message: "names is required",
          },
        };
        res.status(400).json(errorResponse);
        return;
      }

      if (!Array.isArray(req.body.names)) {
        const errorResponse: ErrorResponse = {
          error: {
            code: "VALIDATION_ERROR",
            message: "names must be an array",
          },
        };
        res.status(400).json(errorResponse);
        return;
      }

      if (req.body.names.length === 0) {
        const errorResponse: ErrorResponse = {
          error: {
            code: "VALIDATION_ERROR",
            message: "names must be an array with at least one element",
          },
        };
        res.status(400).json(errorResponse);
        return;
      }

      // 各名前のバリデーション
      const validatedNames: string[] = [];
      for (const name of req.body.names) {
        try {
          const validatedName = validateName(name);
          validatedNames.push(validatedName);
        } catch (error) {
          if (error instanceof Error && error.message.includes("must be")) {
            const errorResponse: ErrorResponse = {
              error: {
                code: "VALIDATION_ERROR",
                message: error.message,
              },
            };
            res.status(400).json(errorResponse);
            return;
          }
          throw error;
        }
      }

      // リクエスト内での重複チェック
      const nameSet = new Set<string>();
      const duplicates: string[] = [];
      for (const name of validatedNames) {
        if (nameSet.has(name)) {
          duplicates.push(name);
        } else {
          nameSet.add(name);
        }
      }

      if (duplicates.length > 0) {
        const errorResponse: ErrorResponse = {
          error: {
            code: "VALIDATION_ERROR",
            message: `Duplicate names in request: ${duplicates.join(", ")}`,
          },
        };
        res.status(422).json(errorResponse);
        return;
      }

      // 既存プレイヤーとの重複チェック
      for (const name of validatedNames) {
        const existingPlayer = await playerService.findByName(name);
        if (existingPlayer) {
          const errorResponse: ErrorResponse = {
            error: {
              code: "VALIDATION_ERROR",
              message: "name must be unique",
            },
          };
          res.status(422).json(errorResponse);
          return;
        }
      }

      // トランザクション内で全てのプレイヤーを作成
      const createData = validatedNames.map((name) => ({ name }));
      const players = await playerService.bulkCreate(createData);

      res.status(201).json({
        data: players.map((player) => ({
          id: player.id,
          name: player.name,
          createdAt: player.createdAt.toISOString(),
          updatedAt: player.updatedAt.toISOString(),
        })),
      });
    } catch (error) {
      console.error("Error bulk creating players:", error);
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

      const existingPlayer = await playerService.findById(id);
      if (!existingPlayer) {
        const errorResponse: ErrorResponse = {
          error: {
            code: "NOT_FOUND",
            message: "Player not found",
          },
        };
        res.status(404).json(errorResponse);
        return;
      }

      const playerWithSameName = await playerService.findByName(name);
      if (playerWithSameName && playerWithSameName.id !== id) {
        const errorResponse: ErrorResponse = {
          error: {
            code: "VALIDATION_ERROR",
            message: "name must be unique",
          },
        };
        res.status(422).json(errorResponse);
        return;
      }

      const player = await playerService.update(id, { name });
      res.json({
        data: {
          id: player.id,
          name: player.name,
          createdAt: player.createdAt.toISOString(),
          updatedAt: player.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("must be")) {
        const errorResponse: ErrorResponse = {
          error: {
            code: "VALIDATION_ERROR",
            message: error.message,
          },
        };
        res.status(400).json(errorResponse);
        return;
      }
      console.error("Error updating player:", error);
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

      const existingPlayer = await playerService.findById(id);
      if (!existingPlayer) {
        const errorResponse: ErrorResponse = {
          error: {
            code: "NOT_FOUND",
            message: "Player not found",
          },
        };
        res.status(404).json(errorResponse);
        return;
      }

      const hasHanchans = await playerService.hasHanchans(id);
      if (hasHanchans) {
        const errorResponse: ErrorResponse = {
          error: {
            code: "VALIDATION_ERROR",
            message: "Cannot delete player with existing hanchans",
          },
        };
        res.status(422).json(errorResponse);
        return;
      }

      await playerService.delete(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting player:", error);
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
      const statistics = await getPlayerStatistics(id);
      const response: PlayerStatisticsResponse = {
        data: statistics,
      };
      res.json(response);
    } catch (error) {
      if (error instanceof Error && error.message === "Player not found") {
        const errorResponse: ErrorResponse = {
          error: {
            code: "NOT_FOUND",
            message: "Player not found",
          },
        };
        res.status(404).json(errorResponse);
        return;
      }
      console.error("Error fetching player statistics:", error);
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
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
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

      const { data, total } = await getPlayerHistory(id, limit, offset);
      const response: PlayerHistoryResponse = {
        data,
        pagination: {
          total,
          limit,
          offset,
        },
      };
      res.json(response);
    } catch (error) {
      if (error instanceof Error && error.message === "Player not found") {
        const errorResponse: ErrorResponse = {
          error: {
            code: "NOT_FOUND",
            message: "Player not found",
          },
        };
        res.status(404).json(errorResponse);
        return;
      }
      console.error("Error fetching player history:", error);
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

