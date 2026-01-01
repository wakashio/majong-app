# セッション削除API

## 概要

セッションを削除するAPIです。セッション削除時は、紐づく半荘の`sessionId`を`null`に設定します（Cascade削除はしない）。

## エンドポイント

```
DELETE /api/sessions/:id
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
    "deleted": true
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
interface DeleteSessionResponse {
  data: {
    id: string;
    deleted: boolean;
  };
}
```

## 実装メモ

- セッション削除時は、紐づく半荘の`sessionId`を`null`に設定する（Cascade削除はしない）
- `SessionPlayer`はCascade削除する
- トランザクション内で削除処理を実行する
- セッションIDの存在確認を実装

