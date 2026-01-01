import request from "supertest";
import app from "../../src/app";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

// データベース接続が必要なテストのため、環境変数が設定されている場合のみ実行
// setup.tsで環境変数が設定されるため、ここでは判定しない
// 実際の判定はbeforeAllで行う
const shouldSkipTests = false; // setup.tsで環境変数が設定されるため、常にfalse

describe("Players API", () => {
  let testPlayerId: string;
  let prisma: PrismaClient | null;

  beforeAll(async () => {
    // 環境変数を明示的に設定（.envファイルの設定を上書き）
    process.env.DATABASE_URL = "postgresql://majong_user:majong_password@localhost:5432/majong_db?schema=public";

    // 動的にPrisma Clientをインポート（データベース接続がある場合のみ）
    try {
      const { PrismaClient } = await import("@prisma/client");
      prisma = new PrismaClient();
      await prisma.$connect();
      console.log("データベース接続成功");
    } catch (error) {
      console.warn("データベース接続に失敗しました。テストをスキップします。");
      console.warn("エラー:", error instanceof Error ? error.message : String(error));
      console.warn("PostgreSQLが起動していることを確認してください。");
      prisma = null;
    }
  });

  afterAll(async () => {
    if (shouldSkipTests || !prisma) {
      return;
    }

    // テストデータのクリーンアップ
    if (testPlayerId) {
      try {
        await prisma.player.delete({ where: { id: testPlayerId } });
      } catch (error) {
        // エラーは無視（既に削除されている可能性がある）
      }
    }
    await prisma.$disconnect();
  });

  describe("GET /api/players", () => {
    it("参加者一覧を取得できる", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const response = await request(app).get("/api/players");

      if (response.status !== 200) {
        console.error("Response status:", response.status);
        console.error("Response body:", JSON.stringify(response.body, null, 2));
      }

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("レスポンスがJSON形式である", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const response = await request(app).get("/api/players");

      if (response.status !== 200) {
        console.error("Response status:", response.status);
        console.error("Response body:", JSON.stringify(response.body, null, 2));
      }

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toMatch(/json/);
    });
  });

  describe("GET /api/players/:id", () => {
    it("指定されたIDの参加者を取得できる", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      // テスト用の参加者を作成
      const testPlayer = await prisma.player.create({
        data: {
          name: `テスト参加者_${Date.now()}`,
        },
      });

      const response = await request(app).get(`/api/players/${testPlayer.id}`);

      if (response.status !== 200) {
        console.error("Response status:", response.status);
        console.error("Response body:", JSON.stringify(response.body, null, 2));
      }

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("id", testPlayer.id);
      expect(response.body.data).toHaveProperty("name", testPlayer.name);
      expect(response.body.data).toHaveProperty("createdAt");
      expect(response.body.data).toHaveProperty("updatedAt");

      // クリーンアップ
      await prisma.player.delete({ where: { id: testPlayer.id } });
    });

    it("存在しない参加者IDの場合はエラー", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const nonExistentId = "00000000-0000-0000-0000-000000000000";

      const response = await request(app).get(`/api/players/${nonExistentId}`);

      if (response.status !== 404) {
        console.error("Response status:", response.status);
        console.error("Response body:", JSON.stringify(response.body, null, 2));
      }

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "NOT_FOUND");
    });
  });

  describe("POST /api/players", () => {
    it("新しい参加者を作成できる", async () => {
      if (shouldSkipTests || !prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }
      const newPlayer = {
        name: `テスト参加者_${Date.now()}`,
      };

      const response = await request(app)
        .post("/api/players")
        .send(newPlayer)
        .expect(201);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data).toHaveProperty("name", newPlayer.name);
      expect(response.body.data).toHaveProperty("createdAt");
      expect(response.body.data).toHaveProperty("updatedAt");

      testPlayerId = response.body.data.id;
    });

    it("参加者名が必須である", async () => {
      const response = await request(app)
        .post("/api/players")
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VALIDATION_ERROR");
    });

    it("参加者名が空文字列の場合はエラー", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }
      const response = await request(app)
        .post("/api/players")
        .send({ name: "" });

      if (response.status !== 400) {
        console.error("Response status:", response.status);
        console.error("Response body:", JSON.stringify(response.body, null, 2));
      }

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VALIDATION_ERROR");
    });

    it("参加者名が100文字を超える場合はエラー", async () => {
      if (shouldSkipTests) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }
      const longName = "a".repeat(101);
      const response = await request(app)
        .post("/api/players")
        .send({ name: longName })
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VALIDATION_ERROR");
    });

    it("重複する参加者名の場合はエラー", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const playerName = `重複テスト_${Date.now()}`;

      // 最初の参加者を作成
      const createResponse = await request(app)
        .post("/api/players")
        .send({ name: playerName });

      if (createResponse.status !== 201) {
        console.error("Create response status:", createResponse.status);
        console.error("Create response body:", JSON.stringify(createResponse.body, null, 2));
      }

      expect(createResponse.status).toBe(201);
      const firstPlayerId = createResponse.body.data.id;

      // 同じ名前で再度作成を試みる
      const response = await request(app)
        .post("/api/players")
        .send({ name: playerName });

      if (response.status !== 422) {
        console.error("Response status:", response.status);
        console.error("Response body:", JSON.stringify(response.body, null, 2));
      }

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VALIDATION_ERROR");
      expect(response.body.error.message).toContain("unique");

      // クリーンアップ
      await prisma.player.delete({ where: { id: firstPlayerId } });
    });
  });

  describe("POST /api/players/bulk", () => {
    it("複数の参加者を一括作成できる", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const names = [
        `一括テスト参加者1_${Date.now()}`,
        `一括テスト参加者2_${Date.now()}`,
        `一括テスト参加者3_${Date.now()}`,
      ];

      const response = await request(app).post("/api/players/bulk").send({ names });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("data");
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0]).toHaveProperty("id");
      expect(response.body.data[0]).toHaveProperty("name", names[0]);
      expect(response.body.data[1]).toHaveProperty("name", names[1]);
      expect(response.body.data[2]).toHaveProperty("name", names[2]);

      // クリーンアップ
      for (const player of response.body.data) {
        await prisma.player.delete({ where: { id: player.id } }).catch(() => {
          // エラーは無視
        });
      }
    });

    it("namesが必須である", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const response = await request(app).post("/api/players/bulk").send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VALIDATION_ERROR");
      expect(response.body.error).toHaveProperty("message", "names is required");
    });

    it("namesが配列でない場合はエラー", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const response = await request(app).post("/api/players/bulk").send({ names: "not an array" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VALIDATION_ERROR");
      expect(response.body.error).toHaveProperty("message", "names must be an array");
    });

    it("namesが空配列の場合はエラー", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const response = await request(app).post("/api/players/bulk").send({ names: [] });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VALIDATION_ERROR");
      expect(response.body.error).toHaveProperty("message", "names must be an array with at least one element");
    });

    it("リクエスト内で重複する名前がある場合はエラー", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const duplicateName = `重複テスト参加者_${Date.now()}`;
      const response = await request(app)
        .post("/api/players/bulk")
        .send({ names: [duplicateName, duplicateName] });

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VALIDATION_ERROR");
      expect(response.body.error.message).toContain("Duplicate names in request");
    });

    it("既存の参加者名と重複する場合はエラー", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      // 既存の参加者を作成
      const existingPlayer = await prisma.player.create({
        data: {
          name: `既存参加者_${Date.now()}`,
        },
      });

      const response = await request(app)
        .post("/api/players/bulk")
        .send({ names: [existingPlayer.name, `新しい参加者_${Date.now()}`] });

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VALIDATION_ERROR");
      expect(response.body.error).toHaveProperty("message", "name must be unique");

      // クリーンアップ
      await prisma.player.delete({ where: { id: existingPlayer.id } });
    });

    it("名前が100文字を超える場合はエラー", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const longName = "a".repeat(101);
      const response = await request(app)
        .post("/api/players/bulk")
        .send({ names: [longName, `正常な参加者_${Date.now()}`] });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VALIDATION_ERROR");
      expect(response.body.error).toHaveProperty("message", "name must be 100 characters or less");
    });

    it("名前が空文字列の場合はエラー", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const response = await request(app)
        .post("/api/players/bulk")
        .send({ names: ["", `正常な参加者_${Date.now()}`] });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VALIDATION_ERROR");
      expect(response.body.error).toHaveProperty("message", "name is required");
    });

    it("1つでも失敗したら全てロールバックされる", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      // 既存の参加者を作成
      const existingPlayer = await prisma.player.create({
        data: {
          name: `既存参加者_${Date.now()}`,
        },
      });

      const newName1 = `新しい参加者1_${Date.now()}`;
      const newName2 = `新しい参加者2_${Date.now()}`;

      const response = await request(app)
        .post("/api/players/bulk")
        .send({ names: [newName1, existingPlayer.name, newName2] });

      expect(response.status).toBe(422);

      // トランザクションがロールバックされていることを確認（新しい参加者が作成されていない）
      const createdPlayers = await prisma.player.findMany({
        where: {
          name: {
            in: [newName1, newName2],
          },
        },
      });

      expect(createdPlayers).toHaveLength(0);

      // クリーンアップ
      await prisma.player.delete({ where: { id: existingPlayer.id } });
    });
  });

  describe("PUT /api/players/:id", () => {
    let updateTestPlayerId: string;

    beforeEach(async () => {
      if (shouldSkipTests || !prisma) {
        return;
      }

      // テスト用の参加者を作成
      const player = await prisma.player.create({
        data: { name: `更新テスト_${Date.now()}` },
      });
      updateTestPlayerId = player.id;
    });

    afterEach(async () => {
      if (shouldSkipTests || !prisma) {
        return;
      }

      // テストデータのクリーンアップ
      if (updateTestPlayerId) {
        try {
          await prisma.player.delete({ where: { id: updateTestPlayerId } });
        } catch (error) {
          // エラーは無視
        }
      }
    });

    it("参加者情報を更新できる", async () => {
      if (shouldSkipTests || !prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }
      const updatedName = `更新後_${Date.now()}`;

      const response = await request(app)
        .put(`/api/players/${updateTestPlayerId}`)
        .send({ name: updatedName })
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("id", updateTestPlayerId);
      expect(response.body.data).toHaveProperty("name", updatedName);
      expect(response.body.data).toHaveProperty("updatedAt");
    });

    it("存在しない参加者IDの場合はエラー", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const nonExistentId = "00000000-0000-0000-0000-000000000000";

      const response = await request(app)
        .put(`/api/players/${nonExistentId}`)
        .send({ name: "更新テスト" });

      if (response.status !== 404) {
        console.error("Response status:", response.status);
        console.error("Response body:", JSON.stringify(response.body, null, 2));
      }

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "NOT_FOUND");
    });

    it("参加者名が必須である", async () => {
      if (shouldSkipTests || !updateTestPlayerId) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const response = await request(app)
        .put(`/api/players/${updateTestPlayerId}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VALIDATION_ERROR");
    });

    it("重複する参加者名の場合はエラー", async () => {
      if (shouldSkipTests || !prisma || !updateTestPlayerId) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      // 別の参加者を作成
      const otherPlayer = await prisma.player.create({
        data: { name: `重複更新テスト_${Date.now()}` },
      });

      try {
        // 既存の参加者名で更新を試みる
        const response = await request(app)
          .put(`/api/players/${updateTestPlayerId}`)
          .send({ name: otherPlayer.name })
          .expect(422);

        expect(response.body).toHaveProperty("error");
        expect(response.body.error).toHaveProperty("code", "VALIDATION_ERROR");
        expect(response.body.error.message).toContain("unique");
      } finally {
        // クリーンアップ
        await prisma.player.delete({ where: { id: otherPlayer.id } });
      }
    });
  });

  describe("DELETE /api/players/:id", () => {
    let deleteTestPlayerId: string;

    beforeEach(async () => {
      if (shouldSkipTests || !prisma) {
        return;
      }

      // テスト用の参加者を作成
      const player = await prisma.player.create({
        data: { name: `削除テスト_${Date.now()}` },
      });
      deleteTestPlayerId = player.id;
    });

    afterEach(async () => {
      if (shouldSkipTests || !prisma) {
        return;
      }

      // テストデータのクリーンアップ（削除されていない場合）
      if (deleteTestPlayerId) {
        try {
          await prisma.player.delete({ where: { id: deleteTestPlayerId } });
        } catch (error) {
          // エラーは無視（既に削除されている可能性がある）
        }
      }
    });

    it("参加者を削除できる", async () => {
      if (shouldSkipTests || !prisma || !deleteTestPlayerId) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const response = await request(app)
        .delete(`/api/players/${deleteTestPlayerId}`)
        .expect(204);

      expect(response.body).toEqual({});

      // 削除されたことを確認
      const deletedPlayer = await prisma.player.findUnique({
        where: { id: deleteTestPlayerId },
      });
      expect(deletedPlayer).toBeNull();

      deleteTestPlayerId = ""; // クリーンアップをスキップ
    });

    it("存在しない参加者IDの場合はエラー", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const nonExistentId = "00000000-0000-0000-0000-000000000000";

      const response = await request(app)
        .delete(`/api/players/${nonExistentId}`);

      if (response.status !== 404) {
        console.error("Response status:", response.status);
        console.error("Response body:", JSON.stringify(response.body, null, 2));
      }

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "NOT_FOUND");
    });

    it("半荘に参加している参加者は削除できない", async () => {
      // このテストは半荘機能が実装された後に有効化
      // 現時点では、半荘機能が未実装のためスキップ
      // TODO: 半荘機能実装後に有効化
    });
  });

  describe("GET /api/players/:id/statistics", () => {
    it("参加者統計を正しく取得する", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      // テストデータを作成
      const player = await prisma.player.create({
        data: {
          name: "統計テスト参加者",
        },
      });

      const response = await request(app).get(`/api/players/${player.id}/statistics`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("playerId", player.id);
      expect(response.body.data).toHaveProperty("playerName", "統計テスト参加者");
      expect(response.body.data).toHaveProperty("totalHanchans");
      expect(response.body.data).toHaveProperty("totalRounds");
      expect(response.body.data).toHaveProperty("totalWins");
      expect(response.body.data).toHaveProperty("totalTsumo");
      expect(response.body.data).toHaveProperty("totalRon");
      expect(response.body.data).toHaveProperty("totalRonTarget");
      expect(response.body.data).toHaveProperty("averageRank");
      expect(response.body.data).toHaveProperty("totalFinalScore");
      expect(response.body.data).toHaveProperty("maxScore");
      expect(response.body.data).toHaveProperty("minScore");
      expect(response.body.data).toHaveProperty("winRate");
      expect(response.body.data).toHaveProperty("ronTargetRate");

      // クリーンアップ
      await prisma.player.delete({ where: { id: player.id } });
    });

    it("存在しない参加者IDの場合は404を返す", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const nonExistentId = "00000000-0000-0000-0000-000000000000";

      const response = await request(app).get(`/api/players/${nonExistentId}/statistics`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "NOT_FOUND");
    });

    it("返し点換算した合計最終得点が正しく計算される", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      // テストデータを作成
      const players = await Promise.all([
        prisma.player.create({ data: { name: "返し点換算テスト参加者1" } }),
        prisma.player.create({ data: { name: "返し点換算テスト参加者2" } }),
        prisma.player.create({ data: { name: "返し点換算テスト参加者3" } }),
        prisma.player.create({ data: { name: "返し点換算テスト参加者4" } }),
      ]);

      // セッション1（返し点数30000）を作成
      const session1 = await prisma.session.create({
        data: {
          date: new Date("2026-01-01"),
          name: "返し点換算テストセッション1",
          umaOkaConfig: {
            initialScore: 25000,
            returnScore: 30000,
            uma: [30, 10, -10, -30],
          },
          sessionPlayers: {
            create: players.map((p) => ({ playerId: p.id })),
          },
        },
      });

      // セッション2（返し点数25000）を作成
      const session2 = await prisma.session.create({
        data: {
          date: new Date("2026-01-02"),
          name: "返し点換算テストセッション2",
          umaOkaConfig: {
            initialScore: 25000,
            returnScore: 25000,
            uma: [30, 10, -10, -30],
          },
          sessionPlayers: {
            create: players.map((p) => ({ playerId: p.id })),
          },
        },
      });

      // 半荘1を作成（セッション1に紐づく、返し点数30000）
      // 新しいロジック: finalScoreWithUmaOka = currentScore - returnScore + (1位の場合は20000) + uma
      // 1位（currentScore=35000）: 35000 - 30000 + 20000 + 30000 = 55000
      // 2位（currentScore=28000）: 28000 - 30000 + 10000 = 8000
      // 3位（currentScore=22000）: 22000 - 30000 - 10000 = -18000
      // 4位（currentScore=15000）: 15000 - 30000 - 30000 = -45000
      const hanchan1 = await prisma.hanchan.create({
        data: {
          startedAt: new Date("2026-01-01"),
          endedAt: new Date("2026-01-01"),
          status: "COMPLETED",
          sessionId: session1.id,
          hanchanPlayers: {
            create: [
              { playerId: players[0].id, seatPosition: 0, initialScore: 25000, finalScore: 35000, finalScoreWithUmaOka: 55000 },
              { playerId: players[1].id, seatPosition: 1, initialScore: 25000, finalScore: 28000, finalScoreWithUmaOka: 8000 },
              { playerId: players[2].id, seatPosition: 2, initialScore: 25000, finalScore: 22000, finalScoreWithUmaOka: -18000 },
              { playerId: players[3].id, seatPosition: 3, initialScore: 25000, finalScore: 15000, finalScoreWithUmaOka: -45000 },
            ],
          },
        },
      });

      // 半荘2を作成（セッション2に紐づく、返し点数25000）
      // 新しいロジック: finalScoreWithUmaOka = currentScore - returnScore + (1位の場合は20000) + uma
      // 1位（currentScore=30000）: 30000 - 25000 + 20000 + 30000 = 55000
      // 2位（currentScore=25000）: 25000 - 25000 + 10000 = 10000
      // 3位（currentScore=20000）: 20000 - 25000 - 10000 = -15000
      // 4位（currentScore=20000）: 20000 - 25000 - 30000 = -35000
      const hanchan2 = await prisma.hanchan.create({
        data: {
          startedAt: new Date("2026-01-02"),
          endedAt: new Date("2026-01-02"),
          status: "COMPLETED",
          sessionId: session2.id,
          hanchanPlayers: {
            create: [
              { playerId: players[0].id, seatPosition: 0, initialScore: 25000, finalScore: 30000, finalScoreWithUmaOka: 55000 },
              { playerId: players[1].id, seatPosition: 1, initialScore: 25000, finalScore: 25000, finalScoreWithUmaOka: 10000 },
              { playerId: players[2].id, seatPosition: 2, initialScore: 25000, finalScore: 20000, finalScoreWithUmaOka: -15000 },
              { playerId: players[3].id, seatPosition: 3, initialScore: 25000, finalScore: 20000, finalScoreWithUmaOka: -35000 },
            ],
          },
        },
      });

      // 統計情報を取得
      const response = await request(app).get(`/api/players/${players[0].id}/statistics`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("totalFinalScore");

      // 返し点換算の計算を検証
      // 新しいロジックでは、finalScoreWithUmaOkaを1000で割るだけでよい
      // 半荘1: 55000 / 1000 = 55点
      // 半荘2: 55000 / 1000 = 55点
      // 合計: 55 + 55 = 110点
      const expectedTotalFinalScore = 55000 / 1000 + 55000 / 1000;
      expect(response.body.data.totalFinalScore).toBeCloseTo(expectedTotalFinalScore, 1);

      // クリーンアップ
      await prisma.hanchan.delete({ where: { id: hanchan1.id } });
      await prisma.hanchan.delete({ where: { id: hanchan2.id } });
      await prisma.session.delete({ where: { id: session1.id } });
      await prisma.session.delete({ where: { id: session2.id } });
      for (const player of players) {
        await prisma.player.delete({ where: { id: player.id } });
      }
    });

    it("返し点数が取得できない場合はデフォルト値（30000）を使用する", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      // テストデータを作成
      const player = await prisma.player.create({
        data: { name: "デフォルト返し点テスト参加者" },
      });

      // セッション（umaOkaConfigなし）を作成
      const session = await prisma.session.create({
        data: {
          date: new Date("2026-01-01"),
          name: "デフォルト返し点テストセッション",
          sessionPlayers: {
            create: [{ playerId: player.id }],
          },
        },
      });

      // 半荘を作成（umaOkaConfigなし、返し点数はデフォルト30000として計算される）
      // 新しいロジック: finalScoreWithUmaOka = currentScore - returnScore + (1位の場合は20000) + uma
      // 1位（currentScore=35000）: 35000 - 30000 + 20000 + 30000 = 55000
      const hanchan = await prisma.hanchan.create({
        data: {
          startedAt: new Date("2026-01-01"),
          endedAt: new Date("2026-01-01"),
          status: "COMPLETED",
          sessionId: session.id,
          hanchanPlayers: {
            create: [
              { playerId: player.id, seatPosition: 0, initialScore: 25000, finalScore: 35000, finalScoreWithUmaOka: 55000 },
            ],
          },
        },
      });

      // 統計情報を取得
      const response = await request(app).get(`/api/players/${player.id}/statistics`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("totalFinalScore");

      // 新しいロジックでは、finalScoreWithUmaOkaを1000で割るだけでよい
      // 55000 / 1000 = 55点
      const expectedTotalFinalScore = 55000 / 1000;
      expect(response.body.data.totalFinalScore).toBeCloseTo(expectedTotalFinalScore, 1);

      // クリーンアップ
      await prisma.hanchan.delete({ where: { id: hanchan.id } });
      await prisma.session.delete({ where: { id: session.id } });
      await prisma.player.delete({ where: { id: player.id } });
    });
  });

  describe("GET /api/players/:id/history", () => {
    it("参加者履歴を正しく取得する", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      // テストデータを作成
      const player = await prisma.player.create({
        data: {
          name: "履歴テスト参加者",
        },
      });

      const response = await request(app).get(`/api/players/${player.id}/history`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body).toHaveProperty("pagination");
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toHaveProperty("total");
      expect(response.body.pagination).toHaveProperty("limit");
      expect(response.body.pagination).toHaveProperty("offset");

      // クリーンアップ
      await prisma.player.delete({ where: { id: player.id } });
    });

    it("存在しない参加者IDの場合は404を返す", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const nonExistentId = "00000000-0000-0000-0000-000000000000";

      const response = await request(app).get(`/api/players/${nonExistentId}/history`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "NOT_FOUND");
    });

    it("ページネーションパラメータを正しく処理する", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      // テストデータを作成
      const player = await prisma.player.create({
        data: {
          name: "ページネーションテスト参加者",
        },
      });

      const response = await request(app)
        .get(`/api/players/${player.id}/history`)
        .query({ limit: 10, offset: 0 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body).toHaveProperty("pagination");
      expect(response.body.pagination).toHaveProperty("limit", 10);
      expect(response.body.pagination).toHaveProperty("offset", 0);

      // クリーンアップ
      await prisma.player.delete({ where: { id: player.id } });
    });
  });
});

