# 次局設定計算API

## 概要

局終了時に次局の積み棒・本場・連荘・局番号・風を計算するAPIです。局終了APIの一部として使用されます。

## エンドポイント

```
POST /api/rounds/:id/calculate-next-settings
```

## リクエスト

### パスパラメータ

- `id`: UUID、必須、局ID

### リクエストボディ

```typescript
{
  "resultType": "TSUMO",
  "winnerPlayerId": "参加者ID",
  "isDealerTenpai": false
}
```

### バリデーション

- `resultType`: 列挙型、必須、`TSUMO`、`RON`、`DRAW`、`NAGASHI_MANGAN`、`SPECIAL_DRAW`のいずれか
- `winnerPlayerId`: UUID、オプション、`resultType`が`TSUMO`または`RON`の場合は必須、局に参加している参加者ID
- `isDealerTenpai`: 真偽値、オプション、`resultType`が`DRAW`の場合に親がテンパイしているかどうか

## レスポンス

### 成功レスポンス (200 OK)

```typescript
{
  "data": {
    "nextRiichiSticks": 0,
    "nextHonba": 1,
    "isRenchan": true,
    "nextRoundNumber": 2,
    "nextWind": "EAST"
  }
}
```

### エラーレスポンス

#### 400 Bad Request

```typescript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "resultType is required"
  }
}
```

#### 404 Not Found

```typescript
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Round not found"
  }
}
```

#### 422 Unprocessable Entity

```typescript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "winnerPlayerId must be a player in the round"
  }
}
```

#### 500 Internal Server Error

```typescript
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Internal server error"
  }
}
```

## 型定義

```typescript
interface CalculateNextSettingsRequest {
  resultType: "TSUMO" | "RON" | "DRAW" | "NAGASHI_MANGAN" | "SPECIAL_DRAW";
  winnerPlayerId?: string;
  isDealerTenpai?: boolean;
}

interface CalculateNextSettingsResponse {
  data: {
    nextRiichiSticks: number;
    nextHonba: number;
    isRenchan: boolean;
    nextRoundNumber: number;
    nextWind: "EAST" | "SOUTH" | "WEST" | "NORTH";
  };
}
```

## バリデーション

- `resultType`は必須
- `resultType`が`TSUMO`または`RON`の場合、`winnerPlayerId`が必須
- `winnerPlayerId`は局に参加している参加者IDである必要がある
- 局が存在する必要がある
- 局のステータスが`IN_PROGRESS`または`COMPLETED`である必要がある

## 実装メモ

- 積み棒・本場・連荘の計算ロジックは`backend/src/services/riichiHonbaCalculationService.ts`に実装
- 局番号・風の計算は`roundController.ts`の`calculateNextSettings`で実装
- 局終了API（`PUT /api/rounds/:id/end`）の一部として使用される
- 局終了時に次局の設定を計算し、次局作成時に使用する
- 計算結果は次局作成時に`CreateRoundRequest`の`roundNumber`、`wind`、`honba`、`riichiSticks`、`isRenchan`として使用される
- 連荘の判定:
  - 親が和了した場合（`isDealerWinner === true`）→ 連荘
  - テンパイ流局時に親がテンパイしていた場合（`resultType === DRAW && isDealerTenpai === true`）→ 連荘
- 次の局の番号・風の計算:
  - 連荘の場合: 現在の局番号と風を維持
  - 連荘でない場合: 局番号+1（最大16局まで）、風は次の風（1-4: 東、5-8: 南、9-12: 西、13-16: 北）

## 関連ドキュメント

- `design/riichi-honba-calculation-logic.md`: 積み棒・本場の計算ロジック設計書
- `design/api/rounds-end.md`: 局終了API
- `design/api/rounds-create.md`: 局開始API

