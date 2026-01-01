import { describe, it, expect } from "vitest";
import { getRiichiPlayers } from "./useScoreCalculation";

describe("useScoreCalculation", () => {
  describe("getRiichiPlayers", () => {
    it("リーチアクションがない場合は空配列を返す", () => {
      const getAllActions = () => [];
      expect(getRiichiPlayers("round-1", getAllActions)).toEqual([]);
    });

    it("リーチアクションがある場合はプレイヤーIDの配列を返す", () => {
      const getAllActions = () => [
        { type: "RIICHI", playerId: "player-1" },
        { type: "NAKI", playerId: "player-2" },
        { type: "RIICHI", playerId: "player-3" },
      ];
      expect(getRiichiPlayers("round-1", getAllActions)).toEqual(["player-1", "player-3"]);
    });

    it("roundIdがnullの場合は空配列を返す", () => {
      const getAllActions = () => [{ type: "RIICHI", playerId: "player-1" }];
      expect(getRiichiPlayers(null, getAllActions)).toEqual([]);
    });
  });
});

