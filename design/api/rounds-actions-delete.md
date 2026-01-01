# 局アクション記録削除API

## 概要

局進行中に記録した鳴きまたはリーチを削除するAPIです。鳴きとリーチを統合したエンドポイントです。

## エンドポイント

```
DELETE /api/rounds/:id/actions/:actionId
```

## リクエスト

### パスパラメータ

- `id`: UUID、必須、局ID
- `actionId`: UUID、必須、アクションID

### バリデーション

- 局が存在する必要がある
- アクションが存在する必要がある
- アクションが指定された局に属している必要がある

## レスポンス

### 成功レスポンス (204 No Content)

レスポンスボディはありません。

### エラーレスポンス

#### 404 Not Found

```typescript
{
  "error": {
    "code": "NOT_FOUND",
    "message": "RoundAction not found"
  }
}
```

#### 422 Unprocessable Entity

```typescript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "RoundAction does not belong to the specified round"
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

## 実装メモ

- 局アクション記録を削除
- `type=RIICHI`の場合:
  - リーチ削除時に`Round.riichiSticks`を1減らす（`riichiSticks > 0`の場合のみ）
  - **リーチ記録削除時はScoreを削除しない**（局終了時に一括で計算する方針に統一）
    - `riichiSticks`の更新のみ行う
- アクションが指定された局に属していることを確認
- トランザクション内で処理する

## 非推奨API

以下のAPIは非推奨です。`DELETE /api/rounds/:id/actions/:actionId`を使用してください。

- `DELETE /api/rounds/:id/nakis/:nakiId`（非推奨）
- `DELETE /api/rounds/:id/riichis/:riichiId`（非推奨）

