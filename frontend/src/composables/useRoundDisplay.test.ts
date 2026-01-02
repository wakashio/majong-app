import { describe, it, expect } from "vitest";
import { getWindText, calculateRoundNumberInWind, getRoundLabel } from "./useRoundDisplay";
import { Wind } from "../types/round";
import type { Round } from "../types/round";

describe("useRoundDisplay", () => {
  describe("getWindText", () => {
    it("東を正しく返す", () => {
      expect(getWindText(Wind.EAST)).toBe("東");
    });

    it("南を正しく返す", () => {
      expect(getWindText(Wind.SOUTH)).toBe("南");
    });

    it("西を正しく返す", () => {
      expect(getWindText(Wind.WEST)).toBe("西");
    });

    it("北を正しく返す", () => {
      expect(getWindText(Wind.NORTH)).toBe("北");
    });
  });

  describe("calculateRoundNumberInWind", () => {
    it("局番号1-4は風内局番号1-4を返す", () => {
      expect(calculateRoundNumberInWind(1)).toBe(1);
      expect(calculateRoundNumberInWind(2)).toBe(2);
      expect(calculateRoundNumberInWind(3)).toBe(3);
      expect(calculateRoundNumberInWind(4)).toBe(4);
    });

    it("局番号5-8は風内局番号1-4を返す", () => {
      expect(calculateRoundNumberInWind(5)).toBe(1);
      expect(calculateRoundNumberInWind(6)).toBe(2);
      expect(calculateRoundNumberInWind(7)).toBe(3);
      expect(calculateRoundNumberInWind(8)).toBe(4);
    });

    it("局番号9-12は風内局番号1-4を返す", () => {
      expect(calculateRoundNumberInWind(9)).toBe(1);
      expect(calculateRoundNumberInWind(10)).toBe(2);
      expect(calculateRoundNumberInWind(11)).toBe(3);
      expect(calculateRoundNumberInWind(12)).toBe(4);
    });

    it("局番号13-16は風内局番号1-4を返す", () => {
      expect(calculateRoundNumberInWind(13)).toBe(1);
      expect(calculateRoundNumberInWind(14)).toBe(2);
      expect(calculateRoundNumberInWind(15)).toBe(3);
      expect(calculateRoundNumberInWind(16)).toBe(4);
    });
  });

  describe("getRoundLabel", () => {
    it("局のラベルを正しく生成する", () => {
      const round: Round = {
        id: "test-round-1",
        hanchanId: "test-hanchan-1",
        roundNumber: 1,
        wind: Wind.EAST,
        honba: 0,
        riichiSticks: 0,
        resultType: null,
        dealerPlayerId: "player-1",
        dealerPlayer: {
          id: "player-1",
          name: "Player 1",
        },
        specialDrawType: null,
        startedAt: null,
        endedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const label = getRoundLabel(round);
      expect(label).toBe("東1局0本場");
    });

    it("本場が1の場合も正しく生成する", () => {
      const round: Round = {
        id: "test-round-2",
        hanchanId: "test-hanchan-1",
        roundNumber: 2,
        wind: Wind.EAST,
        honba: 1,
        dealerPlayer: {
          id: "player-1",
          name: "Player 1",
        },
        specialDrawType: null,
        startedAt: null,
        endedAt: null,
        updatedAt: new Date().toISOString(),
        riichiSticks: 0,
        resultType: null,
        dealerPlayerId: "player-1",
        createdAt: new Date().toISOString(),
      };

      const label = getRoundLabel(round);
      expect(label).toBe("東2局1本場");
    });
  });
});

