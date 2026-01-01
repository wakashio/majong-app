import { calculateUmaOka, type PlayerScore } from "../../src/services/umaOkaCalculationService";

describe("UmaOkaCalculationService", () => {
  describe("calculateUmaOka", () => {
    it("デフォルト設定でウマオカを計算できる", () => {
      const playerScores: PlayerScore[] = [
        { playerId: "player1", currentScore: 30000 },
        { playerId: "player2", currentScore: 25000 },
        { playerId: "player3", currentScore: 20000 },
        { playerId: "player4", currentScore: 25000 },
      ];

      const result = calculateUmaOka(playerScores);

      expect(result).toHaveLength(4);
      expect(result[0].playerId).toBe("player1");
      expect(result[0].rank).toBe(1);
      expect(result[0].currentScore).toBe(30000);
      expect(result[0].oka).toBe(5000); // 30000 - 25000
      expect(result[0].uma).toBe(30000); // 30 × 1000
      expect(result[0].finalScore).toBe(50000); // 30000 - 30000 + 20000 + 30000 = 50000

      expect(result[1].playerId).toBe("player2");
      expect(result[1].rank).toBe(2);
      expect(result[1].currentScore).toBe(25000);
      expect(result[1].oka).toBe(5000);
      expect(result[1].uma).toBe(10000); // 10 × 1000
      expect(result[1].finalScore).toBe(5000); // 25000 - 30000 + 10000 = 5000

      expect(result[2].playerId).toBe("player4");
      expect(result[2].rank).toBe(3);
      expect(result[2].currentScore).toBe(25000);
      expect(result[2].oka).toBe(5000);
      expect(result[2].uma).toBe(-10000); // -10 × 1000
      expect(result[2].finalScore).toBe(-15000); // 25000 - 30000 - 10000 = -15000

      expect(result[3].playerId).toBe("player3");
      expect(result[3].rank).toBe(4);
      expect(result[3].currentScore).toBe(20000);
      expect(result[3].oka).toBe(5000);
      expect(result[3].uma).toBe(-30000); // -30 × 1000
      expect(result[3].finalScore).toBe(-40000); // 20000 - 30000 - 30000 = -40000
    });

    it("カスタム設定でウマオカを計算できる", () => {
      const playerScores: PlayerScore[] = [
        { playerId: "player1", currentScore: 30000 },
        { playerId: "player2", currentScore: 25000 },
        { playerId: "player3", currentScore: 20000 },
        { playerId: "player4", currentScore: 25000 },
      ];

      const result = calculateUmaOka(playerScores, {
        initialScore: 30000,
        returnScore: 30000,
        uma: [20, 10, -10, -20],
      });

      expect(result[0].oka).toBe(0); // 30000 - 30000
      expect(result[0].uma).toBe(20000); // 20 × 1000
      expect(result[0].finalScore).toBe(40000); // 30000 - 30000 + 20000 + 20000 = 40000
    });

    it("プレイヤーが4人でない場合はエラーを投げる", () => {
      const playerScores: PlayerScore[] = [
        { playerId: "player1", currentScore: 30000 },
        { playerId: "player2", currentScore: 25000 },
      ];

      expect(() => calculateUmaOka(playerScores)).toThrow("Player scores must contain exactly 4 players");
    });

    it("同点の場合、元の順序を維持する", () => {
      const playerScores: PlayerScore[] = [
        { playerId: "player1", currentScore: 25000 },
        { playerId: "player2", currentScore: 25000 },
        { playerId: "player3", currentScore: 25000 },
        { playerId: "player4", currentScore: 25000 },
      ];

      const result = calculateUmaOka(playerScores);

      expect(result[0].playerId).toBe("player1");
      expect(result[0].rank).toBe(1);
      expect(result[1].playerId).toBe("player2");
      expect(result[1].rank).toBe(2);
      expect(result[2].playerId).toBe("player3");
      expect(result[2].rank).toBe(3);
      expect(result[3].playerId).toBe("player4");
      expect(result[3].rank).toBe(4);
    });
  });
});

