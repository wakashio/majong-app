# 局更新API

## 概要

局情報を更新するAPIです。局のステータス、本場、積み棒などの情報を更新します。

## エンドポイント

```
PUT /api/rounds/:id
```

## リクエスト

### パスパラメータ

- `id`: UUID、必須、局ID

### リクエストボディ

```typescript
{
  "honba"?: number,
  "riichiSticks"?: number,
  "isRenchan"?: boolean,
  "dealerPlayerId"?: string,
  "startedAt"?: string,
  "endedAt"?: string
}
```

### バリデーション

- `honba`: 整数、オプション、0以上
- `riichiSticks`: 整数、オプション、0以上
- `isRenchan`: 真偽値、オプション
- `dealerPlayerId`: UUID、オプション、半荘に参加している参加者ID
- `startedAt`: 日時文字列、オプション、局開始日時
- `endedAt`: 日時文字列、オプション、局終了日時

## レスポンス

### 成功レスポンス (200 OK)

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
    "resultType": null,
    "specialDrawType": null,
    "startedAt": "2025-12-30T00:00:00.000Z",
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
    "message": "Invalid status value"
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
interface UpdateRoundRequest {
  honba?: number;
  riichiSticks?: number;
  isRenchan?: boolean;
  dealerPlayerId?: string;
  startedAt?: string;
  endedAt?: string;
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
  resultType?: "TSUMO" | "RON" | "DRAW" | "NAGASHI_MANGAN" | "SPECIAL_DRAW";
  specialDrawType?: "FOUR_KAN" | "FOUR_WIND" | "NINE_TERMINALS";
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface UpdateRoundResponse {
  data: Round;
}
```

## バリデーション

- `honba`は0以上
- `riichiSticks`は0以上
- `dealerPlayerId`が指定された場合、半荘に参加している参加者IDである必要がある
- `startedAt`と`endedAt`は有効な日時文字列である必要がある

## 実装メモ

- 本場、積み棒の更新
- 連荘フラグの更新
- 親の変更（必要に応じて）
- `startedAt`と`endedAt`の更新
- 局が存在しない場合は404エラーを返す
- 局の状態は`startedAt`と`endedAt`から判定する（クライアント側で計算）

