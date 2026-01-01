# 半荘詳細取得API

## 概要

指定されたIDの半荘の詳細情報を取得するAPIです。

## エンドポイント

```
GET /api/hanchans/:id
```

## リクエスト

### パスパラメータ

- `id`: UUID、必須、半荘ID

## レスポンス

### 成功レスポンス (200 OK)

```typescript
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "半荘名",
    "startedAt": "2025-12-30T00:00:00.000Z",
    "endedAt": null,
    "status": "IN_PROGRESS",
    "createdAt": "2025-12-30T00:00:00.000Z",
    "updatedAt": "2025-12-30T00:00:00.000Z",
    "hanchanPlayers": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "playerId": "参加者ID1",
        "player": {
          "id": "参加者ID1",
          "name": "参加者名1"
        },
        "seatPosition": 0,
        "initialScore": 25000,
        "finalScore": null
      },
      // ... 他の参加者
    ],
    "rounds": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440010",
        "roundNumber": 1,
        "wind": "EAST",
        "status": "COMPLETED",
        "dealerPlayerId": "参加者ID1",
        "honba": 0,
        "riichiSticks": 0
      },
      // ... 他の局
    ]
  }
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
interface HanchanPlayer {
  id: string;
  playerId: string;
  player: {
    id: string;
    name: string;
  };
  seatPosition: number;
  initialScore: number;
  finalScore?: number;
}

interface Round {
  id: string;
  roundNumber: number;
  wind: "EAST" | "SOUTH" | "WEST" | "NORTH";
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  dealerPlayerId: string;
  honba: number;
  riichiSticks: number;
}

interface Hanchan {
  id: string;
  name?: string;
  startedAt: string;
  endedAt?: string;
  status: "IN_PROGRESS" | "COMPLETED";
  createdAt: string;
  updatedAt: string;
  hanchanPlayers: HanchanPlayer[];
  rounds?: Round[];
}

interface GetHanchanResponse {
  data: Hanchan;
}
```

## バリデーション

- `id`はUUID形式である必要がある
- `id`に対応する半荘が存在する必要がある

## 実装メモ

- `hanchanPlayers`を含めて取得（JOIN）
- `player`情報も含めて取得
- `rounds`を含めて取得（オプション、必要に応じて）
- 半荘が存在しない場合は404エラーを返す

