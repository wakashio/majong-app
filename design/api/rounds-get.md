# 局詳細取得API

## 概要

指定されたIDの局の詳細情報を取得するAPIです。打点記録、鳴き、リーチの情報も含めて取得します。

## エンドポイント

```
GET /api/rounds/:id
```

## リクエスト

### パスパラメータ

- `id`: UUID、必須、局ID

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
    "updatedAt": "2025-12-30T00:00:00.000Z",
    "scores": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "playerId": "参加者ID",
        "player": {
          "id": "参加者ID",
          "name": "参加者名"
        },
        "scoreChange": 1000,
        "isDealer": false,
        "isWinner": true,
        "isRonTarget": null,
        "han": 1,
        "fu": 30,
        "yaku": ["リーチ", "ツモ"]
      },
      // ... 他の打点記録
    ],
    "nakis": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "playerId": "参加者ID",
        "player": {
          "id": "参加者ID",
          "name": "参加者名"
        },
        "type": "PON",
        "targetPlayerId": "対象参加者ID",
        "targetPlayer": {
          "id": "対象参加者ID",
          "name": "対象参加者名"
        },
        "tiles": ["1m", "1m", "1m"]
      },
      // ... 他の鳴き記録
    ],
    "riichis": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440003",
        "playerId": "参加者ID",
        "player": {
          "id": "参加者ID",
          "name": "参加者名"
        },
        "isDoubleRiichi": false,
        "isIppatsu": false,
        "declaredAt": "2025-12-30T00:00:00.000Z"
      },
      // ... 他のリーチ記録
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
    "message": "Round not found"
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
interface Score {
  id: string;
  playerId: string;
  player: {
    id: string;
    name: string;
  };
  scoreChange: number;
  isDealer: boolean;
  isWinner: boolean;
  isRonTarget?: boolean;
  han?: number;
  fu?: number;
  yaku?: string[];
}

interface Naki {
  id: string;
  playerId: string;
  player: {
    id: string;
    name: string;
  };
  type: "PON" | "CHI" | "DAIMINKAN" | "ANKAN";
  targetPlayerId?: string;
  targetPlayer?: {
    id: string;
    name: string;
  };
  tiles: string[];
}

interface Riichi {
  id: string;
  playerId: string;
  player: {
    id: string;
    name: string;
  };
  isDoubleRiichi: boolean;
  isIppatsu: boolean;
  declaredAt: string;
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
  scores?: Score[];
  nakis?: Naki[];
  riichis?: Riichi[];
}

interface GetRoundResponse {
  data: Round;
}
```

## バリデーション

- `id`はUUID形式である必要がある
- `id`に対応する局が存在する必要がある

## 実装メモ

- `scores`を含めて取得（オプション、必要に応じて）
- `nakis`を含めて取得（オプション、必要に応じて）
- `riichis`を含めて取得（オプション、必要に応じて）
- `player`情報も含めて取得
- 局が存在しない場合は404エラーを返す
- 局の状態は`startedAt`と`endedAt`から判定する（クライアント側で計算）

