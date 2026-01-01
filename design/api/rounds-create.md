# 局開始API

## 概要

新しい局を開始するAPIです。半荘内で局を開始し、親、本場、連荘、積み棒の情報を記録します。

## エンドポイント

```
POST /api/hanchans/:hanchanId/rounds
```

## リクエスト

### パスパラメータ

- `hanchanId`: UUID、必須、半荘ID

### リクエストボディ

```typescript
{
  "roundNumber": 1,
  "wind": "EAST",
  "dealerPlayerId": "参加者ID",
  "honba": 0,
  "riichiSticks": 0,
  "isRenchan": false
}
```

### バリデーション

- `roundNumber`: 整数、必須、1-16の範囲
- `wind`: 列挙型、必須、`EAST`、`SOUTH`、`WEST`、`NORTH`のいずれか
- `dealerPlayerId`: UUID、必須、半荘に参加している参加者ID
- `honba`: 整数、必須、0以上、デフォルト: 0
- `riichiSticks`: 整数、必須、0以上、デフォルト: 0
- `isRenchan`: 真偽値、必須、デフォルト: false

## レスポンス

### 成功レスポンス (201 Created)

```typescript
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "hanchanId": "半荘ID",
    "roundNumber": 1,
    "wind": "EAST",
    "dealerPlayerId": "参加者ID",
    "dealerPlayer": {
      "id": "参加者ID",
      "name": "参加者名"
    },
    "honba": 0,
    "riichiSticks": 0,
    "isRenchan": false,
    "status": "NOT_STARTED",
    "resultType": null,
    "specialDrawType": null,
    "startedAt": null,
    "endedAt": null,
    "createdAt": "2025-12-30T00:00:00.000Z",
    "updatedAt": "2025-12-30T00:00:00.000Z"
  }
}
```

### エラーレスポンス

#### 400 Bad Request

```typescript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "roundNumber must be between 1 and 16"
  }
}
```

#### 404 Not Found

```typescript
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Hanchan not found"
  }
}
```

#### 422 Unprocessable Entity

```typescript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "dealerPlayerId must be a player in the hanchan"
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
interface CreateRoundRequest {
  roundNumber: number;
  wind: "EAST" | "SOUTH" | "WEST" | "NORTH";
  dealerPlayerId: string;
  honba?: number;
  riichiSticks?: number;
  isRenchan?: boolean;
}

interface Round {
  id: string;
  hanchanId: string;
  roundNumber: number;
  wind: "EAST" | "SOUTH" | "WEST" | "NORTH";
  dealerPlayerId: string;
  dealerPlayer: {
    id: string;
    name: string;
  };
  honba: number;
  riichiSticks: number;
  isRenchan: boolean;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  resultType?: "TSUMO" | "RON" | "DRAW" | "NAGASHI_MANGAN" | "SPECIAL_DRAW";
  specialDrawType?: "FOUR_KAN" | "FOUR_WIND" | "NINE_TERMINALS";
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateRoundResponse {
  data: Round;
}
```

## バリデーション

- `roundNumber`は1-16の範囲である必要がある
- `wind`は`EAST`、`SOUTH`、`WEST`、`NORTH`のいずれかである必要がある
- `dealerPlayerId`は半荘に参加している参加者IDである必要がある
- `honba`は0以上である必要がある
- `riichiSticks`は0以上である必要がある
- 半荘が存在する必要がある
- 半荘のステータスが`IN_PROGRESS`である必要がある

## 実装メモ

- 局作成時に`status`は`NOT_STARTED`で初期化
- `startedAt`は局を開始する際に設定（別APIで更新）
- `honba`と`riichiSticks`は前の局から引き継ぐ場合がある
- `isRenchan`は前の局で親が上がった場合に`true`になる
- 半荘に参加している参加者IDであることを確認
- 局番号の重複チェック（同じ半荘内で同じ局番号が存在しないか）

