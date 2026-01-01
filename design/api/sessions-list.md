# セッション一覧取得API

## 概要

セッション一覧を取得するAPIです。日付順（新しいものから）で返却します。

## エンドポイント

```
GET /api/sessions
```

## リクエスト

### クエリパラメータ

- `limit`: 数値、オプション、デフォルト: 50、最大: 100
- `offset`: 数値、オプション、デフォルト: 0

## レスポンス

### 成功レスポンス (200 OK)

```typescript
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "date": "2026-01-01T00:00:00.000Z",
      "name": "セッション名",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z",
      "playerCount": 4,
      "hanchanCount": 2,
      "players": [
        {
          "id": "参加者ID1",
          "name": "参加者名1"
        },
        // ... 他の参加者
      ]
    },
    // ... 他のセッション
  ],
  "pagination": {
    "total": 10,
    "limit": 50,
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
interface SessionListItem {
  id: string;
  date: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
  playerCount: number;
  hanchanCount: number;
  players: {
    id: string;
    name: string;
  }[];
}

interface Pagination {
  total: number;
  limit: number;
  offset: number;
}

interface GetSessionsResponse {
  data: SessionListItem[];
  pagination: Pagination;
}
```

## 実装メモ

- セッション一覧は日付順（新しいものから）で返却する
- 参加者数（`playerCount`）と半荘数（`hanchanCount`）を集計して返却する
- 参加者情報は簡易版（idとnameのみ）を返却する
- ページネーションをサポートする

