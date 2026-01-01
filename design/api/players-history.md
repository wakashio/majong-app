# 参加者履歴取得API

## 概要

参加者の履歴情報を取得するAPIです。参加者が参加した半荘の一覧を返します。

## エンドポイント

```
GET /api/players/:id/history
```

## リクエスト

### パスパラメータ

- `id`: UUID、必須、参加者ID

### クエリパラメータ

- `limit`: 整数、オプション、取得件数（デフォルト: 20、最大: 100）
- `offset`: 整数、オプション、オフセット（デフォルト: 0）

## レスポンス

### 成功レスポンス (200 OK)

```typescript
{
  "data": [
    {
      "hanchanId": "550e8400-e29b-41d4-a716-446655440000",
      "hanchanName": "半荘1",
      "startedAt": "2025-12-30T00:00:00.000Z",
      "endedAt": "2025-12-30T02:00:00.000Z",
      "status": "COMPLETED",
      "seatPosition": 0,
      "initialScore": 25000,
      "finalScore": 30000,
      "rank": 1,
      "totalRounds": 16
    },
    {
      "hanchanId": "550e8400-e29b-41d4-a716-446655440001",
      "hanchanName": "半荘2",
      "startedAt": "2025-12-29T00:00:00.000Z",
      "endedAt": "2025-12-29T02:00:00.000Z",
      "status": "COMPLETED",
      "seatPosition": 1,
      "initialScore": 25000,
      "finalScore": 25000,
      "rank": 2,
      "totalRounds": 16
    }
  ],
  "pagination": {
    "total": 10,
    "limit": 20,
    "offset": 0
  }
}
```

### エラーレスポンス

#### 404 Not Found

```typescript
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Player not found"
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
interface PlayerHistoryResponse {
  data: {
    hanchanId: string;
    hanchanName?: string;
    startedAt: string;
    endedAt?: string;
    status: "IN_PROGRESS" | "COMPLETED";
    seatPosition: number;
    initialScore: number;
    finalScore?: number;
    rank?: number;
    totalRounds: number;
  }[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}
```

## レスポンス項目の説明

- `hanchanId`: 半荘ID
- `hanchanName`: 半荘名
- `startedAt`: 開始日時
- `endedAt`: 終了日時（半荘が完了している場合のみ）
- `status`: ステータス（`IN_PROGRESS`、`COMPLETED`）
- `seatPosition`: 席順（0-3）
- `initialScore`: 開始点数
- `finalScore`: 最終得点（半荘が完了している場合のみ）
- `rank`: 順位（1-4、半荘が完了している場合のみ）
- `totalRounds`: 局数

## クエリロジック

### 半荘一覧取得

```sql
SELECT 
  h.id as hanchanId,
  h.name as hanchanName,
  h.startedAt,
  h.endedAt,
  h.status,
  hp.seatPosition,
  hp.initialScore,
  hp.finalScore,
  (
    SELECT COUNT(*)
    FROM Round r
    WHERE r.hanchanId = h.id
  ) as totalRounds
FROM Hanchan h
INNER JOIN HanchanPlayer hp ON h.id = hp.hanchanId
WHERE hp.playerId = :playerId
ORDER BY h.startedAt DESC
LIMIT :limit
OFFSET :offset
```

### 順位計算

半荘が完了している場合、最終得点を降順にソートして順位を決定

```sql
SELECT 
  playerId,
  finalScore,
  ROW_NUMBER() OVER (PARTITION BY hanchanId ORDER BY finalScore DESC) as rank
FROM HanchanPlayer
WHERE hanchanId = :hanchanId
  AND finalScore IS NOT NULL
```

## 実装メモ

- デフォルトで開始日時の降順（新しい順）でソート
- ページネーションをサポート（`limit`、`offset`）
- 半荘が完了していない場合、`finalScore`と`rank`は`null`または`undefined`

## 関連ドキュメント

- `design/api/hanchans-history.md`: 半荘履歴取得API
- `design/api/players-statistics.md`: 参加者統計取得API
- `design/mahjong-data-model.md`: データモデル設計書

