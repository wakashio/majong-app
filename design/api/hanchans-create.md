# 半荘作成API

## 概要

新しい半荘を作成するAPIです。半荘の開始時に呼び出され、4人の参加者と席順を記録します。

## エンドポイント

```
POST /api/hanchans
```

## リクエスト

### リクエストボディ

```typescript
{
  "name"?: "半荘名",
  "playerIds": ["参加者ID1", "参加者ID2", "参加者ID3", "参加者ID4"],
  "seatPositions"?: [0, 1, 2, 3],
  "sessionId"?: "セッションID"
}
```

### バリデーション

- `name`: 文字列、オプション、100文字以下
- `playerIds`: 配列、必須、4要素、各要素はUUID形式、重複不可
- `seatPositions`: 配列、オプション、4要素、各要素は0-3の整数、重複不可
  - 指定されない場合、`playerIds`の順序で0, 1, 2, 3が自動設定される
- `sessionId`: 文字列、オプション、UUID形式
  - 指定された場合、そのセッションに紐づく
  - セッション詳細画面から作成した場合、自動的に設定される

## レスポンス

### 成功レスポンス (201 Created)

```typescript
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "半荘名",
    "startedAt": "2025-12-30T00:00:00.000Z",
    "endedAt": null,
    "status": "IN_PROGRESS",
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2025-12-30T00:00:00.000Z",
    "updatedAt": "2025-12-30T00:00:00.000Z",
    "hanchanPlayers": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "playerId": "参加者ID1",
        "player": {
          "id": "参加者ID1",
          "name": "参加者名1"
        },
        "seatPosition": 0,
        "initialScore": 25000,
        "finalScore": null
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
    "message": "playerIds must contain exactly 4 elements"
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
interface CreateHanchanRequest {
  name?: string;
  playerIds: string[];
  seatPositions?: number[];
  sessionId?: string;
}

interface HanchanPlayer {
  id: string;
  playerId: string;
  player: {
    id: string;
    name: string;
  };
  seatPosition: number;
  initialScore: number;
  finalScore?: number;
}

interface Hanchan {
  id: string;
  name?: string;
  startedAt: string;
  endedAt?: string;
  status: "IN_PROGRESS" | "COMPLETED";
  sessionId?: string;
  createdAt: string;
  updatedAt: string;
  hanchanPlayers: HanchanPlayer[];
}

interface CreateHanchanResponse {
  data: Hanchan;
}
```

## バリデーション

- `playerIds`は必須で、4要素である必要がある
- `playerIds`の各要素は既存の参加者IDである必要がある
- `playerIds`に重複があってはならない
- `seatPositions`が指定された場合、4要素で各要素は0-3の整数である必要がある
- `seatPositions`に重複があってはならない
- `seatPositions`が指定されない場合、`playerIds`の順序で0, 1, 2, 3が自動設定される
- `sessionId`が指定された場合、そのセッションが存在することを確認する
- `sessionId`が指定された場合、選択された参加者がそのセッションの参加者であることを確認する（オプション、バリデーション）

## 実装メモ

- 半荘作成時に`HanchanPlayer`レコードを4件作成する
- `startedAt`は現在日時を自動設定
- `status`は`IN_PROGRESS`で初期化
- `initialScore`はデフォルトで25000点
- 席順は`seatPositions`が指定されない場合、`playerIds`の順序で自動設定
- 参加者IDの存在確認を実装
- 重複チェックを実装
- **半荘作成時に自動的に東1局0本場の局を作成する**
  - 半荘作成と局作成を同一トランザクションで実行する（Prismaのトランザクション機能を使用）
  - 局の初期値:
    - 局番号: 1
    - 風: `EAST`（東）
    - 本場: 0
    - 積み棒: 0
    - 親: `seatPosition = 0`の参加者の`playerId`を自動設定
    - 連荘: `false`
    - エラーハンドリング:
    - `seatPosition = 0`の参加者が見つからない場合、エラーを返す（`VALIDATION_ERROR`）
    - 局作成失敗時は、半荘作成もロールバックする（トランザクション内で実行）
- `sessionId`が指定された場合、そのセッションに紐づける
- セッション詳細画面から作成した場合、`sessionId`を自動的に設定する

