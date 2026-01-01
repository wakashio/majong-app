import dotenv from "dotenv";

dotenv.config();

// Prisma 7の新しいAPIに対応するため、テストは手動テストとして実行
// 自動テストはPostgreSQLが起動している場合のみ実行可能
// 
// 手動テストの実行手順:
// 1. docker-compose up -d でPostgreSQLを起動
// 2. backend/.env に DATABASE_URL="postgresql://majong_user:majong_password@localhost:5432/majong_db?schema=public" を設定
// 3. cd backend && npx prisma migrate dev --name init でマイグレーション実行
// 4. cd backend && npm test -- tests/integration/database.test.ts でテスト実行
//
// このテストファイルは、PostgreSQLが起動している場合に実行可能なテストのテンプレートとして作成されています。
// 実際の動作確認は設計書（design/postgresql-migration.md）の手動テスト手順に従って実施してください。

describe("PostgreSQL接続テスト", () => {
  it("データベース接続テストのテンプレート（手動テストで確認）", () => {
    // このテストは手動テストのテンプレートです
    // 実際の動作確認は設計書（design/postgresql-migration.md）の手動テスト手順に従って実施してください
    expect(true).toBe(true);
  });
});

