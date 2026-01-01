# 半荘履歴取得API

## 概要

半荘の履歴情報を取得するAPIです。半荘内の局の一覧を返します。

## エンドポイント

```
GET /api/hanchans/:id/history
```

## リクエスト

### パスパラメータ

- `id`: UUID、必須、半荘ID

### クエリパラメータ

- `limit`: 整数、オプション、取得件数（デフォルト: 50、最大: 200）
- `offset`: 整数、オプション、オフセット（デフォルト: 0）

## レスポンス

### 成功レスポンス (200 OK)

```typescript
{
  "data": [
    {
      "roundId": "550e8400-e29b-41d4-a716-446655440000",
      "roundNumber": 1,
      "wind": "EAST",
      "dealerPlayerId": "550e8400-e29b-41d4-a716-446655440000",
      "dealerPlayerName": "参加者1",
      "honba": 0,
      "riichiSticks": 0,
      "isRenchan": false,
      "status": "COMPLETED",
      "resultType": "TSUMO",
      "specialDrawType": null,
      "startedAt": "2025-12-30T00:00:00.000Z",
      "endedAt": "2025-12-30T00:15:00.000Z",
      "scores": [
        {
          "playerId": "550e8400-e29b-41d4-a716-446655440000",
          "playerName": "参加者1",
          "scoreChange": 2000,
          "isDealer": true,
          "isWinner": true
        },
        {
          "playerId": "550e8400-e29b-41d4-a716-446655440001",
          "playerName": "参加者2",
          "scoreChange": -700,
          "isDealer": false,
          "isWinner": false
        },
        {
          "playerId": "550e8400-e29b-41d4-a716-446655440002",
          "playerName": "参加者3",
          "scoreChange": -700,
          "isDealer": false,
          "isWinner": false
        },
        {
          "playerId": "550e8400-e29b-41d4-a716-446655440003",
          "playerName": "参加者4",
          "scoreChange": -600,
          "isDealer": false,
          "isWinner": false
        }
      ]
    },
    {
      "roundId": "550e8400-e29b-41d4-a716-446655440001",
      "roundNumber": 2,
      "wind": "EAST",
      "dealerPlayerId": "550e8400-e29b-41d4-a716-446655440000",
      "dealerPlayerName": "参加者1",
      "honba": 1,
      "riichiSticks": 0,
      "isRenchan": true,
      "status": "COMPLETED",
      "resultType": "DRAW",
      "specialDrawType": null,
      "startedAt": "2025-12-30T00:15:00.000Z",
      "endedAt": "2025-12-30T00:30:00.000Z",
      "scores": []
    }
  ],
  "pagination": {
    "total": 16,
    "limit": 50,
    "offset": 0
  }
}
```

### エラーレスポンス

#### 404 Not Found

```typescript
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Hanchan not found"
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
interface HanchanHistoryResponse {
  data: {
    roundId: string;
    roundNumber: number;
    wind: "EAST" | "SOUTH" | "WEST" | "NORTH";
    dealerPlayerId: string;
    dealerPlayerName: string;
    honba: number;
    riichiSticks: number;
    isRenchan: boolean;
    status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
    resultType?: "TSUMO" | "RON" | "DRAW" | "NAGASHI_MANGAN" | "SPECIAL_DRAW";
    specialDrawType?: "FOUR_KAN" | "FOUR_WIND" | "NINE_TERMINALS";
    startedAt?: string;
    endedAt?: string;
    scores: {
      playerId: string;
      playerName: string;
      scoreChange: number;
      isDealer: boolean;
      isWinner: boolean;
      isRonTarget?: boolean;
      han?: number;
      fu?: number;
      yaku?: string[];
    }[];
  }[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}
```

## レスポンス項目の説明

- `roundId`: 局ID
- `roundNumber`: 局番号（1-16）
- `wind`: 風（東、南、西、北）
- `dealerPlayerId`: 親の参加者ID
- `dealerPlayerName`: 親の参加者名
- `honba`: 本場数
- `riichiSticks`: 積み棒数
- `isRenchan`: 連荘かどうか
- `status`: ステータス（`NOT_STARTED`、`IN_PROGRESS`、`COMPLETED`）
- `resultType`: 結果タイプ（局が完了している場合のみ）
- `specialDrawType`: 特殊流局タイプ（特殊流局の場合のみ）
- `startedAt`: 開始日時（局が開始されている場合のみ）
- `endedAt`: 終了日時（局が完了している場合のみ）
- `scores`: 打点記録（局が完了している場合のみ）

## クエリロジック

### 局一覧取得

```sql
SELECT 
  r.id as roundId,
  r.roundNumber,
  r.wind,
  r.dealerPlayerId,
  p.name as dealerPlayerName,
  r.honba,
  r.riichiSticks,
  r.isRenchan,
  r.status,
  r.resultType,
  r.specialDrawType,
  r.startedAt,
  r.endedAt
FROM Round r
INNER JOIN Player p ON r.dealerPlayerId = p.id
WHERE r.hanchanId = :hanchanId
ORDER BY r.roundNumber ASC
LIMIT :limit
OFFSET :offset
```

### 打点記録取得

各局の打点記録を取得

```sql
SELECT 
  s.id,
  s.roundId,
  s.playerId,
  p.name as playerName,
  s.scoreChange,
  s.isDealer,
  s.isWinner,
  s.isRonTarget,
  s.han,
  s.fu,
  s.yaku
FROM Score s
INNER JOIN Player p ON s.playerId = p.id
WHERE s.roundId = :roundId
ORDER BY s.scoreChange DESC
```

## 実装メモ

- デフォルトで局番号の昇順（1-16）でソート
- ページネーションをサポート（`limit`、`offset`）
- 局が完了していない場合、`resultType`と`scores`は空配列または`null`

## 関連ドキュメント

- `design/api/players-history.md`: 参加者履歴取得API
- `design/api/hanchans-statistics.md`: 半荘統計取得API
- `design/mahjong-data-model.md`: データモデル設計書

