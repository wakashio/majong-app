# 半荘削除API

## 概要

指定されたIDの半荘を削除するAPIです。関連する局、打点記録、鳴き、リーチなどのデータも削除されます。

## エンドポイント

```
DELETE /api/hanchans/:id
```

## リクエスト

### パスパラメータ

- `id`: UUID、必須、半荘ID

## レスポンス

### 成功レスポンス (204 No Content)

レスポンスボディなし

### エラーレスポンス

#### 404 Not Found

```typescript
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Hanchan not found"
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
- `id`に対応する半荘が存在する必要がある

## 実装メモ

- 半荘を削除する際、関連するデータも削除される（CASCADE DELETE）
  - `HanchanPlayer`レコード
  - `Round`レコード
  - `Score`レコード
  - `Naki`レコード
  - `Riichi`レコード
- 半荘が存在しない場合は404エラーを返す
- 削除成功時は204 No Contentを返す

