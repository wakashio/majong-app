# セッション更新API

## 概要

セッション情報を更新するAPIです。セッション名と参加者を更新できます。

## エンドポイント

```
PUT /api/sessions/:id
```

## リクエスト

### パスパラメータ

- `id`: セッションID（UUID）

### リクエストボディ

```typescript
{
  "name"?: "セッション名",
  "playerIds"?: ["参加者ID1", "参加者ID2", "参加者ID3", "参加者ID4", ...]
}
```

### バリデーション

- `name`: 文字列、オプション、100文字以下
- `playerIds`: 配列、オプション、4要素以上、各要素はUUID形式、重複不可
  - 指定された場合、既存の参加者を削除して新しい参加者を追加する

## レスポンス

### 成功レスポンス (200 OK)

```typescript
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "date": "2026-01-01T00:00:00.000Z",
    "name": "セッション名",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z",
    "sessionPlayers": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "playerId": "参加者ID1",
        "player": {
          "id": "参加者ID1",
          "name": "参加者名1"
        }
      },
      // ... 他の参加者
    ]
  }
}
```

### エラーレスポンス

#### 400 Bad Request

```typescript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "playerIds must contain at least 4 elements"
  }
}
```

#### 404 Not Found

```typescript
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Session not found"
  }
}
```

#### 422 Unprocessable Entity

```typescript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "playerIds must be unique"
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
interface UpdateSessionRequest {
  name?: string;
  playerIds?: string[];
}

interface SessionPlayer {
  id: string;
  playerId: string;
  player: {
    id: string;
    name: string;
  };
}

interface Session {
  id: string;
  date: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
  sessionPlayers: SessionPlayer[];
}

interface UpdateSessionResponse {
  data: Session;
}
```

## バリデーション

- `name`はオプションで、100文字以下である必要がある
- `playerIds`が指定された場合、4要素以上である必要がある
- `playerIds`の各要素は既存の参加者IDである必要がある
- `playerIds`に重複があってはならない

## 実装メモ

- `name`のみ更新する場合、参加者情報は変更しない
- `playerIds`が指定された場合、既存の`SessionPlayer`を削除して新しい参加者を追加する
- トランザクション内で更新処理を実行する
- 参加者IDの存在確認を実装
- 重複チェックを実装

