# 参加者作成API

## 概要

新しい参加者を作成するAPIです。

## エンドポイント

```
POST /api/players
```

## リクエスト

### リクエストボディ

```typescript
{
  "name": "参加者名"
}
```

### バリデーション

- `name`: 文字列、必須、1文字以上、100文字以下、一意

## レスポンス

### 成功レスポンス (201 Created)

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

#### 400 Bad Request

```typescript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "name is required"
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
interface CreatePlayerRequest {
  name: string;
}

interface Player {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface CreatePlayerResponse {
  data: Player;
}
```

## バリデーション

- `name`は必須
- `name`は1文字以上100文字以下
- `name`は一意（既存の参加者名と重複不可）

## 実装メモ

- 参加者名の一意性チェックを実装
- 重複する場合は422エラーを返す
- 作成日時と更新日時は自動設定

