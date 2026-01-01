# 参加者更新API

## 概要

既存の参加者情報を更新するAPIです。

## エンドポイント

```
PUT /api/players/:id
```

## リクエスト

### パスパラメータ

- `id`: UUID（参加者ID、必須）

### リクエストボディ

```typescript
{
  "name": "更新後の参加者名"
}
```

### バリデーション

- `name`: 文字列、必須、1文字以上、100文字以下、一意（更新対象を除く）

## レスポンス

### 成功レスポンス (200 OK)

```typescript
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "更新後の参加者名",
    "createdAt": "2025-12-30T00:00:00.000Z",
    "updatedAt": "2025-12-30T01:00:00.000Z"
  }
}
```

### エラーレスポンス

#### 400 Bad Request

```typescript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "name is required"
  }
}
```

#### 404 Not Found

```typescript
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Player not found"
  }
}
```

#### 422 Unprocessable Entity

```typescript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "name must be unique"
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
interface UpdatePlayerRequest {
  name: string;
}

interface Player {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface UpdatePlayerResponse {
  data: Player;
}
```

## バリデーション

- `id`は必須（パスパラメータ）
- `name`は必須
- `name`は1文字以上100文字以下
- `name`は一意（更新対象を除く、既存の参加者名と重複不可）
- 指定されたIDの参加者が存在することを確認

## 実装メモ

- 参加者が存在しない場合は404エラーを返す
- 参加者名の一意性チェックを実装（更新対象を除く）
- 重複する場合は422エラーを返す
- 更新日時は自動更新

