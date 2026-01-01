import {
  calculateBaseScore,
  calculateTsumoScore,
  calculateRonScore,
  calculateDrawScore,
  calculateScore,
} from "../../src/services/scoreCalculationService";
import { RoundResultType } from "../../src/types/round";

describe("scoreCalculationService", () => {
  describe("calculateBaseScore", () => {
    it("基本点を正しく計算する（1飜30符）", () => {
      const result = calculateBaseScore(1, 30);
      // 30 × 2^(1+2) = 30 × 8 = 240 → 1000点未満なので切り上げ
      expect(result).toBe(300);
    });

    it("基本点を正しく計算する（2飜30符）", () => {
      const result = calculateBaseScore(2, 30);
      // 30 × 2^(2+2) = 30 × 16 = 480 → 1000点未満なので切り上げ
      expect(result).toBe(500);
    });

    it("基本点を正しく計算する（3飜30符）", () => {
      const result = calculateBaseScore(3, 30);
      // 30 × 2^(3+2) = 30 × 32 = 960 → 1000点未満なので切り上げ
      expect(result).toBe(1000);
    });

    it("基本点を正しく計算する（3飜40符）", () => {
      const result = calculateBaseScore(3, 40);
      // 40 × 2^(3+2) = 40 × 32 = 1280（1000点以上なので切り上げなし）
      expect(result).toBe(1280);
    });

    it("満貫を正しく計算する（5飜）", () => {
      const result = calculateBaseScore(5, 30);
      expect(result).toBe(2000);
    });

    it("満貫を正しく計算する（4飜40符）", () => {
      const result = calculateBaseScore(4, 40);
      expect(result).toBe(2000);
    });

    it("満貫を正しく計算する（3飜70符）", () => {
      const result = calculateBaseScore(3, 70);
      expect(result).toBe(2000);
    });

    it("跳満を正しく計算する（6飜）", () => {
      const result = calculateBaseScore(6, 30);
      expect(result).toBe(3000);
    });

    it("倍満を正しく計算する（8飜）", () => {
      const result = calculateBaseScore(8, 30);
      expect(result).toBe(4000);
    });

    it("三倍満を正しく計算する（11飜）", () => {
      const result = calculateBaseScore(11, 30);
      expect(result).toBe(6000);
    });

    it("役満を正しく計算する（13飜）", () => {
      const result = calculateBaseScore(13, 30);
      expect(result).toBe(8000);
    });

    it("無効な飜数でエラーを投げる", () => {
      expect(() => calculateBaseScore(0, 30)).toThrow("han must be 1 or greater");
    });

    it("無効な符でエラーを投げる", () => {
      expect(() => calculateBaseScore(1, 19)).toThrow("fu must be 20 or greater");
    });
  });

  describe("calculateTsumoScore", () => {
    it("親がツモした場合の打点を正しく計算する", () => {
      const result = calculateTsumoScore(6000, 0, 0, true);
      // 入力点数 x = 6000（積み棒を含まない）
      // 子1人あたりの支払い: x/3 + 100*本場 = 6000/3 + 0 = 2000
      // 親の受け取り: 支払いの合計 + 積み棒 = 2000 × 3 + 0 = 6000
      expect(result.winnerScore).toBe(6000);
      expect(result.loserScores.fromDealer).toBe(0);
      expect(result.loserScores.fromNonDealer).toBe(2000);
    });

    it("親がツモした場合の打点を正しく計算する（本場あり）", () => {
      const result = calculateTsumoScore(6000, 1, 0, true);
      // 入力点数 x = 6000（積み棒を含まない）
      // 子1人あたりの支払い: x/3 + 100*本場 = 6000/3 + 100 = 2100
      // 親の受け取り: 支払いの合計 + 積み棒 = 2100 × 3 + 0 = 6300
      expect(result.winnerScore).toBe(6300);
      expect(result.loserScores.fromDealer).toBe(0);
      expect(result.loserScores.fromNonDealer).toBe(2100);
    });

    it("親がツモした場合の打点を正しく計算する（積み棒あり）", () => {
      const result = calculateTsumoScore(6000, 0, 1, true);
      // 入力点数 x = 6000（積み棒を含まない）
      // 子1人あたりの支払い: x/3 + 100*本場 = 6000/3 + 0 = 2000
      // 親の受け取り: 支払いの合計 + 積み棒 = 2000 × 3 + 1000 = 7000
      expect(result.winnerScore).toBe(7000);
      expect(result.loserScores.fromDealer).toBe(0);
      expect(result.loserScores.fromNonDealer).toBe(2000);
    });

    it("子がツモした場合の打点を正しく計算する", () => {
      const result = calculateTsumoScore(4000, 0, 0, false);
      // 入力点数 x = 4000（積み棒を含まない）
      // 子の支払い: x/4 + 100*本場 = 4000/4 + 0 = 1000
      // 親の支払い: x/4*2 + 100*本場 = 4000/4*2 + 0 = 2000
      // 子（和了者）の受け取り: 支払いの合計 + 積み棒 = 2000 + 1000 × 2 + 0 = 4000
      expect(result.winnerScore).toBe(4000);
      expect(result.loserScores.fromDealer).toBe(2000);
      expect(result.loserScores.fromNonDealer).toBe(1000);
    });

    it("子がツモした場合の打点を正しく計算する（本場あり）", () => {
      const result = calculateTsumoScore(4000, 1, 0, false);
      // 入力点数 x = 4000（積み棒を含まない）
      // 子の支払い: x/4 + 100*本場 = 4000/4 + 100 = 1100
      // 親の支払い: x/4*2 + 100*本場 = 4000/4*2 + 100 = 2100
      // 子（和了者）の受け取り: 支払いの合計 + 積み棒 = 2100 + 1100 × 2 + 0 = 4300
      expect(result.winnerScore).toBe(4300);
      expect(result.loserScores.fromDealer).toBe(2100);
      expect(result.loserScores.fromNonDealer).toBe(1100);
    });

    it("子がツモした場合の打点を正しく計算する（積み棒あり）", () => {
      const result = calculateTsumoScore(4000, 0, 1, false);
      // 入力点数 x = 4000（積み棒を含まない）
      // 子の支払い: x/4 + 100*本場 = 4000/4 + 0 = 1000
      // 親の支払い: x/4*2 + 100*本場 = 4000/4*2 + 0 = 2000
      // 子（和了者）の受け取り: 支払いの合計 + 積み棒 = 2000 + 1000 × 2 + 1000 = 5000
      expect(result.winnerScore).toBe(5000);
      expect(result.loserScores.fromDealer).toBe(2000);
      expect(result.loserScores.fromNonDealer).toBe(1000);
    });
  });

  describe("calculateRonScore", () => {
    it("親がロンした場合の打点を正しく計算する", () => {
      const result = calculateRonScore(6000, 0, 0, true, false);
      // 入力点数 x = 6000（積み棒を含まない）
      // 放銃者の支払い: x = 6000
      // 親の受け取り: 支払いの合計 + 積み棒 = 6000 + 0 = 6000
      expect(result.winnerScore).toBe(6000);
      expect(result.loserScore).toBe(6000);
    });

    it("親がロンした場合の打点を正しく計算する（積み棒あり）", () => {
      const result = calculateRonScore(6000, 0, 1, true, false);
      // 入力点数 x = 6000（積み棒を含まない）
      // 放銃者の支払い: x = 6000
      // 親の受け取り: 支払いの合計 + 積み棒 = 6000 + 1000 = 7000
      expect(result.winnerScore).toBe(7000);
      expect(result.loserScore).toBe(6000);
    });

    it("子が親からロンした場合の打点を正しく計算する", () => {
      const result = calculateRonScore(6000, 0, 0, false, true);
      // 入力点数 x = 6000（積み棒を含まない）
      // 放銃者の支払い: x = 6000
      // 子の受け取り: 支払いの合計 + 積み棒 = 6000 + 0 = 6000
      expect(result.winnerScore).toBe(6000);
      expect(result.loserScore).toBe(6000);
    });

    it("子が子からロンした場合の打点を正しく計算する", () => {
      const result = calculateRonScore(4000, 0, 0, false, false);
      // 入力点数 x = 4000（積み棒を含まない）
      // 放銃者の支払い: x = 4000
      // 子の受け取り: 支払いの合計 + 積み棒 = 4000 + 0 = 4000
      expect(result.winnerScore).toBe(4000);
      expect(result.loserScore).toBe(4000);
    });

    it("子が子からロンした場合の打点を正しく計算する（積み棒あり）", () => {
      const result = calculateRonScore(4000, 0, 1, false, false);
      // 入力点数 x = 4000（積み棒を含まない）
      // 放銃者の支払い: x = 4000
      // 子の受け取り: 支払いの合計 + 積み棒 = 4000 + 1000 = 5000
      expect(result.winnerScore).toBe(5000);
      expect(result.loserScore).toBe(4000);
    });
  });

  describe("calculateDrawScore", () => {
    it("通常の流局の打点を正しく計算する", () => {
      const result = calculateDrawScore(RoundResultType.DRAW, false);
      expect(result.scores).toEqual([0, 0, 0, 0]);
    });

    it("特殊流局の打点を正しく計算する", () => {
      const result = calculateDrawScore(RoundResultType.SPECIAL_DRAW, false);
      expect(result.scores).toEqual([0, 0, 0, 0]);
    });

    it("流し満貫の打点を正しく計算する", () => {
      const result = calculateDrawScore(RoundResultType.DRAW, true);
      expect(result.scores).toEqual([-2000, -2000, -2000, -2000]);
    });

    it("流し満貫の打点を正しく計算する（NAGASHI_MANGAN）", () => {
      const result = calculateDrawScore(RoundResultType.NAGASHI_MANGAN, false);
      expect(result.scores).toEqual([-2000, -2000, -2000, -2000]);
    });
  });

  describe("calculateScore", () => {
    const playerIds = ["player1", "player2", "player3", "player4"];
    const dealerPlayerId = "player1";

    it("ツモ（親）の打点を正しく計算する", () => {
      const result = calculateScore({
        resultType: RoundResultType.TSUMO,
        winnerPlayerId: "player1",
        winnerScore: 6000,
        yaku: ["リーチ", "ツモ"],
        dealerPlayerId,
        playerIds,
        honba: 0,
        riichiSticks: 0,
      });

      expect(result).toHaveLength(4);
      const winner = result.find((r) => r.isWinner);
      expect(winner).toBeDefined();
      expect(winner?.scoreChange).toBe(6000);
      expect(winner?.yaku).toEqual(["リーチ", "ツモ"]);

      const losers = result.filter((r) => !r.isWinner);
      expect(losers).toHaveLength(3);
      losers.forEach((loser) => {
        expect(loser.scoreChange).toBe(-2000);
      });
    });

    it("ツモ（子）の打点を正しく計算する", () => {
      const result = calculateScore({
        resultType: RoundResultType.TSUMO,
        winnerPlayerId: "player2",
        winnerScore: 4000,
        yaku: ["リーチ"],
        dealerPlayerId,
        playerIds,
        honba: 0,
        riichiSticks: 0,
      });

      expect(result).toHaveLength(4);
      const winner = result.find((r) => r.isWinner);
      expect(winner).toBeDefined();
      expect(winner?.playerId).toBe("player2");
      expect(winner?.scoreChange).toBe(4000);

      const dealer = result.find((r) => r.isDealer && !r.isWinner);
      expect(dealer).toBeDefined();
      expect(dealer?.scoreChange).toBe(-2000);

      const nonDealerLosers = result.filter((r) => !r.isDealer && !r.isWinner);
      expect(nonDealerLosers).toHaveLength(2);
      nonDealerLosers.forEach((loser) => {
        expect(loser.scoreChange).toBe(-1000);
      });
    });

    it("ロン（親）の打点を正しく計算する", () => {
      const result = calculateScore({
        resultType: RoundResultType.RON,
        winnerPlayerId: "player1",
        ronTargetPlayerId: "player2",
        winnerScore: 6000,
        yaku: ["リーチ"],
        dealerPlayerId,
        playerIds,
        honba: 0,
        riichiSticks: 0,
      });

      expect(result).toHaveLength(4);
      const winner = result.find((r) => r.isWinner);
      expect(winner).toBeDefined();
      expect(winner?.scoreChange).toBe(6000);

      const ronTarget = result.find((r) => r.isRonTarget);
      expect(ronTarget).toBeDefined();
      expect(ronTarget?.scoreChange).toBe(-6000);

      const others = result.filter((r) => !r.isWinner && !r.isRonTarget);
      expect(others).toHaveLength(2);
      others.forEach((other) => {
        expect(other.scoreChange).toBe(0);
      });
    });

    it("ロン（子）の打点を正しく計算する", () => {
      const result = calculateScore({
        resultType: RoundResultType.RON,
        winnerPlayerId: "player2",
        ronTargetPlayerId: "player3",
        winnerScore: 4000,
        yaku: ["リーチ"],
        dealerPlayerId,
        playerIds,
        honba: 0,
        riichiSticks: 0,
      });

      expect(result).toHaveLength(4);
      const winner = result.find((r) => r.isWinner);
      expect(winner).toBeDefined();
      expect(winner?.playerId).toBe("player2");
      expect(winner?.scoreChange).toBe(4000);

      const ronTarget = result.find((r) => r.isRonTarget);
      expect(ronTarget).toBeDefined();
      expect(ronTarget?.playerId).toBe("player3");
      expect(ronTarget?.scoreChange).toBe(-4000);
    });

    it("流局の打点を正しく計算する", () => {
      const result = calculateScore({
        resultType: RoundResultType.DRAW,
        dealerPlayerId,
        playerIds,
        honba: 0,
        riichiSticks: 0,
      });

      expect(result).toHaveLength(4);
      result.forEach((r) => {
        expect(r.scoreChange).toBe(0);
        expect(r.isWinner).toBe(false);
      });
    });

    it("流し満貫の打点を正しく計算する", () => {
      const result = calculateScore({
        resultType: RoundResultType.NAGASHI_MANGAN,
        dealerPlayerId,
        playerIds,
        honba: 0,
        riichiSticks: 0,
      });

      expect(result).toHaveLength(4);
      result.forEach((r) => {
        expect(r.scoreChange).toBe(-2000);
        expect(r.isWinner).toBe(false);
      });
    });

    it("無効なwinnerPlayerIdでエラーを投げる", () => {
      expect(() =>
        calculateScore({
          resultType: RoundResultType.TSUMO,
          winnerPlayerId: "invalid",
          winnerScore: 6000,
          dealerPlayerId,
          playerIds,
          honba: 0,
          riichiSticks: 0,
        })
      ).toThrow("winnerPlayerId must be a player in the round");
    });

    it("必須パラメータが不足している場合にエラーを投げる", () => {
      expect(() =>
        calculateScore({
          resultType: RoundResultType.TSUMO,
          dealerPlayerId,
          playerIds,
          honba: 0,
          riichiSticks: 0,
        })
      ).toThrow("winnerPlayerId and winnerScore are required for TSUMO or RON");
    });

    it("ロンでronTargetPlayerIdが不足している場合にエラーを投げる", () => {
      expect(() =>
        calculateScore({
          resultType: RoundResultType.RON,
          winnerPlayerId: "player1",
          winnerScore: 6000,
          dealerPlayerId,
          playerIds,
          honba: 0,
          riichiSticks: 0,
        })
      ).toThrow("ronTargetPlayerId is required for RON");
    });
  });
});

