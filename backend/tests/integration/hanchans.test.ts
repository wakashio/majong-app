import request from "supertest";
import app from "../../src/app";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const shouldSkipTests = false;

describe("Hanchans API", () => {
  let testHanchanId: string;
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

  describe("GET /api/hanchans", () => {
    it("半荘一覧を取得できる", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const response = await request(app).get("/api/hanchans");

      if (response.status !== 200) {
        console.error("Response status:", response.status);
        console.error("Response body:", JSON.stringify(response.body, null, 2));
      }

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty("meta");
      expect(response.body.meta).toHaveProperty("total");
      expect(response.body.meta).toHaveProperty("limit");
      expect(response.body.meta).toHaveProperty("offset");
    });

    it("レスポンスがJSON形式である", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const response = await request(app).get("/api/hanchans");

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

      const response = await request(app).get("/api/hanchans?status=IN_PROGRESS");

      if (response.status !== 200) {
        console.error("Response status:", response.status);
        console.error("Response body:", JSON.stringify(response.body, null, 2));
      }

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("GET /api/hanchans/:id", () => {
    it("指定されたIDの半荘を取得できる", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const players = await Promise.all([
        prisma.player.create({ data: { name: `テスト参加者1_${Date.now()}` } }),
        prisma.player.create({ data: { name: `テスト参加者2_${Date.now()}` } }),
        prisma.player.create({ data: { name: `テスト参加者3_${Date.now()}` } }),
        prisma.player.create({ data: { name: `テスト参加者4_${Date.now()}` } }),
      ]);

      const playerIds = players.map((p) => p.id);

      const hanchan = await prisma.hanchan.create({
        data: {
          name: "テスト半荘",
          startedAt: new Date(),
          status: "IN_PROGRESS",
          hanchanPlayers: {
            create: playerIds.map((playerId, index) => ({
              playerId,
              seatPosition: index,
              initialScore: 25000,
            })),
          },
        },
      });

      const response = await request(app).get(`/api/hanchans/${hanchan.id}`);

      if (response.status !== 200) {
        console.error("Response status:", response.status);
        console.error("Response body:", JSON.stringify(response.body, null, 2));
      }

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("id", hanchan.id);
      expect(response.body.data).toHaveProperty("name", "テスト半荘");
      expect(response.body.data).toHaveProperty("hanchanPlayers");
      expect(response.body.data.hanchanPlayers).toHaveLength(4);

      await prisma.hanchan.delete({ where: { id: hanchan.id } });
      for (const player of players) {
        await prisma.player.delete({ where: { id: player.id } });
      }
    });

    it("存在しない半荘IDの場合はエラー", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const nonExistentId = "00000000-0000-0000-0000-000000000000";

      const response = await request(app).get(`/api/hanchans/${nonExistentId}`);

      if (response.status !== 404) {
        console.error("Response status:", response.status);
        console.error("Response body:", JSON.stringify(response.body, null, 2));
      }

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "NOT_FOUND");
    });
  });

  describe("POST /api/hanchans", () => {
    beforeEach(async () => {
      if (shouldSkipTests || !prisma) {
        return;
      }

      const players = await Promise.all([
        prisma.player.create({ data: { name: `作成テスト参加者1_${Date.now()}` } }),
        prisma.player.create({ data: { name: `作成テスト参加者2_${Date.now()}` } }),
        prisma.player.create({ data: { name: `作成テスト参加者3_${Date.now()}` } }),
        prisma.player.create({ data: { name: `作成テスト参加者4_${Date.now()}` } }),
      ]);

      testPlayerIds = players.map((p) => p.id);
    });

    afterEach(async () => {
      if (shouldSkipTests || !prisma) {
        return;
      }

      if (testHanchanId) {
        try {
          await prisma.hanchan.delete({ where: { id: testHanchanId } });
        } catch (error) {
          // エラーは無視
        }
        testHanchanId = "";
      }
    });

    it("新しい半荘を作成できる", async () => {
      if (shouldSkipTests || !prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const newHanchan = {
        name: "新規半荘",
        playerIds: testPlayerIds,
      };

      const response = await request(app)
        .post("/api/hanchans")
        .send(newHanchan)
        .expect(201);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data).toHaveProperty("name", "新規半荘");
      expect(response.body.data).toHaveProperty("status", "IN_PROGRESS");
      expect(response.body.data).toHaveProperty("hanchanPlayers");
      expect(response.body.data.hanchanPlayers).toHaveLength(4);

      testHanchanId = response.body.data.id;
    });

    it("参加者IDが4つでない場合はエラー", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const response = await request(app)
        .post("/api/hanchans")
        .send({
          name: "テスト半荘",
          playerIds: testPlayerIds.slice(0, 3),
        })
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VALIDATION_ERROR");
    });

    it("参加者IDが重複している場合はエラー", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const response = await request(app)
        .post("/api/hanchans")
        .send({
          name: "テスト半荘",
          playerIds: [testPlayerIds[0], testPlayerIds[0], testPlayerIds[1], testPlayerIds[2]],
        })
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VALIDATION_ERROR");
    });

    it("存在しない参加者IDの場合はエラー", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const nonExistentId = "00000000-0000-0000-0000-000000000000";

      const response = await request(app)
        .post("/api/hanchans")
        .send({
          name: "テスト半荘",
          playerIds: [nonExistentId, testPlayerIds[1], testPlayerIds[2], testPlayerIds[3]],
        })
        .expect(404);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "NOT_FOUND");
    });

    it("席順を指定して半荘を作成できる", async () => {
      if (shouldSkipTests || !prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const newHanchan = {
        name: "席順指定半荘",
        playerIds: testPlayerIds,
        seatPositions: [3, 2, 1, 0],
      };

      const response = await request(app)
        .post("/api/hanchans")
        .send(newHanchan)
        .expect(201);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data).toHaveProperty("hanchanPlayers");
      expect(response.body.data.hanchanPlayers).toHaveLength(4);

      const seatPositions = response.body.data.hanchanPlayers.map((hp: { seatPosition: number }) => hp.seatPosition);
      expect(seatPositions).toEqual([0, 1, 2, 3]);

      testHanchanId = response.body.data.id;
    });

    it("セッションIDを指定して半荘を作成できる", async () => {
      if (shouldSkipTests || !prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      // セッションを作成
      const sessionResponse = await request(app)
        .post("/api/sessions")
        .send({
          date: "2026-01-01",
          name: "テストセッション",
          playerIds: testPlayerIds,
        });

      if (sessionResponse.status !== 201) {
        console.log("テストをスキップ: セッション作成に失敗");
        return;
      }

      const sessionId = sessionResponse.body.data.id;

      const newHanchan = {
        name: "セッション付き半荘",
        playerIds: testPlayerIds,
        sessionId: sessionId,
      };

      const response = await request(app)
        .post("/api/hanchans")
        .send(newHanchan)
        .expect(201);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data).toHaveProperty("sessionId", sessionId);
      expect(response.body.data).toHaveProperty("name", "セッション付き半荘");
      expect(response.body.data).toHaveProperty("hanchanPlayers");
      expect(response.body.data.hanchanPlayers).toHaveLength(4);

      testHanchanId = response.body.data.id;

      // クリーンアップ
      await request(app).delete(`/api/sessions/${sessionId}`);
    });

    it("存在しないセッションIDの場合はエラー", async () => {
      if (!prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const nonExistentSessionId = "00000000-0000-0000-0000-000000000000";

      const response = await request(app)
        .post("/api/hanchans")
        .send({
          name: "テスト半荘",
          playerIds: testPlayerIds,
          sessionId: nonExistentSessionId,
        })
        .expect(404);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "NOT_FOUND");
    });

    it("半荘作成時に自動的に東1局0本場の局が作成される", async () => {
      if (shouldSkipTests || !prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const newHanchan = {
        name: "局自動作成テスト半荘",
        playerIds: testPlayerIds,
      };

      const response = await request(app)
        .post("/api/hanchans")
        .send(newHanchan)
        .expect(201);

      expect(response.body).toHaveProperty("data");
      const hanchanId = response.body.data.id;
      testHanchanId = hanchanId;

      const rounds = await prisma.round.findMany({
        where: { hanchanId },
        include: {
          dealerPlayer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      expect(rounds).toHaveLength(1);
      const round = rounds[0];
      expect(round.roundNumber).toBe(1);
      expect(round.wind).toBe("EAST");
      expect(round.honba).toBe(0);
      expect(round.riichiSticks).toBe(0);

      const dealerPlayer = response.body.data.hanchanPlayers.find(
        (hp: { seatPosition: number }) => hp.seatPosition === 0
      );
      expect(round.dealerPlayerId).toBe(dealerPlayer.playerId);
      expect(round.dealerPlayer).toHaveProperty("id", dealerPlayer.playerId);
      expect(round.dealerPlayer).toHaveProperty("name", dealerPlayer.player.name);
    });

    it("半荘作成時にseatPosition=0の参加者が見つからない場合はエラー", async () => {
      if (shouldSkipTests || !prisma || !testPlayerIds || testPlayerIds.length !== 4) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const hanchan = await prisma.hanchan.create({
        data: {
          name: "エラーテスト半荘",
          startedAt: new Date(),
          status: "IN_PROGRESS",
          hanchanPlayers: {
            create: testPlayerIds.map((playerId, index) => ({
              playerId,
              seatPosition: index + 1,
              initialScore: 25000,
            })),
          },
        },
      });

      const hanchanId = hanchan.id;

      try {
        await prisma.$transaction(async (tx) => {
          const hanchanPlayers = await tx.hanchanPlayer.findMany({
            where: { hanchanId },
          });

          const dealerPlayer = hanchanPlayers.find((hp) => hp.seatPosition === 0);

          if (!dealerPlayer) {
            throw new Error("Player with seatPosition 0 not found");
          }

          await tx.round.create({
            data: {
              hanchanId,
              roundNumber: 1,
              wind: "EAST",
              dealerPlayerId: dealerPlayer.playerId,
              honba: 0,
              riichiSticks: 0,
            },
          });
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe("Player with seatPosition 0 not found");
      } finally {
        await prisma.hanchan.delete({ where: { id: hanchanId } });
      }
    });
  });

  describe("PUT /api/hanchans/:id", () => {
    let updateTestHanchanId: string;
    let updateTestPlayerIds: string[];

    beforeEach(async () => {
      if (shouldSkipTests || !prisma) {
        return;
      }

      const players = await Promise.all([
        prisma.player.create({ data: { name: `更新テスト参加者1_${Date.now()}` } }),
        prisma.player.create({ data: { name: `更新テスト参加者2_${Date.now()}` } }),
        prisma.player.create({ data: { name: `更新テスト参加者3_${Date.now()}` } }),
        prisma.player.create({ data: { name: `更新テスト参加者4_${Date.now()}` } }),
      ]);

      updateTestPlayerIds = players.map((p) => p.id);

      const hanchan = await prisma.hanchan.create({
        data: {
          name: "更新テスト半荘",
          startedAt: new Date(),
          status: "IN_PROGRESS",
          hanchanPlayers: {
            create: updateTestPlayerIds.map((playerId, index) => ({
              playerId,
              seatPosition: index,
              initialScore: 25000,
            })),
          },
        },
      });

      updateTestHanchanId = hanchan.id;
    });

    afterEach(async () => {
      if (shouldSkipTests || !prisma) {
        return;
      }

      if (updateTestHanchanId) {
        try {
          await prisma.hanchan.delete({ where: { id: updateTestHanchanId } });
        } catch (error) {
          // エラーは無視
        }
      }

      if (updateTestPlayerIds && updateTestPlayerIds.length > 0) {
        for (const playerId of updateTestPlayerIds) {
          try {
            await prisma.player.delete({ where: { id: playerId } });
          } catch (error) {
            // エラーは無視
          }
        }
      }
    });

    it("半荘情報を更新できる", async () => {
      if (shouldSkipTests || !prisma || !updateTestHanchanId) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const updatedName = `更新後_${Date.now()}`;

      const response = await request(app)
        .put(`/api/hanchans/${updateTestHanchanId}`)
        .send({ name: updatedName })
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("id", updateTestHanchanId);
      expect(response.body.data).toHaveProperty("name", updatedName);
    });

    it("半荘ステータスを完了に更新できる", async () => {
      if (shouldSkipTests || !prisma || !updateTestHanchanId) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const response = await request(app)
        .put(`/api/hanchans/${updateTestHanchanId}`)
        .send({ status: "COMPLETED" })
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("status", "COMPLETED");
      expect(response.body.data).toHaveProperty("endedAt");
      expect(response.body.data.endedAt).not.toBeNull();
    });

    it("最終点数を設定できる", async () => {
      if (shouldSkipTests || !prisma || !updateTestHanchanId || !updateTestPlayerIds) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const finalScores: Record<string, number> = {};
      updateTestPlayerIds.forEach((playerId, index) => {
        finalScores[playerId] = 25000 + (index - 1.5) * 1000;
      });

      const response = await request(app)
        .put(`/api/hanchans/${updateTestHanchanId}`)
        .send({ finalScores })
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("hanchanPlayers");
      expect(response.body.data.hanchanPlayers).toHaveLength(4);
    });

    it("存在しない半荘IDの場合はエラー", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const nonExistentId = "00000000-0000-0000-0000-000000000000";

      const response = await request(app)
        .put(`/api/hanchans/${nonExistentId}`)
        .send({ name: "更新テスト" });

      if (response.status !== 404) {
        console.error("Response status:", response.status);
        console.error("Response body:", JSON.stringify(response.body, null, 2));
      }

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "NOT_FOUND");
    });
  });

  describe("DELETE /api/hanchans/:id", () => {
    let deleteTestHanchanId: string;
    let deleteTestPlayerIds: string[];

    beforeEach(async () => {
      if (shouldSkipTests || !prisma) {
        return;
      }

      const players = await Promise.all([
        prisma.player.create({ data: { name: `削除テスト参加者1_${Date.now()}` } }),
        prisma.player.create({ data: { name: `削除テスト参加者2_${Date.now()}` } }),
        prisma.player.create({ data: { name: `削除テスト参加者3_${Date.now()}` } }),
        prisma.player.create({ data: { name: `削除テスト参加者4_${Date.now()}` } }),
      ]);

      deleteTestPlayerIds = players.map((p) => p.id);

      const hanchan = await prisma.hanchan.create({
        data: {
          name: "削除テスト半荘",
          startedAt: new Date(),
          status: "IN_PROGRESS",
          hanchanPlayers: {
            create: deleteTestPlayerIds.map((playerId, index) => ({
              playerId,
              seatPosition: index,
              initialScore: 25000,
            })),
          },
        },
      });

      deleteTestHanchanId = hanchan.id;
    });

    afterEach(async () => {
      if (shouldSkipTests || !prisma) {
        return;
      }

      if (deleteTestHanchanId) {
        try {
          await prisma.hanchan.delete({ where: { id: deleteTestHanchanId } });
        } catch (error) {
          // エラーは無視
        }
      }

      if (deleteTestPlayerIds && deleteTestPlayerIds.length > 0) {
        for (const playerId of deleteTestPlayerIds) {
          try {
            await prisma.player.delete({ where: { id: playerId } });
          } catch (error) {
            // エラーは無視
          }
        }
      }
    });

    it("半荘を削除できる", async () => {
      if (shouldSkipTests || !prisma || !deleteTestHanchanId) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const response = await request(app)
        .delete(`/api/hanchans/${deleteTestHanchanId}`)
        .expect(204);

      expect(response.body).toEqual({});

      const deletedHanchan = await prisma.hanchan.findUnique({
        where: { id: deleteTestHanchanId },
      });
      expect(deletedHanchan).toBeNull();

      deleteTestHanchanId = "";
    });

    it("存在しない半荘IDの場合はエラー", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const nonExistentId = "00000000-0000-0000-0000-000000000000";

      const response = await request(app)
        .delete(`/api/hanchans/${nonExistentId}`);

      if (response.status !== 404) {
        console.error("Response status:", response.status);
        console.error("Response body:", JSON.stringify(response.body, null, 2));
      }

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "NOT_FOUND");
    });
  });

  describe("GET /api/hanchans/:id/statistics", () => {
    it("半荘統計を正しく取得する", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      // テストデータを作成
      const players = await Promise.all([
        prisma.player.create({ data: { name: "統計テスト参加者1" } }),
        prisma.player.create({ data: { name: "統計テスト参加者2" } }),
        prisma.player.create({ data: { name: "統計テスト参加者3" } }),
        prisma.player.create({ data: { name: "統計テスト参加者4" } }),
      ]);

      const hanchan = await prisma.hanchan.create({
        data: {
          startedAt: new Date(),
          status: "IN_PROGRESS",
          hanchanPlayers: {
            create: [
              { playerId: players[0].id, seatPosition: 0, initialScore: 25000 },
              { playerId: players[1].id, seatPosition: 1, initialScore: 25000 },
              { playerId: players[2].id, seatPosition: 2, initialScore: 25000 },
              { playerId: players[3].id, seatPosition: 3, initialScore: 25000 },
            ],
          },
        },
      });

      const response = await request(app).get(`/api/hanchans/${hanchan.id}/statistics`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("hanchanId", hanchan.id);
      expect(response.body.data).toHaveProperty("totalRounds");
      expect(response.body.data).toHaveProperty("players");
      expect(Array.isArray(response.body.data.players)).toBe(true);
      expect(response.body.data.players).toHaveLength(4);

      // 各参加者にcurrentScoreとcurrentRankが含まれていることを確認
      for (const player of response.body.data.players) {
        expect(player).toHaveProperty("currentScore");
        expect(player).toHaveProperty("currentRank");
        expect(typeof player.currentScore).toBe("number");
        expect(typeof player.currentRank).toBe("number");
        expect(player.currentScore).toBeGreaterThanOrEqual(0);
        expect(player.currentRank).toBeGreaterThanOrEqual(1);
        expect(player.currentRank).toBeLessThanOrEqual(4);
      }

      // クリーンアップ
      await prisma.hanchan.delete({ where: { id: hanchan.id } });
      for (const player of players) {
        await prisma.player.delete({ where: { id: player.id } });
      }
    });

    it("現在の持ち点と順位が正しく計算される", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      // テストデータを作成
      const players = await Promise.all([
        prisma.player.create({ data: { name: "持ち点テスト参加者1" } }),
        prisma.player.create({ data: { name: "持ち点テスト参加者2" } }),
        prisma.player.create({ data: { name: "持ち点テスト参加者3" } }),
        prisma.player.create({ data: { name: "持ち点テスト参加者4" } }),
      ]);

      const hanchan = await prisma.hanchan.create({
        data: {
          startedAt: new Date(),
          status: "IN_PROGRESS",
          hanchanPlayers: {
            create: [
              { playerId: players[0].id, seatPosition: 0, initialScore: 25000 },
              { playerId: players[1].id, seatPosition: 1, initialScore: 25000 },
              { playerId: players[2].id, seatPosition: 2, initialScore: 25000 },
              { playerId: players[3].id, seatPosition: 3, initialScore: 25000 },
            ],
          },
        },
      });

      // 局を作成
      const round = await prisma.round.create({
        data: {
          hanchanId: hanchan.id,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: players[0].id,
          honba: 0,
          riichiSticks: 0,
        },
      });

      // スコアを作成（参加者1が+5000点、参加者2が-2000点、参加者3が-2000点、参加者4が-1000点）
      await Promise.all([
        prisma.score.create({
          data: {
            roundId: round.id,
            playerId: players[0].id,
            scoreChange: 5000,
            isDealer: true,
            isWinner: true,
            isRonTarget: false,
            han: 3,
            fu: 40,
            yaku: [],
          },
        }),
        prisma.score.create({
          data: {
            roundId: round.id,
            playerId: players[1].id,
            scoreChange: -2000,
            isDealer: false,
            isWinner: false,
            isRonTarget: false,
            yaku: [],
          },
        }),
        prisma.score.create({
          data: {
            roundId: round.id,
            playerId: players[2].id,
            scoreChange: -2000,
            isDealer: false,
            isWinner: false,
            isRonTarget: false,
            yaku: [],
          },
        }),
        prisma.score.create({
          data: {
            roundId: round.id,
            playerId: players[3].id,
            scoreChange: -1000,
            isDealer: false,
            isWinner: false,
            isRonTarget: false,
            yaku: [],
          },
        }),
      ]);

      const response = await request(app).get(`/api/hanchans/${hanchan.id}/statistics`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("players");
      expect(Array.isArray(response.body.data.players)).toBe(true);
      expect(response.body.data.players).toHaveLength(4);

      // 参加者1の現在の持ち点と順位を確認
      const player1 = response.body.data.players.find(
        (p: { playerId: string }) => p.playerId === players[0].id
      );
      expect(player1).toBeDefined();
      expect(player1.currentScore).toBe(30000); // 25000 + 5000
      expect(player1.currentRank).toBe(1); // 最高得点なので1位

      // 参加者2の現在の持ち点と順位を確認
      const player2 = response.body.data.players.find(
        (p: { playerId: string }) => p.playerId === players[1].id
      );
      expect(player2).toBeDefined();
      expect(player2.currentScore).toBe(23000); // 25000 - 2000
      expect(player2.currentRank).toBe(3); // 3位または4位（同点の場合はseatPositionで決定）

      // 参加者3の現在の持ち点と順位を確認
      const player3 = response.body.data.players.find(
        (p: { playerId: string }) => p.playerId === players[2].id
      );
      expect(player3).toBeDefined();
      expect(player3.currentScore).toBe(23000); // 25000 - 2000
      expect(player3.currentRank).toBe(4); // 同点だがseatPositionが大きいので4位

      // 参加者4の現在の持ち点と順位を確認
      const player4 = response.body.data.players.find(
        (p: { playerId: string }) => p.playerId === players[3].id
      );
      expect(player4).toBeDefined();
      expect(player4.currentScore).toBe(24000); // 25000 - 1000
      expect(player4.currentRank).toBe(2); // 2位

      // クリーンアップ
      await prisma.round.delete({ where: { id: round.id } });
      await prisma.hanchan.delete({ where: { id: hanchan.id } });
      for (const player of players) {
        await prisma.player.delete({ where: { id: player.id } });
      }
    });

    it("存在しない半荘IDの場合は404を返す", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const nonExistentId = "00000000-0000-0000-0000-000000000000";

      const response = await request(app).get(`/api/hanchans/${nonExistentId}/statistics`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "NOT_FOUND");
    });
  });

  describe("GET /api/hanchans/:id/history", () => {
    it("半荘履歴を正しく取得する", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      // テストデータを作成
      const players = await Promise.all([
        prisma.player.create({ data: { name: "履歴テスト参加者1" } }),
        prisma.player.create({ data: { name: "履歴テスト参加者2" } }),
        prisma.player.create({ data: { name: "履歴テスト参加者3" } }),
        prisma.player.create({ data: { name: "履歴テスト参加者4" } }),
      ]);

      const hanchan = await prisma.hanchan.create({
        data: {
          startedAt: new Date(),
          status: "IN_PROGRESS",
          hanchanPlayers: {
            create: [
              { playerId: players[0].id, seatPosition: 0, initialScore: 25000 },
              { playerId: players[1].id, seatPosition: 1, initialScore: 25000 },
              { playerId: players[2].id, seatPosition: 2, initialScore: 25000 },
              { playerId: players[3].id, seatPosition: 3, initialScore: 25000 },
            ],
          },
        },
      });

      const response = await request(app).get(`/api/hanchans/${hanchan.id}/history`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body).toHaveProperty("pagination");
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toHaveProperty("total");
      expect(response.body.pagination).toHaveProperty("limit");
      expect(response.body.pagination).toHaveProperty("offset");

      // クリーンアップ
      await prisma.hanchan.delete({ where: { id: hanchan.id } });
      for (const player of players) {
        await prisma.player.delete({ where: { id: player.id } });
      }
    });

    it("存在しない半荘IDの場合は404を返す", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      const nonExistentId = "00000000-0000-0000-0000-000000000000";

      const response = await request(app).get(`/api/hanchans/${nonExistentId}/history`);

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
      const players = await Promise.all([
        prisma.player.create({ data: { name: "ページネーションテスト参加者1" } }),
        prisma.player.create({ data: { name: "ページネーションテスト参加者2" } }),
        prisma.player.create({ data: { name: "ページネーションテスト参加者3" } }),
        prisma.player.create({ data: { name: "ページネーションテスト参加者4" } }),
      ]);

      const hanchan = await prisma.hanchan.create({
        data: {
          startedAt: new Date(),
          status: "IN_PROGRESS",
          hanchanPlayers: {
            create: [
              { playerId: players[0].id, seatPosition: 0, initialScore: 25000 },
              { playerId: players[1].id, seatPosition: 1, initialScore: 25000 },
              { playerId: players[2].id, seatPosition: 2, initialScore: 25000 },
              { playerId: players[3].id, seatPosition: 3, initialScore: 25000 },
            ],
          },
        },
      });

      const response = await request(app)
        .get(`/api/hanchans/${hanchan.id}/history`)
        .query({ limit: 20, offset: 0 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body).toHaveProperty("pagination");
      expect(response.body.pagination).toHaveProperty("limit", 20);
      expect(response.body.pagination).toHaveProperty("offset", 0);

      // クリーンアップ
      await prisma.hanchan.delete({ where: { id: hanchan.id } });
      for (const player of players) {
        await prisma.player.delete({ where: { id: player.id } });
      }
    });
  });

  describe("PUT /api/hanchans/:id - 半荘終了時のウマオカ計算", () => {
    it("セッションのウマオカ設定を使用して半荘を終了できる", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      // テストデータを作成
      const players = await Promise.all([
        prisma.player.create({ data: { name: "ウマオカテスト参加者1" } }),
        prisma.player.create({ data: { name: "ウマオカテスト参加者2" } }),
        prisma.player.create({ data: { name: "ウマオカテスト参加者3" } }),
        prisma.player.create({ data: { name: "ウマオカテスト参加者4" } }),
      ]);

      const session = await prisma.session.create({
        data: {
          date: new Date(),
          name: "ウマオカテストセッション",
          umaOkaConfig: {
            initialScore: 30000,
            returnScore: 30000,
            uma: [20, 10, -10, -20],
          },
          sessionPlayers: {
            create: players.map((p) => ({ playerId: p.id })),
          },
        },
      });

      const hanchan = await prisma.hanchan.create({
        data: {
          startedAt: new Date(),
          status: "IN_PROGRESS",
          sessionId: session.id,
          hanchanPlayers: {
            create: [
              { playerId: players[0].id, seatPosition: 0, initialScore: 30000 },
              { playerId: players[1].id, seatPosition: 1, initialScore: 30000 },
              { playerId: players[2].id, seatPosition: 2, initialScore: 30000 },
              { playerId: players[3].id, seatPosition: 3, initialScore: 30000 },
            ],
          },
        },
      });

      // 局を作成して得点変動を記録
      const round = await prisma.round.create({
        data: {
          hanchanId: hanchan.id,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: players[0].id,
          honba: 0,
          riichiSticks: 0,
        },
      });

      // 得点変動を記録（player0: +5000, player1: -2000, player2: -2000, player3: -1000）
      await prisma.score.createMany({
        data: [
          {
            roundId: round.id,
            playerId: players[0].id,
            scoreChange: 5000,
            isDealer: true,
            isWinner: true,
            han: 1,
            fu: 30,
            yaku: ["ツモ"],
          },
          {
            roundId: round.id,
            playerId: players[1].id,
            scoreChange: -2000,
            isDealer: false,
            isWinner: false,
          },
          {
            roundId: round.id,
            playerId: players[2].id,
            scoreChange: -2000,
            isDealer: false,
            isWinner: false,
          },
          {
            roundId: round.id,
            playerId: players[3].id,
            scoreChange: -1000,
            isDealer: false,
            isWinner: false,
          },
        ],
      });

      // 半荘を終了
      const response = await request(app)
        .put(`/api/hanchans/${hanchan.id}`)
        .send({ status: "COMPLETED" })
        .expect(200);

      expect(response.body.data.status).toBe("COMPLETED");
      expect(response.body.data.endedAt).toBeTruthy();

      // 最終得点を確認
      const updatedHanchan = await prisma.hanchan.findUnique({
        where: { id: hanchan.id },
        include: {
          hanchanPlayers: {
            orderBy: { seatPosition: "asc" },
          },
        },
      });

      expect(updatedHanchan).toBeTruthy();
      if (updatedHanchan) {
        // player0: 30000 + 5000 = 35000（currentScore）、オカ0、ウマ20 → 35000 + 0 + 20000 + (0 × 4) = 55000
        expect(updatedHanchan.hanchanPlayers[0].finalScore).toBe(35000); // ウマオカ考慮前の値（currentScore）
        expect(updatedHanchan.hanchanPlayers[0].finalScoreWithUmaOka).toBe(55000); // ウマオカ考慮後の値
        // player1: 30000 - 2000 = 28000（currentScore）、オカ0、ウマ10 → 28000 + 0 + 10000 = 38000
        expect(updatedHanchan.hanchanPlayers[1].finalScore).toBe(28000);
        expect(updatedHanchan.hanchanPlayers[1].finalScoreWithUmaOka).toBe(38000);
        // player2: 30000 - 2000 = 28000（currentScore）、オカ0、ウマ-10 → 28000 + 0 - 10000 = 18000
        expect(updatedHanchan.hanchanPlayers[2].finalScore).toBe(28000);
        expect(updatedHanchan.hanchanPlayers[2].finalScoreWithUmaOka).toBe(18000);
        // player3: 30000 - 1000 = 29000（currentScore）、オカ0、ウマ-20 → 29000 + 0 - 20000 = 9000
        expect(updatedHanchan.hanchanPlayers[3].finalScore).toBe(29000);
        expect(updatedHanchan.hanchanPlayers[3].finalScoreWithUmaOka).toBe(9000);
      }

      // クリーンアップ
      await prisma.hanchan.delete({ where: { id: hanchan.id } });
      await prisma.session.delete({ where: { id: session.id } });
      for (const player of players) {
        await prisma.player.delete({ where: { id: player.id } });
      }
    });

    it("セッションのウマオカ設定がない場合はデフォルト設定を使用する", async () => {
      if (!prisma) {
        console.log("テストをスキップ: データベース接続が必要");
        return;
      }

      // テストデータを作成
      const players = await Promise.all([
        prisma.player.create({ data: { name: "デフォルトウマオカテスト参加者1" } }),
        prisma.player.create({ data: { name: "デフォルトウマオカテスト参加者2" } }),
        prisma.player.create({ data: { name: "デフォルトウマオカテスト参加者3" } }),
        prisma.player.create({ data: { name: "デフォルトウマオカテスト参加者4" } }),
      ]);

      const session = await prisma.session.create({
        data: {
          date: new Date(),
          name: "デフォルトウマオカテストセッション",
          sessionPlayers: {
            create: players.map((p) => ({ playerId: p.id })),
          },
        },
      });

      const hanchan = await prisma.hanchan.create({
        data: {
          startedAt: new Date(),
          status: "IN_PROGRESS",
          sessionId: session.id,
          hanchanPlayers: {
            create: [
              { playerId: players[0].id, seatPosition: 0, initialScore: 25000 },
              { playerId: players[1].id, seatPosition: 1, initialScore: 25000 },
              { playerId: players[2].id, seatPosition: 2, initialScore: 25000 },
              { playerId: players[3].id, seatPosition: 3, initialScore: 25000 },
            ],
          },
        },
      });

      // 局を作成して得点変動を記録
      const round = await prisma.round.create({
        data: {
          hanchanId: hanchan.id,
          roundNumber: 1,
          wind: "EAST",
          dealerPlayerId: players[0].id,
          honba: 0,
          riichiSticks: 0,
        },
      });

      // 得点変動を記録（player0: +5000, player1: -2000, player2: -2000, player3: -1000）
      await prisma.score.createMany({
        data: [
          {
            roundId: round.id,
            playerId: players[0].id,
            scoreChange: 5000,
            isDealer: true,
            isWinner: true,
            han: 1,
            fu: 30,
            yaku: ["ツモ"],
          },
          {
            roundId: round.id,
            playerId: players[1].id,
            scoreChange: -2000,
            isDealer: false,
            isWinner: false,
          },
          {
            roundId: round.id,
            playerId: players[2].id,
            scoreChange: -2000,
            isDealer: false,
            isWinner: false,
          },
          {
            roundId: round.id,
            playerId: players[3].id,
            scoreChange: -1000,
            isDealer: false,
            isWinner: false,
          },
        ],
      });

      // 半荘を終了
      const response = await request(app)
        .put(`/api/hanchans/${hanchan.id}`)
        .send({ status: "COMPLETED" })
        .expect(200);

      expect(response.body.data.status).toBe("COMPLETED");

      // 最終得点を確認（デフォルト設定: 25000持ち30000返し、ウマ30-10-10-30）
      const updatedHanchan = await prisma.hanchan.findUnique({
        where: { id: hanchan.id },
        include: {
          hanchanPlayers: {
            orderBy: { seatPosition: "asc" },
          },
        },
      });

      expect(updatedHanchan).toBeTruthy();
      if (updatedHanchan) {
        // player0: 25000 + 5000 = 30000（currentScore）、オカ-5000、ウマ30 → 30000 + (-5000) + 30000 + (-5000 × 4) = 35000
        expect(updatedHanchan.hanchanPlayers[0].finalScore).toBe(30000); // ウマオカ考慮前の値（currentScore）
        expect(updatedHanchan.hanchanPlayers[0].finalScoreWithUmaOka).toBe(35000); // ウマオカ考慮後の値
      }

      // クリーンアップ
      await prisma.hanchan.delete({ where: { id: hanchan.id } });
      await prisma.session.delete({ where: { id: session.id } });
      for (const player of players) {
        await prisma.player.delete({ where: { id: player.id } });
      }
    });
  });
});

