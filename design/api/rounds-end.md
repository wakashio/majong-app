# 局終了API

## 概要

局を終了するAPIです。ツモ、ロン、流局の結果を記録し、打点記録を作成します。

## エンドポイント

```
PUT /api/rounds/:id/end
```

## リクエスト

### パスパラメータ

- `id`: UUID、必須、局ID

### リクエストボディ

```typescript
{
  "resultType": "TSUMO",
  "specialDrawType"?: "FOUR_KAN",
  "scores": [
    {
      "playerId": "参加者ID",
      "scoreChange": 1000,
      "isDealer": false,
      "isWinner": true,
      "isRonTarget": null,
      "han": 1,
      "fu": 30,
      "yaku": ["リーチ", "ツモ"]
    },
    // ... 他の参加者の打点記録
  ]
}
```

### バリデーション

- `resultType`: 列挙型、必須、`TSUMO`、`RON`、`DRAW`、`NAGASHI_MANGAN`、`SPECIAL_DRAW`のいずれか
- `specialDrawType`: 列挙型、オプション、`resultType`が`SPECIAL_DRAW`の場合は必須、`FOUR_KAN`、`FOUR_WIND`、`NINE_TERMINALS`のいずれか
- `scores`: 配列、オプション、`resultType`が`TSUMO`または`RON`の場合は必須
  - 各要素は局に参加している参加者IDである必要がある
  - **ツモの場合**:
    - 和了者の`isWinner`が`true`である必要がある（1人のみ）
    - `scoreChange`は必須
    - `han`と`fu`は任意（オプション）
  - **ロンの場合**:
    - 和了者の`isWinner`が`true`である必要がある（1〜3人、ダブロン・トリロンを許容）
    - 放銃者の`isRonTarget`が`true`である必要がある（1人のみ、同じ人から複数人がロン）
    - `scoreChange`は必須
    - `han`と`fu`は任意（オプション）

## レスポンス

### 成功レスポンス (200 OK)

```typescript
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "hanchanId": "半荘ID",
    "roundNumber": 1,
    "wind": "EAST",
    "dealerPlayerId": "参加者ID",
    "dealerPlayer": {
      "id": "参加者ID",
      "name": "参加者名"
    },
    "honba": 0,
    "riichiSticks": 0,
    "isRenchan": false,
    "status": "COMPLETED",
    "resultType": "TSUMO",
    "specialDrawType": null,
    "startedAt": "2025-12-30T00:00:00.000Z",
    "endedAt": "2025-12-30T01:00:00.000Z",
    "createdAt": "2025-12-30T00:00:00.000Z",
    "updatedAt": "2025-12-30T01:00:00.000Z",
    "scores": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "playerId": "参加者ID",
        "player": {
          "id": "参加者ID",
          "name": "参加者名"
        },
        "scoreChange": 1000,
        "isDealer": false,
        "isWinner": true,
        "isRonTarget": null,
        "han": 1,
        "fu": 30,
        "yaku": ["リーチ", "ツモ"]
      },
      // ... 他の打点記録
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
    "message": "resultType is required"
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
interface ScoreData {
  playerId: string;
  scoreChange: number;
  isDealer: boolean;
  isWinner: boolean;
  isRonTarget?: boolean;
  han?: number;
  fu?: number;
  yaku?: string[];
}

interface EndRoundRequest {
  resultType: "TSUMO" | "RON" | "DRAW" | "NAGASHI_MANGAN" | "SPECIAL_DRAW";
  specialDrawType?: "FOUR_KAN" | "FOUR_WIND" | "NINE_TERMINALS";
  scores?: ScoreData[];
}

interface Score {
  id: string;
  playerId: string;
  player: {
    id: string;
    name: string;
  };
  scoreChange: number;
  isDealer: boolean;
  isWinner: boolean;
  isRonTarget?: boolean;
  han?: number;
  fu?: number;
  yaku?: string[];
}

interface Round {
  id: string;
  hanchanId: string;
  roundNumber: number;
  wind: "EAST" | "SOUTH" | "WEST" | "NORTH";
  dealerPlayerId: string;
  dealerPlayer: {
    id: string;
    name: string;
  };
  honba: number;
  riichiSticks: number;
  isRenchan: boolean;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  resultType?: "TSUMO" | "RON" | "DRAW" | "NAGASHI_MANGAN" | "SPECIAL_DRAW";
  specialDrawType?: "FOUR_KAN" | "FOUR_WIND" | "NINE_TERMINALS";
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
  scores?: Score[];
}

interface EndRoundResponse {
  data: Round;
}
```

## バリデーション

- `resultType`は必須
- `resultType`が`SPECIAL_DRAW`の場合、`specialDrawType`が必須
- `resultType`が`TSUMO`または`RON`の場合、`scores`が必須
- `scores`の各要素の`playerId`は局に参加している参加者IDである必要がある
- **ツモの場合**:
  - `scores`に和了者が1人存在する必要がある（`isWinner: true`）
  - 各`score`の`scoreChange`は必須
  - 各`score`の`han`と`fu`は任意（オプション）
- **ロンの場合**:
  - `scores`に和了者が1〜3人存在する必要がある（`isWinner: true`、ダブロン・トリロンを許容）
  - `scores`に放銃者が1人存在する必要がある（`isRonTarget: true`、同じ人から複数人がロン）
  - 各`score`の`scoreChange`は必須
  - 各`score`の`han`と`fu`は任意（オプション）
- 局が存在する必要がある
- 局のステータスが`IN_PROGRESS`である必要がある

## 実装メモ

- 局のステータスを`COMPLETED`に更新
- `resultType`と`specialDrawType`を設定
- `endedAt`を現在日時に設定
- `scores`が指定された場合、打点記録を作成
- 打点記録は`Score`エンティティとして保存
- 局のステータスが`IN_PROGRESS`であることを確認
- 参加者IDの存在確認を実装
- **局終了時に、リーチ記録、本場、積み棒の点数変動を一括で計算して統合する**:
  - リーチ記録による点数変動を計算する:
    - `round.riichis`からリーチ者を取得し、各リーチ者に対して-1000点を計算
  - 本場による点数変動を計算する:
    - 親子の判定と結果タイプ（ツモ・ロン）に応じて本場による点数変動を計算
    - 親がツモ: 子1人あたり`-round.honba × 300`点
    - 子がツモ: 親から`-round.honba × 300`点、子から`-round.honba × 100`点
    - 親がロン: 放銃者から`-round.honba × 300`点
    - 子がロン（親から）: 放銃者（親）から`-round.honba × 300`点
    - 子がロン（子から）: 放銃者（子）から`-round.honba × 100`点
    - 流局時・流し満貫時: 本場による点数変動は0
  - 積み棒による点数変動を計算する:
    - 和了時（ツモ・ロン）: 和了者が`round.riichiSticks × 1000`点を獲得
    - 流し満貫時: 流し満貫を達成した参加者が`round.riichiSticks × 1000`点を獲得
    - 流局時: 積み棒による点数変動は0（次局に持ち越される）
  - リーチ記録による点数変動、本場による点数変動、積み棒による点数変動を、和了・流局による点数変動（`data.scores`の`scoreChange`）に加算して統合する
  - 統合された`scoreChange`でScoreを作成する
  - トランザクション内で処理する

