# 参加者削除API

## 概要

既存の参加者を削除するAPIです。

## エンドポイント

```
DELETE /api/players/:id
```

## リクエスト

### パスパラメータ

- `id`: UUID（参加者ID、必須）

## レスポンス

### 成功レスポンス (204 No Content)

レスポンスボディなし

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

#### 422 Unprocessable Entity

```typescript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Cannot delete player with existing hanchans"
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
// レスポンスボディなし（204 No Content）
```

## バリデーション

- `id`は必須（パスパラメータ）
- 指定されたIDの参加者が存在することを確認
- 参加者が半荘に参加している場合は削除不可（外部キー制約）

## 実装メモ

- 参加者が存在しない場合は404エラーを返す
- 参加者が半荘に参加している場合は削除不可（422エラーを返す）
- 物理削除を実装（論理削除は不要）

