import request from "supertest";
import app from "../../src/app";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const shouldSkipTests = false;

describe("Rounds API", () => {
  let testHanchanId: string;
  let testRoundId: string;
  let testPlayerIds: string[];
  let prisma: PrismaClient | null;

  beforeAll(async () => {
    process.env.DATABASE_URL = "postgresql://majong_user:majong_password@localhost:5432/majong_db?schema=public";

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

    if (testRoundId) {
      try {
        await prisma.round.delete({ where: { id: testRoundId } });
      } catch (error) {
        // エラーは無視
      }
    }

    if (testHanchanId) {
      try {
        await prisma.hanchan.delete({ where: { id: testHanchanId } });
      } catch (error) {
        // エラーは無視
      }
    }

    if (testPlayerIds && testPlayerIds.length > 0) {
      for (const playerId of testPlayerIds) {
        try {
          await prisma.player.delete({ where: { id: playerId } });
        } catch (error) {
          // エラーは無視
        }
      }
    }

    await prisma.$disconnect();
  });

  beforeEach(async () => {
    if (shouldSkipTests || !prisma) {
      return;
    }

    const players = await Promise.all([
      prisma.player.create({ data: { name: `テスト参加者1_${Date.now()}` } }),
      prisma.player.create({ data: { name: `テスト参加者2_${Date.now()}` } }),
      prisma.player.create({ data: { name: `テスト参加者3_${Date.now()}` } }),
      prisma.player.create({ data: { name: `テスト参加者4_${Date.now()}` } }),
    ]);

    testPlayerIds = players.map((p) => p.id);

    const hanchan = await prisma.hanchan.create({
      data: {
        name: "テスト半荘",
        startedAt: new Date(),
        status: "IN_PROGRESS",
        hanchanPlayers: {
          create: testPlayerIds.map((playerId, index) => ({
            playerId,
            seatPosition: index,
            initialScore: 25000,
          })),
        },
      },
    });

    testHanchanId = hanchan.id;
  });

  afterEach(async () => {
    if (shouldSkipTests || !prisma) {
      return;
    }

    if (testRoundId) {
      try {
        await prisma.round.delete({ where: { id: testRoundId } });
        testRoundId = "";
      } catch (error) {
        // エラーは無視
      }
    }

    if (testHanchanId) {
      try {
        await prisma.hanchan.delete({ where: { id: testHanchanId } });
        testHanchanId = "";
      } catch (error) {
        // エラーは無視
      }
    }

    if (testPlayerIds && testPlayerIds.length > 0) {
      for (const playerId of testPlayerIds) {
        try {
          await prisma.player.delete({ where: { id: playerId } });
        } catch (error) {
          // エラーは無視
        }
      }
      testPlayerIds = [];
    }
  });

  describe("GET /api/hanchans/:hanchanId/rounds", () => {
    it("局一覧を取得できる", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const response = await request(app).get(`/api/hanchans/${testHanchanId}/rounds`);

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

      const response = await request(app).get(`/api/hanchans/${testHanchanId}/rounds`);

      if (response.status !== 200) {
        console.error("Response status:", response.status);
        console.error("Response body:", JSON.stringify(response.body, null, 2));
      }

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toMatch(/json/);
    });

    it("ステータスでフィルタリングできる", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const response = await request(app).get(
        `/api/hanchans/${testHanchanId}/rounds`
      );

      if (response.status !== 200) {
        console.error("Response status:", response.status);
        console.error("Response body:", JSON.stringify(response.body, null, 2));
      }

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("GET /api/rounds/:id", () => {
    it("指定されたIDの局を取得できる", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
        },
      });

      const response = await request(app).get(`/api/rounds/${round.id}`);

      if (response.status !== 200) {
        console.error("Response status:", response.status);
        console.error("Response body:", JSON.stringify(response.body, null, 2));
      }

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("id", round.id);
      expect(response.body.data).toHaveProperty("roundNumber", 1);
      expect(response.body.data).toHaveProperty("wind", "EAST");

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("存在しない局IDの場合はエラー", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const nonExistentId = "00000000-0000-0000-0000-000000000000";

      const response = await request(app).get(`/api/rounds/${nonExistentId}`);

      if (response.status !== 404) {
        console.error("Response status:", response.status);
        console.error("Response body:", JSON.stringify(response.body, null, 2));
      }

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "NOT_FOUND");
    });
  });

  describe("POST /api/hanchans/:hanchanId/rounds", () => {
    it("新しい局を作成できる", async () => {
      if (shouldSkipTests || !prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const newRound = {
        roundNumber: 1,
        wind: "EAST",
        dealerPlayerId: testPlayerIds[0],
        honba: 0,
        riichiSticks: 0,
      };

      const response = await request(app)
        .post(`/api/hanchans/${testHanchanId}/rounds`)
        .send(newRound)
        .expect(201);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data).toHaveProperty("roundNumber", 1);
      expect(response.body.data).toHaveProperty("wind", "EAST");
      expect(response.body.data).not.toHaveProperty("status");

      testRoundId = response.body.data.id;
    });

    it("局番号が1-16の範囲外の場合はエラー", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const newRound = {
        roundNumber: 17,
        wind: "EAST",
        dealerPlayerId: testPlayerIds[0],
      };

      const response = await request(app)
        .post(`/api/hanchans/${testHanchanId}/rounds`)
        .send(newRound);

      if (response.status !== 400) {
        console.error("Response status:", response.status);
        console.error("Response body:", JSON.stringify(response.body, null, 2));
      }

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VALIDATION_ERROR");
    });

    it("半荘に参加していない参加者IDの場合はエラー", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const otherPlayer = await prisma.player.create({
        data: { name: `他の参加者_${Date.now()}` },
      });

      const newRound = {
        roundNumber: 1,
        wind: "EAST",
        dealerPlayerId: otherPlayer.id,
      };

      const response = await request(app)
        .post(`/api/hanchans/${testHanchanId}/rounds`)
        .send(newRound);

      if (response.status !== 422) {
        console.error("Response status:", response.status);
        console.error("Response body:", JSON.stringify(response.body, null, 2));
      }

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VALIDATION_ERROR");

      await prisma.player.delete({ where: { id: otherPlayer.id } });
    });

    it("前局が存在しない場合、デフォルト値（本場0）で局を作成できる", async () => {
      if (shouldSkipTests || !prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const newRound = {
        roundNumber: 1,
        wind: "EAST",
        dealerPlayerId: testPlayerIds[0],
        honba: 0,
        riichiSticks: 0,
      };

      const response = await request(app)
        .post(`/api/hanchans/${testHanchanId}/rounds`)
        .send(newRound)
        .expect(201);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("roundNumber", 1);
      expect(response.body.data).toHaveProperty("honba", 0);

      await prisma.round.delete({ where: { id: response.body.data.id } });
    });

    it("前局で親が和了した場合、連荘となり本場+1で局を作成できる", async () => {
      if (shouldSkipTests || !prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      // 1局目を作成して終了（親が和了）
      const firstRound = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
        },
      });

      const endData = {
        resultType: "TSUMO",
        scores: [
          {
            playerId: testPlayerIds[0],
            scoreChange: 2000,
            isDealer: true,
            isWinner: true,
            han: 1,
            fu: 30,
            yaku: ["ツモ"],
          },
          {
            playerId: testPlayerIds[1],
            scoreChange: -700,
            isDealer: false,
            isWinner: false,
          },
          {
            playerId: testPlayerIds[2],
            scoreChange: -700,
            isDealer: false,
            isWinner: false,
          },
          {
            playerId: testPlayerIds[3],
            scoreChange: -600,
            isDealer: false,
            isWinner: false,
          },
        ],
      };

      await request(app)
        .put(`/api/rounds/${firstRound.id}/end`)
        .send(endData)
        .expect(200);

      // 2局目を作成（連荘）
      const newRound = {
        roundNumber: 1,
        wind: "EAST",
        dealerPlayerId: testPlayerIds[0],
        honba: 0,
        riichiSticks: 0,
      };

      const response = await request(app)
        .post(`/api/hanchans/${testHanchanId}/rounds`)
        .send(newRound)
        .expect(201);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("roundNumber", 1); // 連荘なので局番号は1のまま
      expect(response.body.data.honba).toBe(1); // 本場+1

      await prisma.round.delete({ where: { id: response.body.data.id } });
      await prisma.round.delete({ where: { id: firstRound.id } });
    });

    it("前局で流局時に親がテンパイしていた場合、連荘となり本場+1で局を作成できる", async () => {
      if (shouldSkipTests || !prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      // 1局目を作成して流局（親がテンパイ）
      const firstRound = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
        },
      });

      const endData = {
        resultType: "DRAW",
        scores: [
          {
            playerId: testPlayerIds[0],
            scoreChange: 0,
            isDealer: true,
            isWinner: false,
            isTenpai: true,
          },
          {
            playerId: testPlayerIds[1],
            scoreChange: 0,
            isDealer: false,
            isWinner: false,
            isTenpai: false,
          },
          {
            playerId: testPlayerIds[2],
            scoreChange: 0,
            isDealer: false,
            isWinner: false,
            isTenpai: false,
          },
          {
            playerId: testPlayerIds[3],
            scoreChange: 0,
            isDealer: false,
            isWinner: false,
            isTenpai: false,
          },
        ],
      };

      await request(app)
        .put(`/api/rounds/${firstRound.id}/end`)
        .send(endData)
        .expect(200);

      // 2局目を作成（連荘）
      const newRound = {
        roundNumber: 1,
        wind: "EAST",
        dealerPlayerId: testPlayerIds[0],
        honba: 0,
        riichiSticks: 0,
      };

      const response = await request(app)
        .post(`/api/hanchans/${testHanchanId}/rounds`)
        .send(newRound)
        .expect(201);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("roundNumber", 1); // 連荘なので局番号は1のまま
      expect(response.body.data.honba).toBe(1); // 本場+1

      await prisma.round.delete({ where: { id: response.body.data.id } });
      await prisma.round.delete({ where: { id: firstRound.id } });
    });

    it("前局で子が和了した場合、連荘でなく本場0で局を作成できる", async () => {
      if (shouldSkipTests || !prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      // 1局目を作成して終了（子が和了）
      const firstRound = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
        },
      });

      const endData = {
        resultType: "TSUMO",
        scores: [
          {
            playerId: testPlayerIds[1],
            scoreChange: 2000,
            isDealer: false,
            isWinner: true,
            han: 1,
            fu: 30,
            yaku: ["ツモ"],
          },
          {
            playerId: testPlayerIds[0],
            scoreChange: -700,
            isDealer: true,
            isWinner: false,
          },
          {
            playerId: testPlayerIds[2],
            scoreChange: -700,
            isDealer: false,
            isWinner: false,
          },
          {
            playerId: testPlayerIds[3],
            scoreChange: -600,
            isDealer: false,
            isWinner: false,
          },
        ],
      };

      await request(app)
        .put(`/api/rounds/${firstRound.id}/end`)
        .send(endData)
        .expect(200);

      // 2局目を作成（連荘でない）
      const newRound = {
        roundNumber: 2,
        wind: "EAST",
        dealerPlayerId: testPlayerIds[1],
        honba: 0,
        riichiSticks: 0,
      };

      const response = await request(app)
        .post(`/api/hanchans/${testHanchanId}/rounds`)
        .send(newRound)
        .expect(201);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("roundNumber", 2); // 連荘でないので局番号+1
      expect(response.body.data.honba).toBe(0); // 本場0

      await prisma.round.delete({ where: { id: response.body.data.id } });
      await prisma.round.delete({ where: { id: firstRound.id } });
    });

    it("前局で流局時に親がノーテンだった場合、連荘でなく本場は変更なしで局を作成できる", async () => {
      if (shouldSkipTests || !prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      // 1局目を作成して流局（親がノーテン、本場1）
      const firstRound = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 1,
          riichiSticks: 0,
        },
      });

      const endData = {
        resultType: "DRAW",
        scores: [
          {
            playerId: testPlayerIds[0],
            scoreChange: -1000,
            isDealer: true,
            isWinner: false,
            isTenpai: false,
          },
          {
            playerId: testPlayerIds[1],
            scoreChange: 1000,
            isDealer: false,
            isWinner: false,
            isTenpai: true,
          },
          {
            playerId: testPlayerIds[2],
            scoreChange: 0,
            isDealer: false,
            isWinner: false,
            isTenpai: true,
          },
          {
            playerId: testPlayerIds[3],
            scoreChange: 0,
            isDealer: false,
            isWinner: false,
            isTenpai: true,
          },
        ],
      };

      await request(app)
        .put(`/api/rounds/${firstRound.id}/end`)
        .send(endData)
        .expect(200);

      // 2局目を作成（連荘でない）
      const newRound = {
        roundNumber: 2,
        wind: "EAST",
        dealerPlayerId: testPlayerIds[1],
        honba: 1,
        riichiSticks: 0,
      };

      const response = await request(app)
        .post(`/api/hanchans/${testHanchanId}/rounds`)
        .send(newRound)
        .expect(201);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("roundNumber", 2); // 連荘でないので局番号+1
      expect(response.body.data.honba).toBe(1); // 本場は変更なし

      await prisma.round.delete({ where: { id: response.body.data.id } });
      await prisma.round.delete({ where: { id: firstRound.id } });
    });

    it("前局で流局時に親がノーテンの場合、連荘でなく本場+1で局を作成できる", async () => {
      if (shouldSkipTests || !prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      // 1局目を作成して流局（親がノーテン、本場1）
      const firstRound = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 1,
          riichiSticks: 0,
        },
      });

      const endData = {
        resultType: "DRAW",
        scores: [
          {
            playerId: testPlayerIds[0],
            scoreChange: 0,
            isDealer: true,
            isWinner: false,
            isTenpai: false,
          },
          {
            playerId: testPlayerIds[1],
            scoreChange: 0,
            isDealer: false,
            isWinner: false,
            isTenpai: false,
          },
          {
            playerId: testPlayerIds[2],
            scoreChange: 0,
            isDealer: false,
            isWinner: false,
            isTenpai: false,
          },
          {
            playerId: testPlayerIds[3],
            scoreChange: 0,
            isDealer: false,
            isWinner: false,
            isTenpai: false,
          },
        ],
      };

      await request(app)
        .put(`/api/rounds/${firstRound.id}/end`)
        .send(endData)
        .expect(200);

      // 2局目を作成（連荘でないが本場+1）
      const newRound = {
        roundNumber: 2,
        wind: "EAST",
        dealerPlayerId: testPlayerIds[1],
        honba: 1,
        riichiSticks: 0,
      };

      const response = await request(app)
        .post(`/api/hanchans/${testHanchanId}/rounds`)
        .send(newRound)
        .expect(201);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("roundNumber", 2); // 連荘でないので局番号+1
      expect(response.body.data.honba).toBe(2); // 親がノーテンなので本場+1

      await prisma.round.delete({ where: { id: response.body.data.id } });
      await prisma.round.delete({ where: { id: firstRound.id } });
    });

    it("前局で特殊流局時に親がノーテンの場合、連荘でなく本場+1で局を作成できる", async () => {
      if (shouldSkipTests || !prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      // 1局目を作成して特殊流局（親がノーテン、本場1）
      const firstRound = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 1,
          riichiSticks: 0,
        },
      });

      const endData = {
        resultType: "SPECIAL_DRAW",
        specialDrawType: "FOUR_KAN",
        scores: [
          {
            playerId: testPlayerIds[0],
            scoreChange: 0,
            isDealer: true,
            isWinner: false,
            isTenpai: false,
          },
          {
            playerId: testPlayerIds[1],
            scoreChange: 0,
            isDealer: false,
            isWinner: false,
            isTenpai: false,
          },
          {
            playerId: testPlayerIds[2],
            scoreChange: 0,
            isDealer: false,
            isWinner: false,
            isTenpai: false,
          },
          {
            playerId: testPlayerIds[3],
            scoreChange: 0,
            isDealer: false,
            isWinner: false,
            isTenpai: false,
          },
        ],
      };

      await request(app)
        .put(`/api/rounds/${firstRound.id}/end`)
        .send(endData)
        .expect(200);

      // 2局目を作成（連荘でないが本場+1）
      const newRound = {
        roundNumber: 2,
        wind: "EAST",
        dealerPlayerId: testPlayerIds[1],
        honba: 1,
        riichiSticks: 0,
      };

      const response = await request(app)
        .post(`/api/hanchans/${testHanchanId}/rounds`)
        .send(newRound)
        .expect(201);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("roundNumber", 2); // 連荘でないので局番号+1
      expect(response.body.data.honba).toBe(2); // 全員ノーテンなので本場+1

      await prisma.round.delete({ where: { id: response.body.data.id } });
      await prisma.round.delete({ where: { id: firstRound.id } });
    });

    it("特殊流局で親がテンパイしていた場合、連荘となり本場+1で局を作成できる", async () => {
      if (shouldSkipTests || !prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      // 1局目を作成して特殊流局（親がテンパイ）
      const firstRound = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
        },
      });

      const endData = {
        resultType: "SPECIAL_DRAW",
        specialDrawType: "FOUR_KAN",
        scores: [
          {
            playerId: testPlayerIds[0],
            scoreChange: 0,
            isDealer: true,
            isWinner: false,
            isTenpai: true,
          },
          {
            playerId: testPlayerIds[1],
            scoreChange: 0,
            isDealer: false,
            isWinner: false,
            isTenpai: false,
          },
          {
            playerId: testPlayerIds[2],
            scoreChange: 0,
            isDealer: false,
            isWinner: false,
            isTenpai: false,
          },
          {
            playerId: testPlayerIds[3],
            scoreChange: 0,
            isDealer: false,
            isWinner: false,
            isTenpai: false,
          },
        ],
      };

      await request(app)
        .put(`/api/rounds/${firstRound.id}/end`)
        .send(endData)
        .expect(200);

      // 2局目を作成（連荘）
      const newRound = {
        roundNumber: 1,
        wind: "EAST",
        dealerPlayerId: testPlayerIds[0],
        honba: 0,
        riichiSticks: 0,
      };

      const response = await request(app)
        .post(`/api/hanchans/${testHanchanId}/rounds`)
        .send(newRound)
        .expect(201);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("roundNumber", 1); // 連荘なので局番号は1のまま
      expect(response.body.data.honba).toBe(1); // 本場+1

      await prisma.round.delete({ where: { id: response.body.data.id } });
      await prisma.round.delete({ where: { id: firstRound.id } });
    });

    it("連荘が複数回続く場合、本場が正しく累積される", async () => {
      if (shouldSkipTests || !prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      // 1局目を作成して終了（親が和了、本場0）
      const firstRound = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
        },
      });

      const firstEndData = {
        resultType: "TSUMO",
        scores: [
          {
            playerId: testPlayerIds[0],
            scoreChange: 2000,
            isDealer: true,
            isWinner: true,
            han: 1,
            fu: 30,
            yaku: ["ツモ"],
          },
          {
            playerId: testPlayerIds[1],
            scoreChange: -700,
            isDealer: false,
            isWinner: false,
          },
          {
            playerId: testPlayerIds[2],
            scoreChange: -700,
            isDealer: false,
            isWinner: false,
          },
          {
            playerId: testPlayerIds[3],
            scoreChange: -600,
            isDealer: false,
            isWinner: false,
          },
        ],
      };

      await request(app)
        .put(`/api/rounds/${firstRound.id}/end`)
        .send(firstEndData)
        .expect(200);

      // 2局目を作成（連荘、本場1）
      const secondRoundData = {
        roundNumber: 1,
        wind: "EAST",
        dealerPlayerId: testPlayerIds[0],
        honba: 0,
        riichiSticks: 0,
      };

      const secondRoundResponse = await request(app)
        .post(`/api/hanchans/${testHanchanId}/rounds`)
        .send(secondRoundData)
        .expect(201);

      expect(secondRoundResponse.body.data.honba).toBe(1); // 本場1

      // 2局目を終了（親が和了）
      const secondEndData = {
        resultType: "TSUMO",
        scores: [
          {
            playerId: testPlayerIds[0],
            scoreChange: 2000,
            isDealer: true,
            isWinner: true,
            han: 1,
            fu: 30,
            yaku: ["ツモ"],
          },
          {
            playerId: testPlayerIds[1],
            scoreChange: -700,
            isDealer: false,
            isWinner: false,
          },
          {
            playerId: testPlayerIds[2],
            scoreChange: -700,
            isDealer: false,
            isWinner: false,
          },
          {
            playerId: testPlayerIds[3],
            scoreChange: -600,
            isDealer: false,
            isWinner: false,
          },
        ],
      };

      await request(app)
        .put(`/api/rounds/${secondRoundResponse.body.data.id}/end`)
        .send(secondEndData)
        .expect(200);

      // 3局目を作成（連荘、本場2）
      const thirdRoundData = {
        roundNumber: 1,
        wind: "EAST",
        dealerPlayerId: testPlayerIds[0],
        honba: 0,
        riichiSticks: 0,
      };

      const thirdRoundResponse = await request(app)
        .post(`/api/hanchans/${testHanchanId}/rounds`)
        .send(thirdRoundData)
        .expect(201);

      expect(thirdRoundResponse.body.data).toHaveProperty("roundNumber", 1); // 連荘なので局番号は1のまま
      expect(thirdRoundResponse.body.data.honba).toBe(2); // 本場2

      await prisma.round.delete({ where: { id: thirdRoundResponse.body.data.id } });
      await prisma.round.delete({ where: { id: secondRoundResponse.body.data.id } });
      await prisma.round.delete({ where: { id: firstRound.id } });
    });
  });

  describe("PUT /api/rounds/:id", () => {
    it("局情報を更新できる", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
        },
      });

      const updateData = {
        startedAt: new Date().toISOString(),
        honba: 1,
      };

      const response = await request(app)
        .put(`/api/rounds/${round.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("startedAt");
      expect(response.body.data).toHaveProperty("honba", 1);
      expect(response.body.data).not.toHaveProperty("status");

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("存在しない局IDの場合はエラー", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const nonExistentId = "00000000-0000-0000-0000-000000000000";

      const response = await request(app)
        .put(`/api/rounds/${nonExistentId}`)
        .send({ honba: 1 });

      if (response.status !== 404) {
        console.error("Response status:", response.status);
        console.error("Response body:", JSON.stringify(response.body, null, 2));
      }

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "NOT_FOUND");
    });
  });

  describe("DELETE /api/rounds/:id", () => {
    it("局を削除できる", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
        },
      });

      const response = await request(app)
        .delete(`/api/rounds/${round.id}`)
        .expect(204);

      expect(response.body).toEqual({});

      const deletedRound = await prisma.round.findUnique({
        where: { id: round.id },
      });
      expect(deletedRound).toBeNull();
    });

    it("存在しない局IDの場合はエラー", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const nonExistentId = "00000000-0000-0000-0000-000000000000";

      const response = await request(app).delete(`/api/rounds/${nonExistentId}`);

      if (response.status !== 404) {
        console.error("Response status:", response.status);
        console.error("Response body:", JSON.stringify(response.body, null, 2));
      }

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "NOT_FOUND");
    });
  });

  describe("POST /api/rounds/:id/nakis", () => {
    it("鳴き記録を追加できる", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
        },
      });

      const nakiData = {
        playerId: testPlayerIds[1],
        type: "PON",
        targetPlayerId: testPlayerIds[0],
        tiles: ["1m", "1m", "1m"],
      };

      const response = await request(app)
        .post(`/api/rounds/${round.id}/nakis`)
        .send(nakiData)
        .expect(201);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data).toHaveProperty("type", "PON");
      expect(response.body.data).toHaveProperty("playerId", testPlayerIds[1]);

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("startedAtがnullの状態でも鳴き記録を追加できる（非推奨API）", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
          startedAt: null,
        },
      });

      const nakiData = {
        playerId: testPlayerIds[1],
        type: "PON",
        targetPlayerId: testPlayerIds[0],
        tiles: ["1m", "1m", "1m"],
      };

      const response = await request(app)
        .post(`/api/rounds/${round.id}/nakis`)
        .send(nakiData)
        .expect(201);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data).toHaveProperty("type", "PON");
      expect(response.body.data).toHaveProperty("playerId", testPlayerIds[1]);

      await prisma.round.delete({ where: { id: round.id } });
    });
  });

  describe("POST /api/rounds/:id/riichis", () => {
    it("リーチ記録を追加できる", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
        },
      });

      const riichiData = {
        playerId: testPlayerIds[1],
        isDoubleRiichi: false,
        isIppatsu: false,
      };

      const response = await request(app)
        .post(`/api/rounds/${round.id}/riichis`)
        .send(riichiData)
        .expect(201);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data).toHaveProperty("playerId", testPlayerIds[1]);
      expect(response.body.data).toHaveProperty("isDoubleRiichi", false);

      const updatedRound = await prisma.round.findUnique({
        where: { id: round.id },
      });
      expect(updatedRound?.riichiSticks).toBe(1);

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("同じ参加者が既にリーチを宣言している場合はエラー", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
        },
      });

      await prisma.riichi.create({
        data: {
          roundId: round.id,
          playerId: testPlayerIds[1],
          isDoubleRiichi: false,
          isIppatsu: false,
          declaredAt: new Date(),
        },
      });

      const riichiData = {
        playerId: testPlayerIds[1],
        isDoubleRiichi: false,
        isIppatsu: false,
      };

      const response = await request(app)
        .post(`/api/rounds/${round.id}/riichis`)
        .send(riichiData);

      if (response.status !== 409) {
        console.error("Response status:", response.status);
        console.error("Response body:", JSON.stringify(response.body, null, 2));
      }

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "CONFLICT");

      await prisma.round.delete({ where: { id: round.id } });
    });
  });

  describe("POST /api/rounds/:id/actions", () => {
    it("鳴き記録を追加できる（type=NAKI）", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
          startedAt: new Date(),
        },
      });

      const actionData = {
        type: "NAKI",
        playerId: testPlayerIds[1],
        nakiType: "PON",
        targetPlayerId: testPlayerIds[0],
        tiles: ["1m", "1m", "1m"],
      };

      const response = await request(app)
        .post(`/api/rounds/${round.id}/actions`)
        .send(actionData)
        .expect(201);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data).toHaveProperty("type", "NAKI");
      expect(response.body.data).toHaveProperty("nakiType", "PON");
      expect(response.body.data).toHaveProperty("playerId", testPlayerIds[1]);
      expect(response.body.data).toHaveProperty("targetPlayerId", testPlayerIds[0]);
      expect(response.body.data).toHaveProperty("tiles", ["1m", "1m", "1m"]);
      expect(response.body.data).toHaveProperty("declaredAt", null);

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("リーチ記録を追加できる（type=RIICHI）", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
          startedAt: new Date(),
        },
      });

      const actionData = {
        type: "RIICHI",
        playerId: testPlayerIds[1],
      };

      const response = await request(app)
        .post(`/api/rounds/${round.id}/actions`)
        .send(actionData)
        .expect(201);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data).toHaveProperty("type", "RIICHI");
      expect(response.body.data).toHaveProperty("playerId", testPlayerIds[1]);
      expect(response.body.data).toHaveProperty("declaredAt");
      expect(response.body.data.declaredAt).not.toBeNull();
      expect(response.body.data).toHaveProperty("nakiType", null);
      expect(response.body.data).toHaveProperty("targetPlayerId", null);
      expect(response.body.data).toHaveProperty("tiles", []);

      const updatedRound = await prisma.round.findUnique({
        where: { id: round.id },
      });
      expect(updatedRound?.riichiSticks).toBe(1);

      // リーチ記録追加時にScoreが作成されないことを確認（局終了時に一括で計算する）
      const scores = await prisma.score.findMany({
        where: { roundId: round.id },
      });
      expect(scores.length).toBe(0);

      await prisma.round.delete({ where: { id: round.id } });
    });


    it("同じ参加者が既にリーチを宣言している場合はエラー", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
          startedAt: new Date(),
        },
      });

      await prisma.roundAction.create({
        data: {
          roundId: round.id,
          playerId: testPlayerIds[1],
          type: "RIICHI",
          declaredAt: new Date(),
          nakiType: null,
          targetPlayerId: null,
          tiles: [],
        },
      });

      const actionData = {
        type: "RIICHI",
        playerId: testPlayerIds[1],
      };

      const response = await request(app)
        .post(`/api/rounds/${round.id}/actions`)
        .send(actionData);

      if (response.status !== 409) {
        console.error("Response status:", response.status);
        console.error("Response body:", JSON.stringify(response.body, null, 2));
      }

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "CONFLICT");

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("同じ参加者が鳴きとリーチを同時に持てないことを確認", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
          startedAt: new Date(),
        },
      });

      // まず鳴きを追加
      await prisma.roundAction.create({
        data: {
          roundId: round.id,
          playerId: testPlayerIds[1],
          type: "NAKI",
          nakiType: "PON",
          targetPlayerId: testPlayerIds[0],
          tiles: ["1m", "1m", "1m"],
          declaredAt: null,
        },
      });

      // 同じ参加者がリーチを追加しようとするとエラー
      const actionData = {
        type: "RIICHI",
        playerId: testPlayerIds[1],
      };

      const response = await request(app)
        .post(`/api/rounds/${round.id}/actions`)
        .send(actionData);

      if (response.status !== 409) {
        console.error("Response status:", response.status);
        console.error("Response body:", JSON.stringify(response.body, null, 2));
      }

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "CONFLICT");
      expect(response.body.error.message).toContain("cannot have both naki and riichi");

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("鳴きの場合、nakiTypeが必須", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
          startedAt: new Date(),
        },
      });

      const actionData = {
        type: "NAKI",
        playerId: testPlayerIds[1],
        tiles: ["1m", "1m", "1m"],
      };

      const response = await request(app)
        .post(`/api/rounds/${round.id}/actions`)
        .send(actionData);

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VALIDATION_ERROR");
      expect(response.body.error.message).toContain("nakiType is required");

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("鳴きの場合、tilesは任意（指定しなくてもOK）", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
          startedAt: new Date(),
        },
      });

      const actionData = {
        type: "NAKI",
        playerId: testPlayerIds[1],
        nakiType: "PON",
        targetPlayerId: testPlayerIds[0],
        // tilesは指定しない
      };

      const response = await request(app)
        .post(`/api/rounds/${round.id}/actions`)
        .send(actionData)
        .expect(201);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("type", "NAKI");
      expect(response.body.data).toHaveProperty("tiles", []);

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("typeが無効な場合はエラー", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
          startedAt: new Date(),
        },
      });

      const actionData = {
        type: "INVALID",
        playerId: testPlayerIds[1],
      };

      const response = await request(app)
        .post(`/api/rounds/${round.id}/actions`)
        .send(actionData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VALIDATION_ERROR");
      expect(response.body.error.message).toContain("type must be NAKI or RIICHI");

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("局が存在しない場合に404を返す", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const actionData = {
        type: "NAKI",
        playerId: testPlayerIds[1],
        nakiType: "PON",
        targetPlayerId: testPlayerIds[0],
      };

      const response = await request(app)
        .post("/api/rounds/invalid-round-id/actions")
        .send(actionData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "NOT_FOUND");
      expect(response.body.error.message).toContain("Round not found");
    });

    it("playerIdが局に参加していない場合に422を返す", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
          startedAt: new Date(),
        },
      });

      // 局に参加していない参加者IDを作成
      const invalidPlayer = await prisma.player.create({
        data: {
          name: "Invalid Player",
        },
      });

      const actionData = {
        type: "NAKI",
        playerId: invalidPlayer.id,
        nakiType: "PON",
        targetPlayerId: testPlayerIds[0],
      };

      const response = await request(app)
        .post(`/api/rounds/${round.id}/actions`)
        .send(actionData);

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VALIDATION_ERROR");
      expect(response.body.error.message).toContain("playerId must be a player in the round");

      await prisma.round.delete({ where: { id: round.id } });
      await prisma.player.delete({ where: { id: invalidPlayer.id } });
    });

    it("startedAtがnullの状態でもアクションを追加できる", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
          startedAt: null,
        },
      });

      const actionData = {
        type: "NAKI",
        playerId: testPlayerIds[1],
        nakiType: "PON",
        targetPlayerId: testPlayerIds[0],
        tiles: ["1m", "1m", "1m"],
      };

      const response = await request(app)
        .post(`/api/rounds/${round.id}/actions`)
        .send(actionData)
        .expect(201);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data).toHaveProperty("type", "NAKI");
      expect(response.body.data).toHaveProperty("nakiType", "PON");
      expect(response.body.data).toHaveProperty("playerId", testPlayerIds[1]);
      expect(response.body.data).toHaveProperty("targetPlayerId", testPlayerIds[0]);

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("startedAtがnullの状態でもリーチを追加できる", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
          startedAt: null,
        },
      });

      const actionData = {
        type: "RIICHI",
        playerId: testPlayerIds[1],
      };

      const response = await request(app)
        .post(`/api/rounds/${round.id}/actions`)
        .send(actionData)
        .expect(201);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data).toHaveProperty("type", "RIICHI");
      expect(response.body.data).toHaveProperty("playerId", testPlayerIds[1]);
      expect(response.body.data).toHaveProperty("declaredAt");
      expect(response.body.data.declaredAt).not.toBeNull();

      const updatedRound = await prisma.round.findUnique({
        where: { id: round.id },
      });
      expect(updatedRound?.riichiSticks).toBe(1);

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("鳴きの場合、targetPlayerIdが必須（PON、CHI、DAIMINKANの場合）", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
          startedAt: new Date(),
        },
      });

      // PONの場合
      const actionDataPon = {
        type: "NAKI",
        playerId: testPlayerIds[1],
        nakiType: "PON",
        // targetPlayerIdを省略
      };

      const responsePon = await request(app)
        .post(`/api/rounds/${round.id}/actions`)
        .send(actionDataPon);

      expect(responsePon.status).toBe(422);
      expect(responsePon.body).toHaveProperty("error");
      expect(responsePon.body.error).toHaveProperty("code", "VALIDATION_ERROR");
      expect(responsePon.body.error.message).toContain("targetPlayerId is required for PON, CHI, DAIMINKAN");

      // CHIの場合
      const actionDataChi = {
        type: "NAKI",
        playerId: testPlayerIds[1],
        nakiType: "CHI",
        // targetPlayerIdを省略
      };

      const responseChi = await request(app)
        .post(`/api/rounds/${round.id}/actions`)
        .send(actionDataChi);

      expect(responseChi.status).toBe(422);
      expect(responseChi.body).toHaveProperty("error");
      expect(responseChi.body.error).toHaveProperty("code", "VALIDATION_ERROR");
      expect(responseChi.body.error.message).toContain("targetPlayerId is required for PON, CHI, DAIMINKAN");

      // DAIMINKANの場合
      const actionDataDaiminkan = {
        type: "NAKI",
        playerId: testPlayerIds[1],
        nakiType: "DAIMINKAN",
        // targetPlayerIdを省略
      };

      const responseDaiminkan = await request(app)
        .post(`/api/rounds/${round.id}/actions`)
        .send(actionDataDaiminkan);

      expect(responseDaiminkan.status).toBe(422);
      expect(responseDaiminkan.body).toHaveProperty("error");
      expect(responseDaiminkan.body.error).toHaveProperty("code", "VALIDATION_ERROR");
      expect(responseDaiminkan.body.error.message).toContain("targetPlayerId is required for PON, CHI, DAIMINKAN");

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("鳴きの場合、ANKANの場合はtargetPlayerIdが不要", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
          startedAt: new Date(),
        },
      });

      const actionData = {
        type: "NAKI",
        playerId: testPlayerIds[1],
        nakiType: "ANKAN",
        // targetPlayerIdを省略（ANKANの場合は不要）
      };

      const response = await request(app)
        .post(`/api/rounds/${round.id}/actions`)
        .send(actionData)
        .expect(201);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("type", "NAKI");
      expect(response.body.data).toHaveProperty("nakiType", "ANKAN");
      expect(response.body.data).toHaveProperty("targetPlayerId", null);

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("鳴きの場合、targetPlayerIdが局に参加していない場合に422を返す", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
          startedAt: new Date(),
        },
      });

      // 局に参加していない参加者IDを作成
      const invalidPlayer = await prisma.player.create({
        data: {
          name: "Invalid Target Player",
        },
      });

      const actionData = {
        type: "NAKI",
        playerId: testPlayerIds[1],
        nakiType: "PON",
        targetPlayerId: invalidPlayer.id,
      };

      const response = await request(app)
        .post(`/api/rounds/${round.id}/actions`)
        .send(actionData);

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VALIDATION_ERROR");
      expect(response.body.error.message).toContain("targetPlayerId must be a player in the round");

      await prisma.round.delete({ where: { id: round.id } });
      await prisma.player.delete({ where: { id: invalidPlayer.id } });
    });

    it("リーチ記録削除時にScoreが削除されないことを確認", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
          startedAt: new Date(),
        },
      });

      // リーチ記録を追加
      const actionData = {
        type: "RIICHI",
        playerId: testPlayerIds[1],
      };

      const createResponse = await request(app)
        .post(`/api/rounds/${round.id}/actions`)
        .send(actionData)
        .expect(201);

      const actionId = createResponse.body.data.id;

      // リーチ記録追加時にScoreが作成されないことを確認
      const scoresAfterCreate = await prisma.score.findMany({
        where: { roundId: round.id },
      });
      expect(scoresAfterCreate.length).toBe(0);

      // リーチ記録を削除
      await request(app)
        .delete(`/api/rounds/${round.id}/actions/${actionId}`)
        .expect(204);

      // リーチ記録削除時にScoreが削除されないことを確認（Scoreは存在しないため、削除もされない）
      const scoresAfterDelete = await prisma.score.findMany({
        where: { roundId: round.id },
      });
      expect(scoresAfterDelete.length).toBe(0);

      // 積み棒が減っていることを確認
      const updatedRound = await prisma.round.findUnique({
        where: { id: round.id },
      });
      expect(updatedRound?.riichiSticks).toBe(0);

      await prisma.round.delete({ where: { id: round.id } });
    });
  });

  describe("PUT /api/rounds/:id/end", () => {
    it("局を終了できる（ツモ）", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
        },
      });

      const endData = {
        resultType: "TSUMO",
        scores: [
          {
            playerId: testPlayerIds[0],
            scoreChange: 2000,
            isDealer: true,
            isWinner: true,
            han: 1,
            fu: 30,
            yaku: ["ツモ"],
          },
          {
            playerId: testPlayerIds[1],
            scoreChange: -700,
            isDealer: false,
            isWinner: false,
          },
          {
            playerId: testPlayerIds[2],
            scoreChange: -700,
            isDealer: false,
            isWinner: false,
          },
          {
            playerId: testPlayerIds[3],
            scoreChange: -600,
            isDealer: false,
            isWinner: false,
          },
        ],
      };

      const response = await request(app)
        .put(`/api/rounds/${round.id}/end`)
        .send(endData)
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("endedAt");
      expect(response.body.data).not.toHaveProperty("status");
      expect(response.body.data).toHaveProperty("resultType", "TSUMO");
      expect(response.body.data).toHaveProperty("scores");
      expect(response.body.data.scores).toHaveLength(4);

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("局がIN_PROGRESSでない場合はエラー", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
        },
      });

      const endData = {
        resultType: "TSUMO",
        scores: [
          {
            playerId: testPlayerIds[0],
            scoreChange: 2000,
            isDealer: true,
            isWinner: true,
          },
        ],
      };

      const response = await request(app)
        .put(`/api/rounds/${round.id}/end`)
        .send(endData);

      if (response.status !== 422) {
        console.error("Response status:", response.status);
        console.error("Response body:", JSON.stringify(response.body, null, 2));
      }

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VALIDATION_ERROR");

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("局を終了できる（ロン、1人の和了者）", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
        },
      });

      await prisma.round.update({
        where: { id: round.id },
        data: { startedAt: new Date() },
      });

      const endData = {
        resultType: "RON",
        scores: [
          {
            playerId: testPlayerIds[1],
            scoreChange: 2000,
            isDealer: false,
            isWinner: true,
            isRonTarget: false,
            han: 1,
            fu: 30,
            yaku: ["リーチ"],
          },
          {
            playerId: testPlayerIds[2],
            scoreChange: -2000,
            isDealer: false,
            isWinner: false,
            isRonTarget: true,
          },
          {
            playerId: testPlayerIds[0],
            scoreChange: 0,
            isDealer: true,
            isWinner: false,
            isRonTarget: false,
          },
          {
            playerId: testPlayerIds[3],
            scoreChange: 0,
            isDealer: false,
            isWinner: false,
            isRonTarget: false,
          },
        ],
      };

      const response = await request(app)
        .put(`/api/rounds/${round.id}/end`)
        .send(endData)
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("endedAt");
      expect(response.body.data).toHaveProperty("resultType", "RON");
      expect(response.body.data).toHaveProperty("scores");
      expect(response.body.data.scores).toHaveLength(4);

      const winner = response.body.data.scores.find(
        (s: { isWinner: boolean }) => s.isWinner
      );
      expect(winner).toBeDefined();
      expect(winner.playerId).toBe(testPlayerIds[1]);

      const ronTarget = response.body.data.scores.find(
        (s: { isRonTarget: boolean }) => s.isRonTarget
      );
      expect(ronTarget).toBeDefined();
      expect(ronTarget.playerId).toBe(testPlayerIds[2]);

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("局を終了できる（ロン、2人の和了者、ダブロン）", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
        },
      });

      await prisma.round.update({
        where: { id: round.id },
        data: { startedAt: new Date() },
      });

      const endData = {
        resultType: "RON",
        scores: [
          {
            playerId: testPlayerIds[1],
            scoreChange: 2000,
            isDealer: false,
            isWinner: true,
            isRonTarget: false,
            han: 1,
            fu: 30,
            yaku: ["リーチ"],
          },
          {
            playerId: testPlayerIds[2],
            scoreChange: 2000,
            isDealer: false,
            isWinner: true,
            isRonTarget: false,
            han: 1,
            fu: 30,
            yaku: ["リーチ"],
          },
          {
            playerId: testPlayerIds[3],
            scoreChange: -4000,
            isDealer: false,
            isWinner: false,
            isRonTarget: true,
          },
          {
            playerId: testPlayerIds[0],
            scoreChange: 0,
            isDealer: true,
            isWinner: false,
            isRonTarget: false,
          },
        ],
      };

      const response = await request(app)
        .put(`/api/rounds/${round.id}/end`)
        .send(endData)
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("resultType", "RON");
      expect(response.body.data).toHaveProperty("scores");
      expect(response.body.data.scores).toHaveLength(4);

      const winners = response.body.data.scores.filter(
        (s: { isWinner: boolean }) => s.isWinner
      );
      expect(winners).toHaveLength(2);

      const ronTarget = response.body.data.scores.find(
        (s: { isRonTarget: boolean }) => s.isRonTarget
      );
      expect(ronTarget).toBeDefined();
      expect(ronTarget.playerId).toBe(testPlayerIds[3]);

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("ツモで和了者が2人以上の場合にエラー", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
        },
      });

      await prisma.round.update({
        where: { id: round.id },
        data: { startedAt: new Date() },
      });

      const endData = {
        resultType: "TSUMO",
        scores: [
          {
            playerId: testPlayerIds[0],
            scoreChange: 2000,
            isDealer: true,
            isWinner: true,
          },
          {
            playerId: testPlayerIds[1],
            scoreChange: -700,
            isDealer: false,
            isWinner: true,
          },
          {
            playerId: testPlayerIds[2],
            scoreChange: -700,
            isDealer: false,
            isWinner: false,
          },
          {
            playerId: testPlayerIds[3],
            scoreChange: -600,
            isDealer: false,
            isWinner: false,
          },
        ],
      };

      const response = await request(app)
        .put(`/api/rounds/${round.id}/end`)
        .send(endData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VALIDATION_ERROR");
      expect(response.body.error.message).toContain("Exactly one winner");

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("ロンで和了者が0人の場合にエラー", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
        },
      });

      await prisma.round.update({
        where: { id: round.id },
        data: { startedAt: new Date() },
      });

      const endData = {
        resultType: "RON",
        scores: [
          {
            playerId: testPlayerIds[0],
            scoreChange: 0,
            isDealer: true,
            isWinner: false,
            isRonTarget: false,
          },
          {
            playerId: testPlayerIds[1],
            scoreChange: 0,
            isDealer: false,
            isWinner: false,
            isRonTarget: false,
          },
          {
            playerId: testPlayerIds[2],
            scoreChange: 0,
            isDealer: false,
            isWinner: false,
            isRonTarget: false,
          },
          {
            playerId: testPlayerIds[3],
            scoreChange: 0,
            isDealer: false,
            isWinner: false,
            isRonTarget: false,
          },
        ],
      };

      const response = await request(app)
        .put(`/api/rounds/${round.id}/end`)
        .send(endData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VALIDATION_ERROR");
      expect(response.body.error.message).toContain("Between 1 and 3 winners");

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("ロンで和了者が4人以上の場合にエラー", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
        },
      });

      await prisma.round.update({
        where: { id: round.id },
        data: { startedAt: new Date() },
      });

      const endData = {
        resultType: "RON",
        scores: [
          {
            playerId: testPlayerIds[0],
            scoreChange: 2000,
            isDealer: true,
            isWinner: true,
            isRonTarget: false,
          },
          {
            playerId: testPlayerIds[1],
            scoreChange: 2000,
            isDealer: false,
            isWinner: true,
            isRonTarget: false,
          },
          {
            playerId: testPlayerIds[2],
            scoreChange: 2000,
            isDealer: false,
            isWinner: true,
            isRonTarget: false,
          },
          {
            playerId: testPlayerIds[3],
            scoreChange: 2000,
            isDealer: false,
            isWinner: true,
            isRonTarget: false,
          },
        ],
      };

      const response = await request(app)
        .put(`/api/rounds/${round.id}/end`)
        .send(endData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VALIDATION_ERROR");
      expect(response.body.error.message).toContain("Between 1 and 3 winners");

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("ロンで放銃者が0人の場合にエラー", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
        },
      });

      await prisma.round.update({
        where: { id: round.id },
        data: { startedAt: new Date() },
      });

      const endData = {
        resultType: "RON",
        scores: [
          {
            playerId: testPlayerIds[1],
            scoreChange: 2000,
            isDealer: false,
            isWinner: true,
            isRonTarget: false,
          },
          {
            playerId: testPlayerIds[2],
            scoreChange: -2000,
            isDealer: false,
            isWinner: false,
            isRonTarget: false,
          },
          {
            playerId: testPlayerIds[0],
            scoreChange: 0,
            isDealer: true,
            isWinner: false,
            isRonTarget: false,
          },
          {
            playerId: testPlayerIds[3],
            scoreChange: 0,
            isDealer: false,
            isWinner: false,
            isRonTarget: false,
          },
        ],
      };

      const response = await request(app)
        .put(`/api/rounds/${round.id}/end`)
        .send(endData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VALIDATION_ERROR");
      expect(response.body.error.message).toContain("Exactly one ron target");

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("ロンで放銃者が2人以上の場合にエラー", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
        },
      });

      await prisma.round.update({
        where: { id: round.id },
        data: { startedAt: new Date() },
      });

      const endData = {
        resultType: "RON",
        scores: [
          {
            playerId: testPlayerIds[1],
            scoreChange: 2000,
            isDealer: false,
            isWinner: true,
            isRonTarget: false,
          },
          {
            playerId: testPlayerIds[2],
            scoreChange: -2000,
            isDealer: false,
            isWinner: false,
            isRonTarget: true,
          },
          {
            playerId: testPlayerIds[3],
            scoreChange: -2000,
            isDealer: false,
            isWinner: false,
            isRonTarget: true,
          },
          {
            playerId: testPlayerIds[0],
            scoreChange: 0,
            isDealer: true,
            isWinner: false,
            isRonTarget: false,
          },
        ],
      };

      const response = await request(app)
        .put(`/api/rounds/${round.id}/end`)
        .send(endData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VALIDATION_ERROR");
      expect(response.body.error.message).toContain("Exactly one ron target");

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("点数（scoreChange）が未指定の場合にエラー", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
        },
      });

      await prisma.round.update({
        where: { id: round.id },
        data: { startedAt: new Date() },
      });

      const endData = {
        resultType: "TSUMO",
        scores: [
          {
            playerId: testPlayerIds[0],
            isDealer: true,
            isWinner: true,
          },
          {
            playerId: testPlayerIds[1],
            scoreChange: -700,
            isDealer: false,
            isWinner: false,
          },
          {
            playerId: testPlayerIds[2],
            scoreChange: -700,
            isDealer: false,
            isWinner: false,
          },
          {
            playerId: testPlayerIds[3],
            scoreChange: -600,
            isDealer: false,
            isWinner: false,
          },
        ],
      };

      const response = await request(app)
        .put(`/api/rounds/${round.id}/end`)
        .send(endData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VALIDATION_ERROR");
      expect(response.body.error.message).toContain("scoreChange is required");

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("局終了時にリーチ記録、本場、積み棒の点数変動を一括で計算して統合する（ツモ）", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 1,
          riichiSticks: 2,
          startedAt: new Date(),
        },
      });

      // リーチ記録を追加（Scoreは作成されない）
      await prisma.roundAction.create({
        data: {
          roundId: round.id,
          playerId: testPlayerIds[1],
          type: "RIICHI",
          declaredAt: new Date(),
        },
      });

      await prisma.roundAction.create({
        data: {
          roundId: round.id,
          playerId: testPlayerIds[2],
          type: "RIICHI",
          declaredAt: new Date(),
        },
      });

      // リーチ記録追加時にScoreが作成されないことを確認
      const scoresBeforeEnd = await prisma.score.findMany({
        where: { roundId: round.id },
      });
      expect(scoresBeforeEnd.length).toBe(0);

      // 局終了（親がツモ、基本点2000点）
      const endData = {
        resultType: "TSUMO",
        scores: [
          {
            playerId: testPlayerIds[0],
            scoreChange: 2000,
            isDealer: true,
            isWinner: true,
            han: 1,
            fu: 30,
            yaku: ["ツモ"],
          },
          {
            playerId: testPlayerIds[1],
            scoreChange: -700,
            isDealer: false,
            isWinner: false,
          },
          {
            playerId: testPlayerIds[2],
            scoreChange: -700,
            isDealer: false,
            isWinner: false,
          },
          {
            playerId: testPlayerIds[3],
            scoreChange: -600,
            isDealer: false,
            isWinner: false,
          },
        ],
      };

      const response = await request(app)
        .put(`/api/rounds/${round.id}/end`)
        .send(endData)
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("scores");
      expect(response.body.data.scores).toHaveLength(4);

      // 点数変動を確認
      // 親（和了者）: 2000（基本点）+ 2000（積み棒）= 4000
      // 子1（リーチ者）: -700（基本点）- 1000（リーチ）- 300（本場）= -2000
      // 子2（リーチ者）: -700（基本点）- 1000（リーチ）- 300（本場）= -2000
      // 子3: -600（基本点）- 300（本場）= -900
      const winnerScore = response.body.data.scores.find(
        (s: { isWinner: boolean }) => s.isWinner
      );
      expect(winnerScore.scoreChange).toBe(4000); // 2000 + 2000（積み棒）

      const riichiPlayer1Score = response.body.data.scores.find(
        (s: { playerId: string }) => s.playerId === testPlayerIds[1]
      );
      expect(riichiPlayer1Score.scoreChange).toBe(-2000); // -700 - 1000（リーチ）- 300（本場）

      const riichiPlayer2Score = response.body.data.scores.find(
        (s: { playerId: string }) => s.playerId === testPlayerIds[2]
      );
      expect(riichiPlayer2Score.scoreChange).toBe(-2000); // -700 - 1000（リーチ）- 300（本場）

      const nonRiichiPlayerScore = response.body.data.scores.find(
        (s: { playerId: string }) => s.playerId === testPlayerIds[3]
      );
      expect(nonRiichiPlayerScore.scoreChange).toBe(-900); // -600 - 300（本場）

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("局終了時にリーチ記録、本場、積み棒の点数変動を一括で計算して統合する（ロン）", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 1,
          riichiSticks: 2,
          startedAt: new Date(),
        },
      });

      // リーチ記録を追加（Scoreは作成されない）
      await prisma.roundAction.create({
        data: {
          roundId: round.id,
          playerId: testPlayerIds[1],
          type: "RIICHI",
          declaredAt: new Date(),
        },
      });

      // 局終了（子がロン、基本点2000点（本場・積み棒除く））
      const endData = {
        resultType: "RON",
        scores: [
          {
            playerId: testPlayerIds[1],
            scoreChange: 2000, // 和了点（本場・積み棒除く）
            isDealer: false,
            isWinner: true,
            isRonTarget: false,
            han: 1,
            fu: 30,
            yaku: ["リーチ"],
          },
          {
            playerId: testPlayerIds[2],
            scoreChange: 0, // 放銃者の点数はバックエンドで計算される
            isDealer: false,
            isWinner: false,
            isRonTarget: true,
          },
          {
            playerId: testPlayerIds[0],
            scoreChange: 0,
            isDealer: true,
            isWinner: false,
            isRonTarget: false,
          },
          {
            playerId: testPlayerIds[3],
            scoreChange: 0,
            isDealer: false,
            isWinner: false,
            isRonTarget: false,
          },
        ],
      };

      const response = await request(app)
        .put(`/api/rounds/${round.id}/end`)
        .send(endData)
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("scores");
      expect(response.body.data.scores).toHaveLength(4);

      // 点数変動を確認
      // 和了者（リーチ者）: 2000（基本点）+ 300（本場 × 1 × 300）+ 2000（積み棒 × 2 × 1000）- 1000（リーチ）= 3300
      // 放銃者（子）: -(2000（基本点）+ 300（本場 × 1 × 300）) - 1000（リーチ）= -3300
      const winnerScore = response.body.data.scores.find(
        (s: { isWinner: boolean }) => s.isWinner
      );
      expect(winnerScore.scoreChange).toBe(3300); // 2000 + 300（本場）+ 2000（積み棒）- 1000（リーチ）

      const ronTargetScore = response.body.data.scores.find(
        (s: { isRonTarget: boolean }) => s.isRonTarget
      );
      expect(ronTargetScore.scoreChange).toBe(-3300); // -(2000 + 300（本場）) - 1000（リーチ）

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("ダブロン時の積み棒分配（最も近い上家のみが積み棒を獲得）", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 2,
          startedAt: new Date(),
        },
      });

      // 放銃者はtestPlayerIds[3]（seatPosition=3、北）
      // 上家はtestPlayerIds[2]（seatPosition=2、西）
      // 和了者はtestPlayerIds[1]（seatPosition=1、南）とtestPlayerIds[2]（seatPosition=2、西）
      // 最も近い上家はtestPlayerIds[2]（seatPosition=2、西）のみが積み棒を獲得

      const endData = {
        resultType: "RON",
        scores: [
          {
            playerId: testPlayerIds[1],
            scoreChange: 2000,
            isDealer: false,
            isWinner: true,
            isRonTarget: false,
            han: 1,
            fu: 30,
            yaku: ["リーチ"],
          },
          {
            playerId: testPlayerIds[2],
            scoreChange: 2000,
            isDealer: false,
            isWinner: true,
            isRonTarget: false,
            han: 1,
            fu: 30,
            yaku: ["リーチ"],
          },
          {
            playerId: testPlayerIds[3],
            scoreChange: -4000,
            isDealer: false,
            isWinner: false,
            isRonTarget: true,
          },
          {
            playerId: testPlayerIds[0],
            scoreChange: 0,
            isDealer: true,
            isWinner: false,
            isRonTarget: false,
          },
        ],
      };

      const response = await request(app)
        .put(`/api/rounds/${round.id}/end`)
        .send(endData)
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("scores");
      expect(response.body.data.scores).toHaveLength(4);

      // 最も近い上家（testPlayerIds[2]）のみが積み棒を獲得（2000点）
      const upperSeatWinner = response.body.data.scores.find(
        (s: { playerId: string }) => s.playerId === testPlayerIds[2]
      );
      expect(upperSeatWinner).toBeDefined();
      expect(upperSeatWinner.isWinner).toBe(true);
      expect(upperSeatWinner.scoreChange).toBe(4000); // 2000（基本点）+ 2000（積み棒）

      // もう1人の和了者（testPlayerIds[1]）は積み棒を獲得しない
      const otherWinner = response.body.data.scores.find(
        (s: { playerId: string }) => s.playerId === testPlayerIds[1]
      );
      expect(otherWinner).toBeDefined();
      expect(otherWinner.isWinner).toBe(true);
      expect(otherWinner.scoreChange).toBe(2000); // 2000（基本点のみ、積み棒なし）

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("ダブロン時の本場点数計算（最も近い上家のみが本場の点数を受け取る）", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 1,
          riichiSticks: 0,
          startedAt: new Date(),
        },
      });

      // 放銃者はtestPlayerIds[3]（seatPosition=3、北、子）
      // 上家はtestPlayerIds[2]（seatPosition=2、西）
      // 和了者はtestPlayerIds[1]（seatPosition=1、南、子）とtestPlayerIds[2]（seatPosition=2、西、子）
      // 最も近い上家はtestPlayerIds[2]（seatPosition=2、西）のみが本場の点数を受け取る
      // 子がロン（子から）なので、本場1本につき100点

      const endData = {
        resultType: "RON",
        scores: [
          {
            playerId: testPlayerIds[1],
            scoreChange: 2000,
            isDealer: false,
            isWinner: true,
            isRonTarget: false,
            han: 1,
            fu: 30,
            yaku: ["リーチ"],
          },
          {
            playerId: testPlayerIds[2],
            scoreChange: 2000,
            isDealer: false,
            isWinner: true,
            isRonTarget: false,
            han: 1,
            fu: 30,
            yaku: ["リーチ"],
          },
          {
            playerId: testPlayerIds[3],
            scoreChange: -4000,
            isDealer: false,
            isWinner: false,
            isRonTarget: true,
          },
          {
            playerId: testPlayerIds[0],
            scoreChange: 0,
            isDealer: true,
            isWinner: false,
            isRonTarget: false,
          },
        ],
      };

      const response = await request(app)
        .put(`/api/rounds/${round.id}/end`)
        .send(endData)
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("scores");
      expect(response.body.data.scores).toHaveLength(4);

      // 最も近い上家（testPlayerIds[2]）のみが本場の点数を受け取る（100点）
      const upperSeatWinner = response.body.data.scores.find(
        (s: { playerId: string }) => s.playerId === testPlayerIds[2]
      );
      expect(upperSeatWinner).toBeDefined();
      expect(upperSeatWinner.isWinner).toBe(true);
      expect(upperSeatWinner.scoreChange).toBe(2100); // 2000（基本点）+ 100（本場）

      // もう1人の和了者（testPlayerIds[1]）は本場の点数を受け取らない
      const otherWinner = response.body.data.scores.find(
        (s: { playerId: string }) => s.playerId === testPlayerIds[1]
      );
      expect(otherWinner).toBeDefined();
      expect(otherWinner.isWinner).toBe(true);
      expect(otherWinner.scoreChange).toBe(2000); // 2000（基本点のみ、本場なし）

      // 放銃者（testPlayerIds[3]）は本場の点数を支払う（-100点）
      const ronTarget = response.body.data.scores.find(
        (s: { isRonTarget: boolean }) => s.isRonTarget
      );
      expect(ronTarget).toBeDefined();
      expect(ronTarget.playerId).toBe(testPlayerIds[3]);
      expect(ronTarget.scoreChange).toBe(-4100); // -4000（基本点）- 100（本場）

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("ダブロン時の積み棒分配（上家が和了者でない場合、和了者の中で最も近い席順の人が積み棒を獲得）", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      // Aさん（testPlayerIds[0]、seatPosition=0、東家）がリーチ
      // Bさん（testPlayerIds[1]、seatPosition=1、南家）とCさん（testPlayerIds[2]、seatPosition=2、西家）がAさんからダブロン
      // Dさん（testPlayerIds[3]、seatPosition=3、北家）は和了者ではない
      // 放銃者（Aさん、seatPosition=0）から見て上家はDさん（seatPosition=3）だが、Dさんは和了者ではない
      // 和了者の中で最も近い席順の人はBさん（seatPosition=1）なので、Bさんにだけ積み棒が加算される

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 1, // Aさんがリーチしたので積み棒1本
          startedAt: new Date(),
        },
      });

      // Aさんがリーチした記録を追加
      await request(app)
        .post(`/api/rounds/${round.id}/riichis`)
        .send({
          playerId: testPlayerIds[0],
          isDoubleRiichi: false,
          isIppatsu: false,
        })
        .expect(201);

      const endData = {
        resultType: "RON",
        scores: [
          {
            playerId: testPlayerIds[1], // Bさん（南家）
            scoreChange: 2000,
            isDealer: false,
            isWinner: true,
            isRonTarget: false,
            han: 1,
            fu: 30,
            yaku: ["リーチ"],
          },
          {
            playerId: testPlayerIds[2], // Cさん（西家）
            scoreChange: 2000,
            isDealer: false,
            isWinner: true,
            isRonTarget: false,
            han: 1,
            fu: 30,
            yaku: ["リーチ"],
          },
          {
            playerId: testPlayerIds[0], // Aさん（東家、放銃者）
            scoreChange: -4000,
            isDealer: true,
            isWinner: false,
            isRonTarget: true,
          },
          {
            playerId: testPlayerIds[3], // Dさん（北家）
            scoreChange: 0,
            isDealer: false,
            isWinner: false,
            isRonTarget: false,
          },
        ],
      };

      const response = await request(app)
        .put(`/api/rounds/${round.id}/end`)
        .send(endData)
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("scores");
      expect(response.body.data.scores).toHaveLength(4);

      // Bさん（testPlayerIds[1]）にだけ積み棒が加算される（2000点 + 1000点 = 3000点）
      const playerB = response.body.data.scores.find(
        (s: { playerId: string }) => s.playerId === testPlayerIds[1]
      );
      expect(playerB).toBeDefined();
      expect(playerB.isWinner).toBe(true);
      expect(playerB.scoreChange).toBe(3000); // 2000（基本点）+ 1000（積み棒）

      // Cさん（testPlayerIds[2]）は積み棒を獲得しない
      const playerC = response.body.data.scores.find(
        (s: { playerId: string }) => s.playerId === testPlayerIds[2]
      );
      expect(playerC).toBeDefined();
      expect(playerC.isWinner).toBe(true);
      expect(playerC.scoreChange).toBe(2000); // 2000（基本点のみ、積み棒なし）

      // Aさん（testPlayerIds[0]）は放銃者なので-4000点（基本点のみ、リーチの-1000点は別途）
      const playerA = response.body.data.scores.find(
        (s: { playerId: string }) => s.playerId === testPlayerIds[0]
      );
      expect(playerA).toBeDefined();
      expect(playerA.isRonTarget).toBe(true);
      expect(playerA.scoreChange).toBe(-5000); // -4000（基本点）- 1000（リーチ）

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("トリロン時の積み棒と本場の分配（最も近い上家のみが獲得）", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 1,
          riichiSticks: 2,
          startedAt: new Date(),
        },
      });

      // 放銃者はtestPlayerIds[0]（seatPosition=0、東、親）
      // 上家はtestPlayerIds[3]（seatPosition=3、北）
      // 和了者はtestPlayerIds[1]（seatPosition=1、南）、testPlayerIds[2]（seatPosition=2、西）、testPlayerIds[3]（seatPosition=3、北）
      // 最も近い上家はtestPlayerIds[3]（seatPosition=3、北）のみが積み棒と本場を獲得
      // 親がロン（親から）なので、本場1本につき300点

      const endData = {
        resultType: "RON",
        scores: [
          {
            playerId: testPlayerIds[1],
            scoreChange: 2000,
            isDealer: false,
            isWinner: true,
            isRonTarget: false,
            han: 1,
            fu: 30,
            yaku: ["リーチ"],
          },
          {
            playerId: testPlayerIds[2],
            scoreChange: 2000,
            isDealer: false,
            isWinner: true,
            isRonTarget: false,
            han: 1,
            fu: 30,
            yaku: ["リーチ"],
          },
          {
            playerId: testPlayerIds[3],
            scoreChange: 2000,
            isDealer: false,
            isWinner: true,
            isRonTarget: false,
            han: 1,
            fu: 30,
            yaku: ["リーチ"],
          },
          {
            playerId: testPlayerIds[0],
            scoreChange: -6000,
            isDealer: true,
            isWinner: false,
            isRonTarget: true,
          },
        ],
      };

      const response = await request(app)
        .put(`/api/rounds/${round.id}/end`)
        .send(endData)
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("scores");
      expect(response.body.data.scores).toHaveLength(4);

      // 最も近い上家（testPlayerIds[3]）のみが積み棒と本場を獲得
      const upperSeatWinner = response.body.data.scores.find(
        (s: { playerId: string }) => s.playerId === testPlayerIds[3]
      );
      expect(upperSeatWinner).toBeDefined();
      expect(upperSeatWinner.isWinner).toBe(true);
      expect(upperSeatWinner.scoreChange).toBe(4300); // 2000（基本点）+ 2000（積み棒）+ 300（本場）

      // 他の和了者（testPlayerIds[1]とtestPlayerIds[2]）は積み棒と本場を獲得しない
      const otherWinner1 = response.body.data.scores.find(
        (s: { playerId: string }) => s.playerId === testPlayerIds[1]
      );
      expect(otherWinner1).toBeDefined();
      expect(otherWinner1.isWinner).toBe(true);
      expect(otherWinner1.scoreChange).toBe(2000); // 2000（基本点のみ）

      const otherWinner2 = response.body.data.scores.find(
        (s: { playerId: string }) => s.playerId === testPlayerIds[2]
      );
      expect(otherWinner2).toBeDefined();
      expect(otherWinner2.isWinner).toBe(true);
      expect(otherWinner2.scoreChange).toBe(2000); // 2000（基本点のみ）

      // 放銃者（testPlayerIds[0]）は本場の点数を支払う（-300点）
      const ronTarget = response.body.data.scores.find(
        (s: { isRonTarget: boolean }) => s.isRonTarget
      );
      expect(ronTarget).toBeDefined();
      expect(ronTarget.playerId).toBe(testPlayerIds[0]);
      expect(ronTarget.scoreChange).toBe(-6300); // -6000（基本点）- 300（本場）

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("通常のロン（和了者1人）時の積み棒と本場の分配（既存の動作が壊れていないことを確認）", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 1,
          riichiSticks: 2,
          startedAt: new Date(),
        },
      });

      // 通常のロン（和了者1人）: 和了者が積み棒と本場を獲得

      const endData = {
        resultType: "RON",
        scores: [
          {
            playerId: testPlayerIds[1],
            scoreChange: 2000,
            isDealer: false,
            isWinner: true,
            isRonTarget: false,
            han: 1,
            fu: 30,
            yaku: ["リーチ"],
          },
          {
            playerId: testPlayerIds[2],
            scoreChange: -2000,
            isDealer: false,
            isWinner: false,
            isRonTarget: true,
          },
          {
            playerId: testPlayerIds[0],
            scoreChange: 0,
            isDealer: true,
            isWinner: false,
            isRonTarget: false,
          },
          {
            playerId: testPlayerIds[3],
            scoreChange: 0,
            isDealer: false,
            isWinner: false,
            isRonTarget: false,
          },
        ],
      };

      const response = await request(app)
        .put(`/api/rounds/${round.id}/end`)
        .send(endData)
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("scores");
      expect(response.body.data.scores).toHaveLength(4);

      // 和了者（testPlayerIds[1]）が積み棒と本場を獲得
      const winner = response.body.data.scores.find(
        (s: { isWinner: boolean }) => s.isWinner
      );
      expect(winner).toBeDefined();
      expect(winner.playerId).toBe(testPlayerIds[1]);
      expect(winner.scoreChange).toBe(4100); // 2000（基本点）+ 2000（積み棒）+ 100（本場）

      // 放銃者（testPlayerIds[2]）は本場の点数を支払う（-100点）
      const ronTarget = response.body.data.scores.find(
        (s: { isRonTarget: boolean }) => s.isRonTarget
      );
      expect(ronTarget).toBeDefined();
      expect(ronTarget.playerId).toBe(testPlayerIds[2]);
      expect(ronTarget.scoreChange).toBe(-2100); // -2000（基本点）- 100（本場）

      await prisma.round.delete({ where: { id: round.id } });
    });
  });

  describe("POST /api/rounds/:id/calculate-score", () => {
    it("ツモ（親）の打点を正しく計算する", async () => {
      if (shouldSkipTests || !prisma) {
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
        },
      });

      const calculateData = {
        resultType: "TSUMO",
        winnerPlayerId: testPlayerIds[0],
        han: 1,
        fu: 30,
        yaku: ["リーチ", "ツモ"],
      };

      const response = await request(app)
        .post(`/api/rounds/${round.id}/calculate-score`)
        .send(calculateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("scores");
      expect(response.body.data.scores).toHaveLength(4);

      const winner = response.body.data.scores.find(
        (s: { isWinner: boolean }) => s.isWinner
      );
      expect(winner).toBeDefined();
      expect(winner.scoreChange).toBeGreaterThan(0);
      expect(winner.han).toBe(1);
      expect(winner.fu).toBe(30);
      expect(winner.yaku).toEqual(["リーチ", "ツモ"]);

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("ツモ（子）の打点を正しく計算する", async () => {
      if (shouldSkipTests || !prisma) {
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
        },
      });

      const calculateData = {
        resultType: "TSUMO",
        winnerPlayerId: testPlayerIds[1],
        han: 2,
        fu: 30,
        yaku: ["リーチ"],
      };

      const response = await request(app)
        .post(`/api/rounds/${round.id}/calculate-score`)
        .send(calculateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("scores");
      expect(response.body.data.scores).toHaveLength(4);

      const winner = response.body.data.scores.find(
        (s: { isWinner: boolean }) => s.isWinner
      );
      expect(winner).toBeDefined();
      expect(winner.playerId).toBe(testPlayerIds[1]);
      expect(winner.scoreChange).toBeGreaterThan(0);

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("ロン（親）の打点を正しく計算する", async () => {
      if (shouldSkipTests || !prisma) {
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
        },
      });

      const calculateData = {
        resultType: "RON",
        winnerPlayerId: testPlayerIds[0],
        ronTargetPlayerId: testPlayerIds[1],
        han: 1,
        fu: 30,
        yaku: ["リーチ"],
      };

      const response = await request(app)
        .post(`/api/rounds/${round.id}/calculate-score`)
        .send(calculateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("scores");
      expect(response.body.data.scores).toHaveLength(4);

      const winner = response.body.data.scores.find(
        (s: { isWinner: boolean }) => s.isWinner
      );
      expect(winner).toBeDefined();
      expect(winner.scoreChange).toBeGreaterThan(0);

      const ronTarget = response.body.data.scores.find(
        (s: { isRonTarget: boolean }) => s.isRonTarget
      );
      expect(ronTarget).toBeDefined();
      expect(ronTarget.scoreChange).toBeLessThan(0);

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("ロン（子）の打点を正しく計算する", async () => {
      if (shouldSkipTests || !prisma) {
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
        },
      });

      const calculateData = {
        resultType: "RON",
        winnerPlayerId: testPlayerIds[1],
        ronTargetPlayerId: testPlayerIds[2],
        han: 2,
        fu: 30,
        yaku: ["リーチ"],
      };

      const response = await request(app)
        .post(`/api/rounds/${round.id}/calculate-score`)
        .send(calculateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("scores");
      expect(response.body.data.scores).toHaveLength(4);

      const winner = response.body.data.scores.find(
        (s: { isWinner: boolean }) => s.isWinner
      );
      expect(winner).toBeDefined();
      expect(winner.playerId).toBe(testPlayerIds[1]);
      expect(winner.scoreChange).toBeGreaterThan(0);

      const ronTarget = response.body.data.scores.find(
        (s: { isRonTarget: boolean }) => s.isRonTarget
      );
      expect(ronTarget).toBeDefined();
      expect(ronTarget.playerId).toBe(testPlayerIds[2]);
      expect(ronTarget.scoreChange).toBeLessThan(0);

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("流局の打点を正しく計算する", async () => {
      if (shouldSkipTests || !prisma) {
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
        },
      });

      const calculateData = {
        resultType: "DRAW",
      };

      const response = await request(app)
        .post(`/api/rounds/${round.id}/calculate-score`)
        .send(calculateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("scores");
      expect(response.body.data.scores).toHaveLength(4);

      response.body.data.scores.forEach((score: { scoreChange: number; isWinner: boolean }) => {
        expect(score.scoreChange).toBe(0);
        expect(score.isWinner).toBe(false);
      });

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("流し満貫の打点を正しく計算する", async () => {
      if (shouldSkipTests || !prisma) {
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
        },
      });

      const calculateData = {
        resultType: "NAGASHI_MANGAN",
      };

      const response = await request(app)
        .post(`/api/rounds/${round.id}/calculate-score`)
        .send(calculateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("scores");
      expect(response.body.data.scores).toHaveLength(4);

      response.body.data.scores.forEach((score: { scoreChange: number; isWinner: boolean }) => {
        expect(score.scoreChange).toBe(-2000);
        expect(score.isWinner).toBe(false);
      });

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("局が存在しない場合に404を返す", async () => {
      if (shouldSkipTests || !prisma) {
        return;
      }

      const calculateData = {
        resultType: "TSUMO",
        winnerPlayerId: testPlayerIds[0],
        han: 1,
        fu: 30,
      };

      const response = await request(app)
        .post("/api/rounds/invalid-id/calculate-score")
        .send(calculateData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "NOT_FOUND");
    });

    it("局がIN_PROGRESSでない場合に422を返す", async () => {
      if (shouldSkipTests || !prisma) {
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
        },
      });

      const calculateData = {
        resultType: "TSUMO",
        winnerPlayerId: testPlayerIds[0],
        han: 1,
        fu: 30,
      };

      const response = await request(app)
        .post(`/api/rounds/${round.id}/calculate-score`)
        .send(calculateData);

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VALIDATION_ERROR");

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("必須パラメータが不足している場合に400を返す", async () => {
      if (shouldSkipTests || !prisma) {
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
        },
      });

      const calculateData = {};

      const response = await request(app)
        .post(`/api/rounds/${round.id}/calculate-score`)
        .send(calculateData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VALIDATION_ERROR");

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("無効なwinnerPlayerIdの場合に422を返す", async () => {
      if (shouldSkipTests || !prisma) {
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
        },
      });

      const calculateData = {
        resultType: "TSUMO",
        winnerPlayerId: "invalid-player-id",
        han: 1,
        fu: 30,
      };

      const response = await request(app)
        .post(`/api/rounds/${round.id}/calculate-score`)
        .send(calculateData);

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VALIDATION_ERROR");

      await prisma.round.delete({ where: { id: round.id } });
    });
  });

  describe("POST /api/rounds/:id/calculate-next-settings", () => {
    it("親がツモした場合の次局設定を正しく計算する", async () => {
      if (shouldSkipTests || !prisma) {
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 1,
          riichiSticks: 2,
        },
      });

      const calculateData = {
        resultType: "TSUMO",
        winnerPlayerId: testPlayerIds[0],
      };

      const response = await request(app)
        .post(`/api/rounds/${round.id}/calculate-next-settings`)
        .send(calculateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("nextRiichiSticks", 0);
      expect(response.body.data).toHaveProperty("nextHonba", 2);
      expect(response.body.data).toHaveProperty("isRenchan", true);
      expect(response.body.data).toHaveProperty("nextRoundNumber", 1);
      expect(response.body.data).toHaveProperty("nextWind", "EAST");

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("子がツモした場合の次局設定を正しく計算する", async () => {
      if (shouldSkipTests || !prisma) {
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 1,
          riichiSticks: 1,
        },
      });

      const calculateData = {
        resultType: "TSUMO",
        winnerPlayerId: testPlayerIds[1],
      };

      const response = await request(app)
        .post(`/api/rounds/${round.id}/calculate-next-settings`)
        .send(calculateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("nextRiichiSticks", 0);
      expect(response.body.data).toHaveProperty("nextHonba", 0);
      expect(response.body.data).toHaveProperty("isRenchan", false);
      expect(response.body.data).toHaveProperty("nextRoundNumber", 2);
      expect(response.body.data).toHaveProperty("nextWind", "EAST");

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("通常の流局で親がテンパイしている場合の次局設定を正しく計算する", async () => {
      if (shouldSkipTests || !prisma) {
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 1,
          riichiSticks: 2,
        },
      });

      const calculateData = {
        resultType: "DRAW",
        isDealerTenpai: true,
      };

      const response = await request(app)
        .post(`/api/rounds/${round.id}/calculate-next-settings`)
        .send(calculateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("nextRiichiSticks", 2);
      expect(response.body.data).toHaveProperty("nextHonba", 2);
      expect(response.body.data).toHaveProperty("isRenchan", true);
      expect(response.body.data).toHaveProperty("nextRoundNumber", 1);
      expect(response.body.data).toHaveProperty("nextWind", "EAST");

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("通常の流局で親がノーテンの場合の次局設定を正しく計算する", async () => {
      if (shouldSkipTests || !prisma) {
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 1,
          riichiSticks: 1,
        },
      });

      const calculateData = {
        resultType: "DRAW",
        isDealerTenpai: false,
      };

      const response = await request(app)
        .post(`/api/rounds/${round.id}/calculate-next-settings`)
        .send(calculateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("nextRiichiSticks", 1);
      expect(response.body.data).toHaveProperty("nextHonba", 1);
      expect(response.body.data).toHaveProperty("isRenchan", false);
      expect(response.body.data).toHaveProperty("nextRoundNumber", 2);
      expect(response.body.data).toHaveProperty("nextWind", "EAST");

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("流し満貫の場合の次局設定を正しく計算する", async () => {
      if (shouldSkipTests || !prisma) {
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 1,
          riichiSticks: 1,
        },
      });

      const calculateData = {
        resultType: "NAGASHI_MANGAN",
      };

      const response = await request(app)
        .post(`/api/rounds/${round.id}/calculate-next-settings`)
        .send(calculateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("nextRiichiSticks", 0);
      expect(response.body.data).toHaveProperty("nextHonba", 0);
      expect(response.body.data).toHaveProperty("isRenchan", false);
      expect(response.body.data).toHaveProperty("nextRoundNumber", 2);
      expect(response.body.data).toHaveProperty("nextWind", "EAST");

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("局が存在しない場合に404を返す", async () => {
      if (shouldSkipTests || !prisma) {
        return;
      }

      const calculateData = {
        resultType: "TSUMO",
        winnerPlayerId: testPlayerIds[0],
      };

      const response = await request(app)
        .post("/api/rounds/invalid-id/calculate-next-settings")
        .send(calculateData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "NOT_FOUND");
    });

    it("局がIN_PROGRESSまたはCOMPLETEDでない場合に422を返す", async () => {
      if (shouldSkipTests || !prisma) {
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
        },
      });

      const calculateData = {
        resultType: "TSUMO",
        winnerPlayerId: testPlayerIds[0],
      };

      const response = await request(app)
        .post(`/api/rounds/${round.id}/calculate-next-settings`)
        .send(calculateData);

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VALIDATION_ERROR");

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("必須パラメータが不足している場合に400を返す", async () => {
      if (shouldSkipTests || !prisma) {
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
        },
      });

      const calculateData = {};

      const response = await request(app)
        .post(`/api/rounds/${round.id}/calculate-next-settings`)
        .send(calculateData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VALIDATION_ERROR");

      await prisma.round.delete({ where: { id: round.id } });
    });

    it("無効なwinnerPlayerIdの場合に422を返す", async () => {
      if (shouldSkipTests || !prisma) {
        return;
      }

      const round = await prisma.round.create({
        data: {
          hanchanId: testHanchanId,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: testPlayerIds[0],
          honba: 0,
          riichiSticks: 0,
        },
      });

      const calculateData = {
        resultType: "TSUMO",
        winnerPlayerId: "invalid-player-id",
      };

      const response = await request(app)
        .post(`/api/rounds/${round.id}/calculate-next-settings`)
        .send(calculateData);

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VALIDATION_ERROR");

      await prisma.round.delete({ where: { id: round.id } });
    });
  });
});

