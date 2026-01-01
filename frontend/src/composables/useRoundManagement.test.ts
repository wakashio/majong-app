import { describe, it, expect } from "vitest";
import { calculateWindFromRoundNumber, getNextRoundNumber } from "./useRoundManagement";
import { Wind } from "../types/round";
import type { Round } from "../types/round";

describe("useRoundManagement", () => {
  describe("calculateWindFromRoundNumber", () => {
    it("局番号1-4は東を返す", () => {
      expect(calculateWindFromRoundNumber(1)).toBe(Wind.EAST);
      expect(calculateWindFromRoundNumber(2)).toBe(Wind.EAST);
      expect(calculateWindFromRoundNumber(3)).toBe(Wind.EAST);
      expect(calculateWindFromRoundNumber(4)).toBe(Wind.EAST);
    });

    it("局番号5-8は南を返す", () => {
      expect(calculateWindFromRoundNumber(5)).toBe(Wind.SOUTH);
      expect(calculateWindFromRoundNumber(6)).toBe(Wind.SOUTH);
      expect(calculateWindFromRoundNumber(7)).toBe(Wind.SOUTH);
      expect(calculateWindFromRoundNumber(8)).toBe(Wind.SOUTH);
    });

    it("局番号9-12は西を返す", () => {
      expect(calculateWindFromRoundNumber(9)).toBe(Wind.WEST);
      expect(calculateWindFromRoundNumber(10)).toBe(Wind.WEST);
      expect(calculateWindFromRoundNumber(11)).toBe(Wind.WEST);
      expect(calculateWindFromRoundNumber(12)).toBe(Wind.WEST);
    });

    it("局番号13-16は北を返す", () => {
      expect(calculateWindFromRoundNumber(13)).toBe(Wind.NORTH);
      expect(calculateWindFromRoundNumber(14)).toBe(Wind.NORTH);
      expect(calculateWindFromRoundNumber(15)).toBe(Wind.NORTH);
      expect(calculateWindFromRoundNumber(16)).toBe(Wind.NORTH);
    });

    it("範囲外の局番号は東を返す", () => {
      expect(calculateWindFromRoundNumber(0)).toBe(Wind.EAST);
      expect(calculateWindFromRoundNumber(17)).toBe(Wind.EAST);
    });
  });

  describe("getNextRoundNumber", () => {
    it("空の配列の場合は1を返す", () => {
      const rounds: Round[] = [];
      expect(getNextRoundNumber(rounds)).toBe(1);
    });

    it("最大の局番号+1を返す", () => {
      const rounds: Round[] = [
        {
          id: "round-1",
          hanchanId: "hanchan-1",
          roundNumber: 1,
          wind: Wind.EAST,
          honba: 0,
          riichiSticks: 0,
          resultType: null,
          dealerPlayerId: "player-1",
          createdAt: new Date().toISOString(),
        },
        {
          id: "round-2",
          hanchanId: "hanchan-1",
          roundNumber: 3,
          wind: Wind.EAST,
          honba: 0,
          riichiSticks: 0,
          resultType: null,
          dealerPlayerId: "player-1",
          createdAt: new Date().toISOString(),
        },
      ];
      expect(getNextRoundNumber(rounds)).toBe(4);
    });
  });
});

