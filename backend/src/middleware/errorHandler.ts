import { Request, Response, NextFunction } from "express";

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * グローバルエラーハンドリングミドルウェア
 * すべてのエラーをキャッチして適切な形式でレスポンスを返す
 */
export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("=== Error Handler ===");
  console.error("Request URL:", req.url);
  console.error("Request Method:", req.method);
  console.error("Request Body:", JSON.stringify(req.body, null, 2));
  console.error("Error:", error);

  if (error instanceof Error) {
    console.error("Error Name:", error.name);
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);

    // Prismaエラーの場合
    if (error.name === "PrismaClientKnownRequestError") {
      const prismaError = error as { code?: string; meta?: unknown };
      console.error("Prisma Error Code:", prismaError.code);
      console.error("Prisma Error Meta:", JSON.stringify(prismaError.meta, null, 2));

      const errorResponse: ErrorResponse = {
        error: {
          code: "DATABASE_ERROR",
          message: "データベースエラーが発生しました",
          details: {
            code: prismaError.code,
            meta: prismaError.meta,
          },
        },
      };
      res.status(500).json(errorResponse);
      return;
    }

    // 接続エラーの場合
    if (
      error.message.includes("connect") ||
      error.message.includes("connection") ||
      error.message.includes("ECONNREFUSED") ||
      error.message.includes("ENOTFOUND")
    ) {
      const errorResponse: ErrorResponse = {
        error: {
          code: "CONNECTION_ERROR",
          message: "データベースへの接続に失敗しました",
          details: {
            message: error.message,
          },
        },
      };
      res.status(500).json(errorResponse);
      return;
    }

    // バリデーションエラーの場合
    if (error.message.includes("must be") || error.message.includes("required")) {
      const errorResponse: ErrorResponse = {
        error: {
          code: "VALIDATION_ERROR",
          message: error.message,
        },
      };
      res.status(400).json(errorResponse);
      return;
    }

    // その他のエラー
    const errorResponse: ErrorResponse = {
      error: {
        code: "INTERNAL_ERROR",
        message: "Internal server error",
        details: process.env.NODE_ENV === "development" ? {
          message: error.message,
          stack: error.stack,
        } : undefined,
      },
    };
    res.status(500).json(errorResponse);
    return;
  }

  // エラーオブジェクトでない場合
  const errorResponse: ErrorResponse = {
    error: {
      code: "UNKNOWN_ERROR",
      message: "予期しないエラーが発生しました",
      details: process.env.NODE_ENV === "development" ? {
        error: String(error),
      } : undefined,
    },
  };
  res.status(500).json(errorResponse);
}

