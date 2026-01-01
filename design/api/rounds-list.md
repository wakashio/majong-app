# 局一覧取得API

## 概要

指定された半荘の局一覧を取得するAPIです。

## エンドポイント

```
GET /api/hanchans/:hanchanId/rounds
```

## リクエスト

### パスパラメータ

- `hanchanId`: UUID、必須、半荘ID

### クエリパラメータ

- （なし）

## レスポンス

### 成功レスポンス (200 OK)

```typescript
{
  "data": [
    {
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
      "startedAt": null,
      "endedAt": null,
      "createdAt": "2025-12-30T00:00:00.000Z",
      "updatedAt": "2025-12-30T00:00:00.000Z"
    },
    // ... 他の局
  ]
}
```

### エラーレスポンス

#### 404 Not Found

```typescript
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Hanchan not found"
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

interface ListRoundsResponse {
  data: Round[];
}
```

## バリデーション

- `hanchanId`はUUID形式である必要がある
- `hanchanId`に対応する半荘が存在する必要がある

## 実装メモ

- 全局を取得
- `dealerPlayer`情報を含めて取得（JOIN）
- 局番号の昇順でソート
- 半荘が存在しない場合は404エラーを返す
- 局の状態は`startedAt`と`endedAt`から判定する（クライアント側で計算）

