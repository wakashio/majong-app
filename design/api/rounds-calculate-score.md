# 打点計算API

## 概要

局の打点を計算するAPIです。ツモ、ロン、流局の結果に基づいて、各参加者の打点を自動計算します。

## エンドポイント

```
POST /api/rounds/:id/calculate-score
```

## リクエスト

### パスパラメータ

- `id`: UUID、必須、局ID

### リクエストボディ

```typescript
{
  "resultType": "TSUMO",
  "winnerPlayerId": "参加者ID",
  "ronTargetPlayerId"?: "参加者ID",
  "han": 1,
  "fu": 30,
  "yaku": ["リーチ", "ツモ"],
  "isNagashiMangan": false
}
```

### バリデーション

- `resultType`: 列挙型、必須、`TSUMO`、`RON`、`DRAW`、`NAGASHI_MANGAN`、`SPECIAL_DRAW`のいずれか
- `winnerPlayerId`: UUID、オプション、`resultType`が`TSUMO`または`RON`の場合は必須、局に参加している参加者ID
- `ronTargetPlayerId`: UUID、オプション、`resultType`が`RON`の場合は必須、局に参加している参加者ID
- `han`: 整数、オプション、`resultType`が`TSUMO`または`RON`の場合は必須、1以上
- `fu`: 整数、オプション、`resultType`が`TSUMO`または`RON`の場合は必須、20以上
- `yaku`: 文字列配列、オプション、役のリスト
- `isNagashiMangan`: 真偽値、オプション、`resultType`が`DRAW`の場合に流し満貫かどうか

## レスポンス

### 成功レスポンス (200 OK)

```typescript
{
  "data": {
    "scores": [
      {
        "playerId": "参加者ID",
        "scoreChange": 1000,
        "isDealer": false,
        "isWinner": true,
        "isRonTarget": null,
        "han": 1,
        "fu": 30,
        "yaku": ["リーチ", "ツモ"],
        "calculatedScore": 1000
      },
      // ... 他の参加者の打点記録
    ],
    "totalRiichiSticks": 0,
    "totalHonba": 0
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
interface CalculateScoreRequest {
  resultType: "TSUMO" | "RON" | "DRAW" | "NAGASHI_MANGAN" | "SPECIAL_DRAW";
  winnerPlayerId?: string;
  ronTargetPlayerId?: string;
  han?: number;
  fu?: number;
  yaku?: string[];
  isNagashiMangan?: boolean;
}

interface CalculatedScore {
  playerId: string;
  scoreChange: number;
  isDealer: boolean;
  isWinner: boolean;
  isRonTarget?: boolean;
  han?: number;
  fu?: number;
  yaku?: string[];
  calculatedScore: number;
}

interface CalculateScoreResponse {
  data: {
    scores: CalculatedScore[];
    totalRiichiSticks: number;
    totalHonba: number;
  };
}
```

## バリデーション

- `resultType`は必須
- `resultType`が`TSUMO`または`RON`の場合、`winnerPlayerId`、`han`、`fu`が必須
- `resultType`が`RON`の場合、`ronTargetPlayerId`が必須
- `winnerPlayerId`と`ronTargetPlayerId`は局に参加している参加者IDである必要がある
- 局が存在する必要がある
- 局のステータスが`IN_PROGRESS`である必要がある

## 実装メモ

- 打点計算ロジックは`backend/src/services/scoreCalculationService.ts`に実装
- 親子の判定、本場、積み棒を考慮した打点計算
- ツモの場合は和了者以外全員から点数を徴収
- ロンの場合は放銃者のみから点数を徴収
- 流局の場合は点数変動なし（0）
- 流し満貫の場合は各参加者から2000点を徴収
- 特殊流局の場合は点数変動なし（0）
- 計算結果は`Score`エンティティの形式で返却

