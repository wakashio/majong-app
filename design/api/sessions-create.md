# セッション作成API

## 概要

新しいセッションを作成するAPIです。セッションの開始時に呼び出され、日付と参加者を記録します。

## エンドポイント

```
POST /api/sessions
```

## リクエスト

### リクエストボディ

```typescript
{
  "date": "2026-01-01",
  "name"?: "セッション名",
  "playerIds": ["参加者ID1", "参加者ID2", "参加者ID3", "参加者ID4", ...]
}
```

### バリデーション

- `date`: 文字列、必須、日付形式（YYYY-MM-DD）、時刻なし
- `name`: 文字列、オプション、100文字以下
- `playerIds`: 配列、必須、4要素以上、各要素はUUID形式、重複不可

## レスポンス

### 成功レスポンス (201 Created)

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
    ],
    "hanchans": []
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
    "message": "Player not found"
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
interface CreateSessionRequest {
  date: string; // YYYY-MM-DD形式
  name?: string;
  playerIds: string[];
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
  hanchans: any[]; // 空配列（詳細取得時に取得）
}

interface CreateSessionResponse {
  data: Session;
}
```

## バリデーション

- `date`は必須で、日付形式（YYYY-MM-DD）である必要がある
- `date`は時刻なしで管理する（時刻部分は00:00:00に設定）
- `playerIds`は必須で、4要素以上である必要がある
- `playerIds`の各要素は既存の参加者IDである必要がある
- `playerIds`に重複があってはならない

## 実装メモ

- セッション作成時に`SessionPlayer`レコードを作成する（参加者数分）
- `date`は日付のみ（時刻なし）で管理する（時刻部分は00:00:00に設定）
- 同日に複数セッションを作成できる
- 参加者IDの存在確認を実装
- 重複チェックを実装
- トランザクション内でセッションとSessionPlayerを作成する

