import { describe, it, expect } from "vitest";
import { calculateRoundNumberInWind } from "../composables/useRoundDisplay";

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

  it("東4局の次（局番号5）は風内局番号1を返す", () => {
    // 東4局の次は南1局（局番号5、風内局番号1）
    expect(calculateRoundNumberInWind(5)).toBe(1);
  });
});

