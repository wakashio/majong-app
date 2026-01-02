import swaggerJsdoc from "swagger-jsdoc";

// 環境に応じてAPIパスを動的に設定
const isDevelopment = process.env.NODE_ENV === "development" || !process.env.NODE_ENV;
const apiPaths = isDevelopment
  ? ["./src/routes/*.ts", "./src/controllers/*.ts"]
  : ["./dist/routes/*.js", "./dist/controllers/*.js"];

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "麻雀記録アプリ API",
      version: "1.0.0",
      description: "麻雀の記録を行うためのRESTful API",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "開発環境",
      },
    ],
    components: {
      schemas: {
        Player: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "参加者ID",
            },
            name: {
              type: "string",
              description: "参加者名",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "作成日時",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "更新日時",
            },
          },
          required: ["id", "name", "createdAt", "updatedAt"],
        },
        Session: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "セッションID",
            },
            name: {
              type: "string",
              description: "セッション名",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "作成日時",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "更新日時",
            },
          },
          required: ["id", "name", "createdAt", "updatedAt"],
        },
        Hanchan: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "半荘ID",
            },
            sessionId: {
              type: "string",
              format: "uuid",
              description: "セッションID",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "作成日時",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "更新日時",
            },
          },
          required: ["id", "sessionId", "createdAt", "updatedAt"],
        },
        Error: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                code: {
                  type: "string",
                  description: "エラーコード",
                },
                message: {
                  type: "string",
                  description: "エラーメッセージ",
                },
                details: {
                  type: "object",
                  description: "エラー詳細",
                },
              },
              required: ["code", "message"],
            },
          },
          required: ["error"],
        },
      },
    },
  },
  apis: apiPaths,
};

export const swaggerSpec = swaggerJsdoc(options);

