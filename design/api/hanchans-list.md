# 半荘一覧取得API

## 概要

半荘一覧を取得するAPIです。進行中・完了済みの半荘を取得できます。

## エンドポイント

```
GET /api/hanchans
```

## リクエスト

### クエリパラメータ

- `status`: 文字列、オプション、`IN_PROGRESS`または`COMPLETED`でフィルタリング
- `limit`: 整数、オプション、取得件数の上限（デフォルト: 100）
- `offset`: 整数、オプション、取得開始位置（デフォルト: 0）

## レスポンス

### 成功レスポンス (200 OK)

```typescript
{
  "data": [
    {
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
      ]
    },
    // ... 他の半荘
  ],
  "meta": {
    "total": 10,
    "limit": 100,
    "offset": 0
  }
}
```

### エラーレスポンス

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
interface ListHanchansQuery {
  status?: "IN_PROGRESS" | "COMPLETED";
  limit?: number;
  offset?: number;
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
  createdAt: string;
  updatedAt: string;
  hanchanPlayers: HanchanPlayer[];
}

interface ListHanchansResponse {
  data: Hanchan[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}
```

## バリデーション

- `status`は`IN_PROGRESS`または`COMPLETED`のみ
- `limit`は1以上1000以下
- `offset`は0以上

## 実装メモ

- デフォルトでは全ステータスの半荘を取得
- `status`が指定された場合、該当ステータスの半荘のみ取得
- `hanchanPlayers`を含めて取得（JOIN）
- `player`情報も含めて取得
- 作成日時の降順でソート
- ページネーション対応（`limit`、`offset`）

