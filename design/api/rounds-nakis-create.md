# 鳴き記録追加API

## 概要

局進行中に鳴きを記録するAPIです。

## エンドポイント

```
POST /api/rounds/:id/nakis
```

## リクエスト

### パスパラメータ

- `id`: UUID、必須、局ID

### リクエストボディ

```typescript
{
  "playerId": "参加者ID",
  "type": "PON",
  "targetPlayerId": "対象参加者ID",
  "tiles": ["1m", "1m", "1m"]
}
```

### バリデーション

- `playerId`: UUID、必須、局に参加している参加者ID
- `type`: 列挙型、必須、`PON`、`CHI`、`DAIMINKAN`、`ANKAN`のいずれか
- `targetPlayerId`: UUID、オプション、`type`が`PON`、`CHI`、`DAIMINKAN`の場合は必須
- `tiles`: 文字列配列、必須、牌のリスト

## レスポンス

### 成功レスポンス (201 Created)

```typescript
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "roundId": "局ID",
    "playerId": "参加者ID",
    "player": {
      "id": "参加者ID",
      "name": "参加者名"
    },
    "type": "PON",
    "targetPlayerId": "対象参加者ID",
    "targetPlayer": {
      "id": "対象参加者ID",
      "name": "対象参加者名"
    },
    "tiles": ["1m", "1m", "1m"],
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
    "message": "targetPlayerId is required for PON, CHI, DAIMINKAN"
  }
}
```

#### 404 Not Found

```typescript
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Round not found"
  }
}
```

#### 422 Unprocessable Entity

```typescript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "playerId must be a player in the round"
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
interface CreateNakiRequest {
  playerId: string;
  type: "PON" | "CHI" | "DAIMINKAN" | "ANKAN";
  targetPlayerId?: string;
  tiles: string[];
}

interface Naki {
  id: string;
  roundId: string;
  playerId: string;
  player: {
    id: string;
    name: string;
  };
  type: "PON" | "CHI" | "DAIMINKAN" | "ANKAN";
  targetPlayerId?: string;
  targetPlayer?: {
    id: string;
    name: string;
  };
  tiles: string[];
  createdAt: string;
  updatedAt: string;
}

interface CreateNakiResponse {
  data: Naki;
}
```

## バリデーション

- `playerId`は局に参加している参加者IDである必要がある
- `type`が`PON`、`CHI`、`DAIMINKAN`の場合は`targetPlayerId`が必須
- `type`が`ANKAN`の場合は`targetPlayerId`は不要
- `targetPlayerId`が指定された場合、局に参加している参加者IDである必要がある
- `tiles`は空配列でない必要がある
- 局が存在する必要がある
- ラウンドが作成された時点で、すぐにアクションを追加できる（開始概念は不要）

## 実装メモ

- 鳴き記録を作成
- `type`が`ANKAN`の場合は`targetPlayerId`を`null`に設定
- `type`が`PON`、`CHI`、`DAIMINKAN`の場合は`targetPlayerId`を必須チェック
- 参加者IDの存在確認を実装
- ラウンドが作成された時点で、すぐにアクションを追加できる（開始概念は不要、`startedAt`や`endedAt`のチェックは不要）

