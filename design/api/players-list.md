# 参加者一覧取得API

## 概要

参加者一覧を取得するAPIです。

## エンドポイント

```
GET /api/players
```

## リクエスト

### パラメータ

なし

### クエリパラメータ

なし

## レスポンス

### 成功レスポンス (200 OK)

```typescript
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "参加者1",
      "createdAt": "2025-12-30T00:00:00.000Z",
      "updatedAt": "2025-12-30T00:00:00.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "参加者2",
      "createdAt": "2025-12-30T00:00:00.000Z",
      "updatedAt": "2025-12-30T00:00:00.000Z"
    }
  ]
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
interface Player {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface PlayersListResponse {
  data: Player[];
}
```

## バリデーション

なし

## 実装メモ

- データベースからすべての参加者を取得
- 作成日時の昇順でソート
- 空の配列を返すことも可能（参加者が存在しない場合）

