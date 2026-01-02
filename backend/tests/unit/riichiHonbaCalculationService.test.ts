import {
  calculateNextRiichiSticks,
  calculateNextHonba,
  calculateIsRenchan,
  calculateNextRoundSettings,
  calculateNextRoundNumber,
  calculateNextWind,
  isDealerRenchan,
} from "../../src/services/riichiHonbaCalculationService";
import { RoundResultType } from "../../src/types/round";

describe("riichiHonbaCalculationService", () => {
  describe("calculateNextRiichiSticks", () => {
    it("ツモの場合、積み棒を0にリセット", () => {
      const result = calculateNextRiichiSticks(3, RoundResultType.TSUMO);
      expect(result).toBe(0);
    });

    it("ロンの場合、積み棒を0にリセット", () => {
      const result = calculateNextRiichiSticks(2, RoundResultType.RON);
      expect(result).toBe(0);
    });

    it("流し満貫の場合、積み棒を0にリセット", () => {
      const result = calculateNextRiichiSticks(1, RoundResultType.NAGASHI_MANGAN);
      expect(result).toBe(0);
    });

    it("通常の流局の場合、積み棒を持ち越す", () => {
      const result = calculateNextRiichiSticks(3, RoundResultType.DRAW);
      expect(result).toBe(3);
    });

    it("特殊流局の場合、積み棒を持ち越す", () => {
      const result = calculateNextRiichiSticks(2, RoundResultType.SPECIAL_DRAW);
      expect(result).toBe(2);
    });

    it("積み棒が0の場合、流局でも0のまま", () => {
      const result = calculateNextRiichiSticks(0, RoundResultType.DRAW);
      expect(result).toBe(0);
    });
  });

  describe("calculateNextHonba", () => {
    it("親がツモした場合、本場を+1", () => {
      const result = calculateNextHonba(0, RoundResultType.TSUMO, true);
      expect(result).toBe(1);
    });

    it("親がロンした場合、本場を+1", () => {
      const result = calculateNextHonba(1, RoundResultType.RON, true);
      expect(result).toBe(2);
    });

    it("子がツモした場合、本場を0にリセット", () => {
      const result = calculateNextHonba(2, RoundResultType.TSUMO, false);
      expect(result).toBe(0);
    });

    it("子がロンした場合、本場を0にリセット", () => {
      const result = calculateNextHonba(1, RoundResultType.RON, false);
      expect(result).toBe(0);
    });

    it("流し満貫の場合、本場を0にリセット", () => {
      const result = calculateNextHonba(2, RoundResultType.NAGASHI_MANGAN, false);
      expect(result).toBe(0);
    });

    it("通常の流局で親がテンパイしている場合、本場を+1", () => {
      const result = calculateNextHonba(1, RoundResultType.DRAW, false, true);
      expect(result).toBe(2);
    });

    it("通常の流局で親がノーテンの場合、本場を+1", () => {
      const result = calculateNextHonba(1, RoundResultType.DRAW, false, false);
      expect(result).toBe(2);
    });

    it("通常の流局で親がノーテンの場合（isDealerTenpai未指定）、本場を+1", () => {
      const result = calculateNextHonba(1, RoundResultType.DRAW, false);
      expect(result).toBe(2);
    });

    it("特殊流局で親がテンパイしている場合、本場を+1", () => {
      const result = calculateNextHonba(1, RoundResultType.SPECIAL_DRAW, false, true);
      expect(result).toBe(2);
    });

    it("特殊流局で親がノーテンの場合、本場を+1", () => {
      const result = calculateNextHonba(1, RoundResultType.SPECIAL_DRAW, false, false);
      expect(result).toBe(2);
    });

    it("特殊流局で親がノーテンの場合（isDealerTenpai未指定）、本場を+1", () => {
      const result = calculateNextHonba(1, RoundResultType.SPECIAL_DRAW, false);
      expect(result).toBe(2);
    });

    it("本場が0の場合、親が上がっても1になる", () => {
      const result = calculateNextHonba(0, RoundResultType.TSUMO, true);
      expect(result).toBe(1);
    });

  });

  describe("calculateIsRenchan", () => {
    it("親が和了した場合、連荘になる", () => {
      const result = calculateIsRenchan(
        RoundResultType.TSUMO,
        true,
        undefined
      );
      expect(result).toBe(true);
    });

    it("子が和了した場合、連荘にならない", () => {
      const result = calculateIsRenchan(
        RoundResultType.TSUMO,
        false,
        undefined
      );
      expect(result).toBe(false);
    });

    it("テンパイ流局時に親がテンパイしていた場合、連荘になる", () => {
      const result = calculateIsRenchan(
        RoundResultType.DRAW,
        false,
        true
      );
      expect(result).toBe(true);
    });

    it("テンパイ流局時に親がノーテンの場合、連荘にならない", () => {
      const result = calculateIsRenchan(
        RoundResultType.DRAW,
        false,
        false
      );
      expect(result).toBe(false);
    });

    it("テンパイ流局時に親がテンパイしているか不明の場合、連荘にならない", () => {
      const result = calculateIsRenchan(
        RoundResultType.DRAW,
        false,
        undefined
      );
      expect(result).toBe(false);
    });

    it("特殊流局で親がテンパイしていた場合、連荘になる", () => {
      const result = calculateIsRenchan(
        RoundResultType.SPECIAL_DRAW,
        false,
        true
      );
      expect(result).toBe(true);
    });

    it("特殊流局で親がノーテンの場合、連荘にならない", () => {
      const result = calculateIsRenchan(
        RoundResultType.SPECIAL_DRAW,
        false,
        false
      );
      expect(result).toBe(false);
    });
  });

  describe("isDealerRenchan", () => {
    it("親が和了した場合、trueを返す", () => {
      const result = isDealerRenchan(RoundResultType.TSUMO, true, undefined);
      expect(result).toBe(true);
    });

    it("子が和了した場合、falseを返す", () => {
      const result = isDealerRenchan(RoundResultType.TSUMO, false, undefined);
      expect(result).toBe(false);
    });

    it("通常の流局で親がテンパイしていた場合、trueを返す", () => {
      const result = isDealerRenchan(RoundResultType.DRAW, false, true);
      expect(result).toBe(true);
    });

    it("通常の流局で親がノーテンの場合、falseを返す", () => {
      const result = isDealerRenchan(RoundResultType.DRAW, false, false);
      expect(result).toBe(false);
    });

    it("特殊流局で親がテンパイしていた場合、trueを返す", () => {
      const result = isDealerRenchan(RoundResultType.SPECIAL_DRAW, false, true);
      expect(result).toBe(true);
    });

    it("特殊流局で親がノーテンの場合、falseを返す", () => {
      const result = isDealerRenchan(RoundResultType.SPECIAL_DRAW, false, false);
      expect(result).toBe(false);
    });
  });

  describe("calculateNextRoundSettings", () => {
    it("親がツモした場合の次局設定を正しく計算する", () => {
      const result = calculateNextRoundSettings({
        currentRiichiSticks: 2,
        currentHonba: 1,
        resultType: RoundResultType.TSUMO,
        isDealerWinner: true,
      });

      expect(result.nextRiichiSticks).toBe(0);
      expect(result.nextHonba).toBe(2);
      expect(result.isRenchan).toBe(true);
    });

    it("子がツモした場合の次局設定を正しく計算する", () => {
      const result = calculateNextRoundSettings({
        currentRiichiSticks: 1,
        currentHonba: 2,
        resultType: RoundResultType.TSUMO,
        isDealerWinner: false,
      });

      expect(result.nextRiichiSticks).toBe(0);
      expect(result.nextHonba).toBe(0);
      expect(result.isRenchan).toBe(false);
    });

    it("親がロンした場合の次局設定を正しく計算する", () => {
      const result = calculateNextRoundSettings({
        currentRiichiSticks: 3,
        currentHonba: 0,
        resultType: RoundResultType.RON,
        isDealerWinner: true,
      });

      expect(result.nextRiichiSticks).toBe(0);
      expect(result.nextHonba).toBe(1);
      expect(result.isRenchan).toBe(true);
    });

    it("子がロンした場合の次局設定を正しく計算する", () => {
      const result = calculateNextRoundSettings({
        currentRiichiSticks: 2,
        currentHonba: 1,
        resultType: RoundResultType.RON,
        isDealerWinner: false,
      });

      expect(result.nextRiichiSticks).toBe(0);
      expect(result.nextHonba).toBe(0);
      expect(result.isRenchan).toBe(false);
    });

    it("流し満貫の場合の次局設定を正しく計算する", () => {
      const result = calculateNextRoundSettings({
        currentRiichiSticks: 1,
        currentHonba: 1,
        resultType: RoundResultType.NAGASHI_MANGAN,
        isDealerWinner: false,
      });

      expect(result.nextRiichiSticks).toBe(0);
      expect(result.nextHonba).toBe(0);
      expect(result.isRenchan).toBe(false);
    });

    it("通常の流局で親がテンパイしている場合の次局設定を正しく計算する", () => {
      const result = calculateNextRoundSettings({
        currentRiichiSticks: 2,
        currentHonba: 1,
        resultType: RoundResultType.DRAW,
        isDealerWinner: false,
        isDealerTenpai: true,
      });

      expect(result.nextRiichiSticks).toBe(2);
      expect(result.nextHonba).toBe(2);
      expect(result.isRenchan).toBe(true);
    });

    it("通常の流局で親がノーテンの場合の次局設定を正しく計算する", () => {
      const result = calculateNextRoundSettings({
        currentRiichiSticks: 1,
        currentHonba: 1,
        resultType: RoundResultType.DRAW,
        isDealerWinner: false,
        isDealerTenpai: false,
      });

      expect(result.nextRiichiSticks).toBe(1);
      expect(result.nextHonba).toBe(2);
      expect(result.isRenchan).toBe(false);
    });

    it("特殊流局で親がテンパイしている場合の次局設定を正しく計算する", () => {
      const result = calculateNextRoundSettings({
        currentRiichiSticks: 1,
        currentHonba: 1,
        resultType: RoundResultType.SPECIAL_DRAW,
        isDealerWinner: false,
        isDealerTenpai: true,
      });

      expect(result.nextRiichiSticks).toBe(1);
      expect(result.nextHonba).toBe(2);
      expect(result.isRenchan).toBe(true);
    });

    it("特殊流局で親がノーテンの場合の次局設定を正しく計算する", () => {
      const result = calculateNextRoundSettings({
        currentRiichiSticks: 1,
        currentHonba: 1,
        resultType: RoundResultType.SPECIAL_DRAW,
        isDealerWinner: false,
        isDealerTenpai: false,
      });

      expect(result.nextRiichiSticks).toBe(1);
      expect(result.nextHonba).toBe(2);
      expect(result.isRenchan).toBe(false);
    });
  });

  describe("calculateNextRoundNumber", () => {
    it("連荘の場合、現在の局番号を維持", () => {
      const result = calculateNextRoundNumber(3, true);
      expect(result).toBe(3);
    });

    it("連荘でない場合、局番号+1", () => {
      const result = calculateNextRoundNumber(3, false);
      expect(result).toBe(4);
    });

    it("連荘でない場合、最大16局まで", () => {
      const result = calculateNextRoundNumber(16, false);
      expect(result).toBe(16);
    });

    it("連荘でない場合、15局から16局へ", () => {
      const result = calculateNextRoundNumber(15, false);
      expect(result).toBe(16);
    });
  });

  describe("calculateNextWind", () => {
    it("連荘の場合、現在の風を維持（1-4局: 東）", () => {
      const result = calculateNextWind(3, true);
      expect(result).toBe("EAST");
    });

    it("連荘の場合、現在の風を維持（5-8局: 南）", () => {
      const result = calculateNextWind(6, true);
      expect(result).toBe("SOUTH");
    });

    it("連荘の場合、現在の風を維持（9-12局: 西）", () => {
      const result = calculateNextWind(10, true);
      expect(result).toBe("WEST");
    });

    it("連荘の場合、現在の風を維持（13-16局: 北）", () => {
      const result = calculateNextWind(14, true);
      expect(result).toBe("NORTH");
    });

    it("連荘でない場合、次の風（1局→2局: 東）", () => {
      const result = calculateNextWind(1, false);
      expect(result).toBe("EAST");
    });

    it("連荘でない場合、次の風（4局→5局: 南）", () => {
      const result = calculateNextWind(4, false);
      expect(result).toBe("SOUTH");
    });

    it("連荘でない場合、次の風（8局→9局: 西）", () => {
      const result = calculateNextWind(8, false);
      expect(result).toBe("WEST");
    });

    it("連荘でない場合、次の風（12局→13局: 北）", () => {
      const result = calculateNextWind(12, false);
      expect(result).toBe("NORTH");
    });

    it("連荘でない場合、16局からは東に戻る（16局→17局は存在しないが、計算上はEAST）", () => {
      const result = calculateNextWind(16, false);
      expect(result).toBe("EAST");
    });
  });
});

