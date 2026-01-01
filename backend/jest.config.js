module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  setupFiles: ["<rootDir>/tests/setup.ts"],
  globals: {
    "ts-jest": {
      tsconfig: {
        // TypeScript設定
      },
    },
  },
};

// テスト実行時に環境変数を設定（モジュール読み込み前に実行）
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://majong_user:majong_password@localhost:5432/majong_db?schema=public";

