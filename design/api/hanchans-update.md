# 半荘更新API

## 概要

半荘情報を更新するAPIです。半荘名の変更、半荘の終了処理などを行います。

## エンドポイント

```
PUT /api/hanchans/:id
```

## リクエスト

### パスパラメータ

- `id`: UUID、必須、半荘ID

### リクエストボディ

```typescript
{
  "name"?: "半荘名",
  "status"?: "IN_PROGRESS" | "COMPLETED",
  "finalScores"?: {
    "playerId": 点数
  }
}
```

### バリデーション

- `name`: 文字列、オプション、100文字以下
- `status`: 列挙型、オプション、`IN_PROGRESS`または`COMPLETED`
- `finalScores`: オブジェクト、オプション、各参加者IDと最終点数のマッピング
  - `status`が`COMPLETED`に変更される場合、`finalScores`の設定を推奨

## レスポンス

### 成功レスポンス (200 OK)

```typescript
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "半荘名",
    "startedAt": "2025-12-30T00:00:00.000Z",
    "endedAt": "2025-12-30T12:00:00.000Z",
    "status": "COMPLETED",
    "createdAt": "2025-12-30T00:00:00.000Z",
    "updatedAt": "2025-12-30T12:00:00.000Z",
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
        "finalScore": 30000,
        "finalScoreWithUmaOka": 25030
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
    "message": "Invalid status value"
  }
}
```

#### 404 Not Found

```typescript
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Hanchan not found"
  }
}
```

#### 422 Unprocessable Entity

```typescript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Player not found in hanchan"
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
interface UpdateHanchanRequest {
  name?: string;
  status?: "IN_PROGRESS" | "COMPLETED";
  finalScores?: Record<string, number>;
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
  finalScore?: number; // ウマオカ考慮前の値（currentScore）
  finalScoreWithUmaOka?: number; // ウマオカ考慮後の値
}

interface Hanchan {
  id: string;
  name?: string;
  startedAt: string;
  endedAt?: string;
  status: "IN_PROGRESS" | "COMPLETED";
  createdAt: string;
  updatedAt: string;
  hanchanPlayers: HanchanPlayer[];
}

interface UpdateHanchanResponse {
  data: Hanchan;
}
```

## バリデーション

- `name`は100文字以下
- `status`は`IN_PROGRESS`または`COMPLETED`のみ
- `finalScores`が指定された場合、各キーは半荘に参加している参加者IDである必要がある
- `status`が`COMPLETED`に変更される場合、`endedAt`を現在日時に自動設定
- `status`が`IN_PROGRESS`に変更される場合、`endedAt`を`null`に設定

## 実装メモ

- 半荘名の更新
- 半荘ステータスの更新
- `status`が`COMPLETED`に変更される場合、`endedAt`を現在日時に自動設定
- `finalScores`が指定された場合、各参加者の`finalScore`と`finalScoreWithUmaOka`を更新
- `status`が`COMPLETED`に変更され、`finalScores`が指定されていない場合、ウマオカを自動計算して`finalScore`と`finalScoreWithUmaOka`を設定
  - `finalScore`: `currentScore`（ウマオカ考慮前の値）を保存
  - `finalScoreWithUmaOka`: ウマオカ計算後の値を保存
- `finalScores`の各キーが半荘に参加している参加者IDであることを確認
- 半荘が存在しない場合は404エラーを返す
- 積み棒の移動処理は別APIで実装（局管理機能で実装）

## ウマオカ計算

半荘終了時にウマオカを自動計算する場合、以下のロジックを使用します:

1. 各参加者の現在の持ち点を計算: `currentScore = initialScore + SUM(scoreChange)`
2. 順位を決定: `currentScore`を降順にソート
3. オカを計算: `oka = returnScore - initialScore`（デフォルト: 5000）
4. 最終得点を計算:
   - 全員から返し点（`returnScore`）を減算
   - 1位に20000を加算
   - 各順位に応じた`uma`を加算
   - 計算式:
     - 1位: `finalScoreWithUmaOka = currentScore - returnScore + 20000 + uma[0]`
     - 2位以下: `finalScoreWithUmaOka = currentScore - returnScore + uma[rank-1]`
5. `finalScore`には`currentScore`をそのまま保存

詳細は `design/uma-oka-calculation-logic.md` を参照してください。

