# 局削除API

## 概要

指定されたIDの局を削除するAPIです。関連する打点記録、鳴き、リーチなどのデータも削除されます。

## エンドポイント

```
DELETE /api/rounds/:id
```

## リクエスト

### パスパラメータ

- `id`: UUID、必須、局ID

## レスポンス

### 成功レスポンス (204 No Content)

レスポンスボディなし

### エラーレスポンス

#### 404 Not Found

```typescript
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Round not found"
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

- `id`はUUID形式である必要がある
- `id`に対応する局が存在する必要がある

## 実装メモ

- 局を削除する際、関連するデータも削除される（CASCADE DELETE）
  - `Score`レコード
  - `Naki`レコード
  - `Riichi`レコード
- 局が存在しない場合は404エラーを返す
- 削除成功時は204 No Contentを返す

