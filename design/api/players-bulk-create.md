# 参加者一括作成API

## 概要

複数の参加者を一度に作成するAPIです。トランザクション内で全ての参加者を作成し、1つでも失敗した場合は全てロールバックします。

## エンドポイント

```
POST /api/players/bulk
```

## リクエスト

### リクエストボディ

```typescript
{
  "names": ["参加者1", "参加者2", "参加者3"]
}
```

### バリデーション

- `names`: 配列、必須、1要素以上、各要素は文字列、1文字以上、100文字以下、一意（リクエスト内での重複不可、既存の参加者名と重複不可）

## レスポンス

### 成功レスポンス (201 Created)

```typescript
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "参加者1",
      "createdAt": "2025-12-31T00:00:00.000Z",
      "updatedAt": "2025-12-31T00:00:00.000Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "参加者2",
      "createdAt": "2025-12-31T00:00:00.000Z",
      "updatedAt": "2025-12-31T00:00:00.000Z"
    },
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "name": "参加者3",
      "createdAt": "2025-12-31T00:00:00.000Z",
      "updatedAt": "2025-12-31T00:00:00.000Z"
    }
  ]
}
```

### エラーレスポンス

#### 400 Bad Request

```typescript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "names is required"
  }
}
```

```typescript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "names must be an array with at least one element"
  }
}
```

```typescript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "name must be 100 characters or less"
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

```typescript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Duplicate names in request: 参加者1"
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
interface BulkCreatePlayerRequest {
  names: string[];
}

interface Player {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface BulkCreatePlayerResponse {
  data: Player[];
}
```

## バリデーション

### リクエストレベル

- `names`は必須
- `names`は配列である必要がある
- `names`は1要素以上である必要がある

### 各名前のバリデーション

- `name`は文字列である必要がある
- `name`は1文字以上100文字以下である必要がある
- `name`は空白文字のみでない必要がある（`trim()`後の長さが1以上）

### 重複チェック

- リクエスト内での重複チェック: リクエスト内で同じ名前が複数回指定されていないか確認
- 既存プレイヤーとの重複チェック: 既存の参加者名と重複していないか確認

## 実装メモ

### バックエンド実装

- `playerController.ts`に`bulkCreate`メソッドを追加
- `playerService.ts`に`bulkCreate`メソッドを追加（Prismaのトランザクションを使用）
- `playerRoutes.ts`に`POST /api/players/bulk`ルートを追加
- 既存の`validateName`関数を使用して各名前を検証
- リクエスト内での重複チェックを実装（`Set`を使用）
- 既存プレイヤーとの重複チェックを実装（`findByName`を使用）
- Prismaのトランザクション（`$transaction`）を使用して全てのプレイヤーを作成
- 1つでも失敗した場合は全てロールバック
- 成功時は作成された全プレイヤーのデータを返す

### エラーハンドリング

- バリデーションエラー: 400 Bad Request
- 重複エラー: 422 Unprocessable Entity
- 内部エラー: 500 Internal Server Error

### トランザクション

- Prismaの`$transaction`を使用
- 全てのプレイヤー作成が成功した場合のみコミット
- 1つでも失敗した場合は全てロールバック

## 使用例

### 正常系

```bash
curl -X POST http://localhost:3000/api/players/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "names": ["参加者1", "参加者2", "参加者3"]
  }'
```

### エラー系（重複）

```bash
curl -X POST http://localhost:3000/api/players/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "names": ["参加者1", "参加者1"]
  }'
```

### エラー系（既存プレイヤーと重複）

```bash
curl -X POST http://localhost:3000/api/players/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "names": ["既存の参加者", "新しい参加者"]
  }'
```

