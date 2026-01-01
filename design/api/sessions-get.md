# セッション詳細取得API

## 概要

セッションの詳細情報を取得するAPIです。セッション情報、参加者一覧、半荘一覧を返却します。

## エンドポイント

```
GET /api/sessions/:id
```

## リクエスト

### パスパラメータ

- `id`: セッションID（UUID）

## レスポンス

### 成功レスポンス (200 OK)

```typescript
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "date": "2026-01-01T00:00:00.000Z",
    "name": "セッション名",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z",
    "sessionPlayers": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "playerId": "参加者ID1",
        "player": {
          "id": "参加者ID1",
          "name": "参加者名1"
        }
      },
      // ... 他の参加者
    ],
    "hanchans": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440010",
        "name": "半荘名",
        "startedAt": "2026-01-01T00:00:00.000Z",
        "endedAt": null,
        "status": "IN_PROGRESS",
        "hanchanPlayers": [
          {
            "id": "550e8400-e29b-41d4-a716-446655440011",
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
        ]
      },
      // ... 他の半荘
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
    "message": "Session not found"
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
interface SessionPlayer {
  id: string;
  playerId: string;
  player: {
    id: string;
    name: string;
  };
}

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

interface Hanchan {
  id: string;
  name?: string;
  startedAt: string;
  endedAt?: string;
  status: "IN_PROGRESS" | "COMPLETED";
  hanchanPlayers: HanchanPlayer[];
}

interface Session {
  id: string;
  date: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
  sessionPlayers: SessionPlayer[];
  hanchans: Hanchan[];
}

interface GetSessionResponse {
  data: Session;
}
```

## 実装メモ

- セッション情報、参加者一覧、半荘一覧を取得する
- 半荘一覧は`sessionId`でフィルタリングする
- 半荘の参加者情報も含めて返却する

