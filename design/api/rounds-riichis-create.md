# リーチ記録追加API

## 概要

局進行中にリーチを記録するAPIです。

## エンドポイント

```
POST /api/rounds/:id/riichis
```

## リクエスト

### パスパラメータ

- `id`: UUID、必須、局ID

### リクエストボディ

```typescript
{
  "playerId": "参加者ID",
  "isDoubleRiichi": false,
  "isIppatsu": false
}
```

### バリデーション

- `playerId`: UUID、必須、局に参加している参加者ID
- `isDoubleRiichi`: 真偽値、必須、デフォルト: false
- `isIppatsu`: 真偽値、必須、デフォルト: false

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
    "isDoubleRiichi": false,
    "isIppatsu": false,
    "declaredAt": "2025-12-30T00:00:00.000Z",
    "createdAt": "2025-12-30T00:00:00.000Z",
    "updatedAt": "2025-12-30T00:00:00.000Z"
  }
}
```

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

#### 422 Unprocessable Entity

```typescript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "playerId must be a player in the round"
  }
}
```

#### 409 Conflict

```typescript
{
  "error": {
    "code": "CONFLICT",
    "message": "Player has already declared riichi in this round"
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
interface CreateRiichiRequest {
  playerId: string;
  isDoubleRiichi?: boolean;
  isIppatsu?: boolean;
}

interface Riichi {
  id: string;
  roundId: string;
  playerId: string;
  player: {
    id: string;
    name: string;
  };
  isDoubleRiichi: boolean;
  isIppatsu: boolean;
  declaredAt: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateRiichiResponse {
  data: Riichi;
}
```

## バリデーション

- `playerId`は局に参加している参加者IDである必要がある
- 同じ参加者が同じ局で既にリーチを宣言していない必要がある（1局につき1人1回まで）
- 局が存在する必要がある
- ラウンドが作成された時点で、すぐにアクションを追加できる（開始概念は不要）
- リーチ宣言時に積み棒を1つ追加（`Round.riichiSticks`を1増やす）

## 実装メモ

- リーチ記録を作成
- `declaredAt`は現在日時を自動設定
- 同じ参加者が同じ局で既にリーチを宣言していないことを確認
- リーチ宣言時に`Round.riichiSticks`を1増やす
- 参加者IDの存在確認を実装
- ラウンドが作成された時点で、すぐにアクションを追加できる（開始概念は不要、`startedAt`や`endedAt`のチェックは不要）

