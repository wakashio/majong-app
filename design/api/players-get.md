# 参加者個別取得API

## 概要

指定されたIDの参加者情報を取得するAPIです。

## エンドポイント

```
GET /api/players/:id
```

## リクエスト

### パスパラメータ

- `id`: UUID（参加者ID、必須）

## レスポンス

### 成功レスポンス (200 OK)

```typescript
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "参加者名",
    "createdAt": "2025-12-30T00:00:00.000Z",
    "updatedAt": "2025-12-30T00:00:00.000Z"
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
interface Player {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface PlayerResponse {
  data: Player;
}
```

## バリデーション

- `id`は必須（パスパラメータ）
- 指定されたIDの参加者が存在することを確認

## 実装メモ

- 参加者が存在しない場合は404エラーを返す
- 参加者情報を取得して返す

