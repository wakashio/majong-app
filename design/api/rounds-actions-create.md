# 局アクション記録追加API

## 概要

局進行中に鳴きまたはリーチを記録するAPIです。鳴きとリーチを統合したエンドポイントです。

## エンドポイント

```
POST /api/rounds/:id/actions
```

## リクエスト

### パスパラメータ

- `id`: UUID、必須、局ID

### リクエストボディ

#### 鳴きの場合（type=NAKI）

```typescript
{
  "type": "NAKI",
  "playerId": "参加者ID",
  "nakiType": "PON",
  "targetPlayerId": "対象参加者ID",
  "tiles": ["1m", "1m", "1m"]
}
```

#### リーチの場合（type=RIICHI）

```typescript
{
  "type": "RIICHI",
  "playerId": "参加者ID"
}
```

### バリデーション

#### 共通バリデーション

- `type`: 列挙型、必須、`NAKI`、`RIICHI`のいずれか
- `playerId`: UUID、必須、局に参加している参加者ID
- 局が存在する必要がある
- 同じ参加者が同じ局で鳴きとリーチを同時に持たないことを保証（`@@unique([roundId, playerId, type])`）

#### 鳴きの場合（type=NAKI）

- `nakiType`: 列挙型、必須、`PON`、`CHI`、`DAIMINKAN`、`ANKAN`のいずれか
- `tiles`: 文字列配列、オプション（指定しない場合は空配列として保存される）
- `targetPlayerId`: UUID、オプション、`nakiType`が`PON`、`CHI`、`DAIMINKAN`の場合は必須
- `targetPlayerId`が指定された場合、局に参加している参加者IDである必要がある

#### リーチの場合（type=RIICHI）

- 同じ参加者が同じ局で既にリーチを宣言していない必要がある（1局につき1人1回まで）
- リーチ宣言時に積み棒を1つ追加（`Round.riichiSticks`を1増やす）

## レスポンス

### 成功レスポンス (201 Created)

#### 鳴きの場合

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
    "type": "NAKI",
    "nakiType": "PON",
    "targetPlayerId": "対象参加者ID",
    "targetPlayer": {
      "id": "対象参加者ID",
      "name": "対象参加者名"
    },
    "tiles": ["1m", "1m", "1m"],
    "declaredAt": null,
    "createdAt": "2025-12-30T00:00:00.000Z",
    "updatedAt": "2025-12-30T00:00:00.000Z"
  }
}
```

#### リーチの場合

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
    "type": "RIICHI",
    "nakiType": null,
    "targetPlayerId": null,
    "tiles": [],
    "declaredAt": "2025-12-30T00:00:00.000Z",
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

```typescript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "type must be NAKI or RIICHI"
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

#### 409 Conflict

```typescript
{
  "error": {
    "code": "CONFLICT",
    "message": "Player has already declared riichi in this round"
  }
}
```

```typescript
{
  "error": {
    "code": "CONFLICT",
    "message": "Player cannot have both naki and riichi in the same round"
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
interface CreateRoundActionRequest {
  type: "NAKI" | "RIICHI";
  playerId: string;
  // 鳴きの場合（type=NAKI）
  nakiType?: "PON" | "CHI" | "DAIMINKAN" | "ANKAN";
  targetPlayerId?: string;
  tiles?: string[];
  // リーチの場合（type=RIICHI）は追加フィールドなし
}

interface RoundAction {
  id: string;
  roundId: string;
  playerId: string;
  player: {
    id: string;
    name: string;
  };
  type: "NAKI" | "RIICHI";
  declaredAt: string | null;
  nakiType: "PON" | "CHI" | "DAIMINKAN" | "ANKAN" | null;
  targetPlayerId: string | null;
  targetPlayer?: {
    id: string;
    name: string;
  } | null;
  tiles: string[];
  createdAt: string;
  updatedAt: string;
}

interface CreateRoundActionResponse {
  data: RoundAction;
}
```

## バリデーション

### 共通バリデーション

- `playerId`は局に参加している参加者IDである必要がある
- 局が存在する必要がある
- ラウンドが作成された時点で、すぐにアクションを追加できる（開始概念は不要）
- 同じ参加者が同じ局で鳴きとリーチを同時に持たないことを保証（データベース制約: `@@unique([roundId, playerId, type])`）

### 鳴きの場合（type=NAKI）

- `nakiType`が必須
- `tiles`が必須で、空配列でない必要がある
- `nakiType`が`PON`、`CHI`、`DAIMINKAN`の場合は`targetPlayerId`が必須
- `nakiType`が`ANKAN`の場合は`targetPlayerId`は不要
- `targetPlayerId`が指定された場合、局に参加している参加者IDである必要がある

### リーチの場合（type=RIICHI）

- 同じ参加者が同じ局で既にリーチを宣言していない必要がある（1局につき1人1回まで）
- リーチ宣言時に積み棒を1つ追加（`Round.riichiSticks`を1増やす）
- `declaredAt`は現在日時を自動設定

## 実装メモ

- 局アクション記録を作成
- `type=NAKI`の場合:
  - `nakiType`、`tiles`を設定
  - `nakiType`が`ANKAN`の場合は`targetPlayerId`を`null`に設定
  - `nakiType`が`PON`、`CHI`、`DAIMINKAN`の場合は`targetPlayerId`を必須チェック
  - `declaredAt`は`null`に設定
- `type=RIICHI`の場合:
  - `declaredAt`は現在日時を自動設定
  - `nakiType`、`targetPlayerId`、`tiles`は`null`または空配列に設定
  - 同じ参加者が同じ局で既にリーチを宣言していないことを確認
  - リーチ宣言時に`Round.riichiSticks`を1増やす
  - **リーチ記録追加時はScoreを作成しない**（局終了時に一括で計算する方針に統一）
    - `riichiSticks`の更新のみ行う
- 参加者IDの存在確認を実装
- ラウンドが作成された時点で、すぐにアクションを追加できる（開始概念は不要、`startedAt`や`endedAt`のチェックは不要）
- 同じ参加者が同じ局で鳴きとリーチを同時に持たないことを確認（データベース制約で保証）

## マイグレーション

既存の`Naki`と`Riichi`データを`RoundAction`に移行する必要があります。

- `Naki`データを`RoundAction`に移行:
  - `type`を`NAKI`に設定
  - `nakiType`を`Naki.type`から設定
  - `targetPlayerId`を`Naki.targetPlayerId`から設定
  - `tiles`を`Naki.tiles`から設定
  - `declaredAt`を`null`に設定
- `Riichi`データを`RoundAction`に移行:
  - `type`を`RIICHI`に設定
  - `declaredAt`を`Riichi.declaredAt`から設定
  - `nakiType`、`targetPlayerId`、`tiles`を`null`または空配列に設定

## 非推奨API

以下のAPIは非推奨です。`POST /api/rounds/:id/actions`を使用してください。

- `POST /api/rounds/:id/nakis`（非推奨）
- `POST /api/rounds/:id/riichis`（非推奨）

