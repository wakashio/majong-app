# 半荘統計取得API

## 概要

半荘の統計情報を取得するAPIです。半荘の参加者、最終得点、順位、局数、和了回数などの統計情報を返します。

## エンドポイント

```
GET /api/hanchans/:id/statistics
```

## リクエスト

### パスパラメータ

- `id`: UUID、必須、半荘ID

### クエリパラメータ

なし

## レスポンス

### 成功レスポンス (200 OK)

```typescript
{
  "data": {
    "hanchanId": "550e8400-e29b-41d4-a716-446655440000",
    "hanchanName": "半荘1",
    "startedAt": "2025-12-30T00:00:00.000Z",
    "endedAt": "2025-12-30T02:00:00.000Z",
    "status": "COMPLETED",
    "totalRounds": 16,
    "players": [
      {
        "playerId": "550e8400-e29b-41d4-a716-446655440000",
        "playerName": "参加者1",
        "seatPosition": 0,
        "initialScore": 25000,
        "currentScore": 30000,
        "currentRank": 1,
        "finalScore": 30000,
        "rank": 1,
        "totalWins": 5,
        "totalTsumo": 3,
        "totalRon": 2,
        "totalRonTarget": 1,
        "totalDraws": 2
      },
      {
        "playerId": "550e8400-e29b-41d4-a716-446655440001",
        "playerName": "参加者2",
        "seatPosition": 1,
        "initialScore": 25000,
        "currentScore": 25000,
        "currentRank": 2,
        "finalScore": 25000,
        "rank": 2,
        "totalWins": 4,
        "totalTsumo": 2,
        "totalRon": 2,
        "totalRonTarget": 2,
        "totalDraws": 3
      },
      {
        "playerId": "550e8400-e29b-41d4-a716-446655440002",
        "playerName": "参加者3",
        "seatPosition": 2,
        "initialScore": 25000,
        "currentScore": 20000,
        "currentRank": 3,
        "finalScore": 20000,
        "rank": 3,
        "totalWins": 3,
        "totalTsumo": 1,
        "totalRon": 2,
        "totalRonTarget": 3,
        "totalDraws": 4
      },
      {
        "playerId": "550e8400-e29b-41d4-a716-446655440003",
        "playerName": "参加者4",
        "seatPosition": 3,
        "initialScore": 25000,
        "currentScore": 25000,
        "currentRank": 4,
        "finalScore": 25000,
        "rank": 4,
        "totalWins": 4,
        "totalTsumo": 2,
        "totalRon": 2,
        "totalRonTarget": 2,
        "totalDraws": 2
      }
    ]
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
interface HanchanStatisticsResponse {
  data: {
    hanchanId: string;
    hanchanName?: string;
    startedAt: string;
    endedAt?: string;
    status: "IN_PROGRESS" | "COMPLETED";
    totalRounds: number;
    players: {
      playerId: string;
      playerName: string;
      seatPosition: number;
      initialScore: number;
      currentScore: number;
      currentRank: number;
      finalScore?: number;
      rank?: number;
      totalWins: number;
      totalTsumo: number;
      totalRon: number;
      totalRonTarget: number;
      totalDraws: number;
    }[];
  };
}
```

## 統計項目の説明

- `totalRounds`: 局数
- `players`: 参加者ごとの統計情報
  - `seatPosition`: 席順（0-3）
  - `initialScore`: 開始点数
  - `currentScore`: 現在の持ち点（初期得点 + これまでの得点変動の合計）
  - `currentRank`: 現在の順位（1-4、現在の持ち点順）
  - `finalScore`: 最終得点（半荘が完了している場合のみ）
  - `rank`: 最終順位（1-4、半荘が完了している場合のみ）
  - `totalWins`: 和了回数（ツモ + ロン）
  - `totalTsumo`: ツモ回数
  - `totalRon`: ロン回数
  - `totalRonTarget`: 放銃回数
  - `totalDraws`: 流局回数

## 計算ロジック

### 局数

```sql
SELECT COUNT(*)
FROM Round
WHERE hanchanId = :hanchanId
```

### 参加者ごとの和了回数

```sql
SELECT 
  s.playerId,
  COUNT(*) as totalWins
FROM Score s
INNER JOIN Round r ON s.roundId = r.id
WHERE r.hanchanId = :hanchanId
  AND s.isWinner = true
GROUP BY s.playerId
```

### 参加者ごとのツモ回数

```sql
SELECT 
  s.playerId,
  COUNT(DISTINCT s.roundId) as totalTsumo
FROM Score s
INNER JOIN Round r ON s.roundId = r.id
WHERE r.hanchanId = :hanchanId
  AND s.isWinner = true
  AND r.resultType = 'TSUMO'
GROUP BY s.playerId
```

### 参加者ごとのロン回数

```sql
SELECT 
  s.playerId,
  COUNT(DISTINCT s.roundId) as totalRon
FROM Score s
INNER JOIN Round r ON s.roundId = r.id
WHERE r.hanchanId = :hanchanId
  AND s.isWinner = true
  AND r.resultType = 'RON'
GROUP BY s.playerId
```

### 参加者ごとの放銃回数

```sql
SELECT 
  s.playerId,
  COUNT(*) as totalRonTarget
FROM Score s
INNER JOIN Round r ON s.roundId = r.id
WHERE r.hanchanId = :hanchanId
  AND s.isRonTarget = true
GROUP BY s.playerId
```

### 参加者ごとの流局回数

```sql
SELECT 
  hp.playerId,
  COUNT(DISTINCT r.id) as totalDraws
FROM Round r
INNER JOIN HanchanPlayer hp ON r.hanchanId = hp.hanchanId
WHERE r.hanchanId = :hanchanId
  AND r.resultType IN ('DRAW', 'SPECIAL_DRAW', 'NAGASHI_MANGAN')
GROUP BY hp.playerId
```

### 現在の持ち点

各参加者の初期得点に、これまでの局での得点変動を合計して現在の持ち点を計算

```sql
SELECT 
  hp.playerId,
  hp.initialScore + COALESCE(SUM(s.scoreChange), 0) as currentScore
FROM HanchanPlayer hp
LEFT JOIN Score s ON s.playerId = hp.playerId
INNER JOIN Round r ON s.roundId = r.id AND r.hanchanId = hp.hanchanId
WHERE hp.hanchanId = :hanchanId
GROUP BY hp.playerId, hp.initialScore
```

### 現在の順位

現在の持ち点を降順にソートして順位を決定（半荘が完了していない場合でも計算）

```sql
SELECT 
  playerId,
  currentScore,
  ROW_NUMBER() OVER (ORDER BY currentScore DESC) as currentRank
FROM (
  SELECT 
    hp.playerId,
    hp.initialScore + COALESCE(SUM(s.scoreChange), 0) as currentScore
  FROM HanchanPlayer hp
  LEFT JOIN Score s ON s.playerId = hp.playerId
  INNER JOIN Round r ON s.roundId = r.id AND r.hanchanId = hp.hanchanId
  WHERE hp.hanchanId = :hanchanId
  GROUP BY hp.playerId, hp.initialScore
) subquery
ORDER BY currentScore DESC
```

### 最終順位

最終得点を降順にソートして順位を決定（半荘が完了している場合のみ）

```sql
SELECT 
  playerId,
  finalScore,
  ROW_NUMBER() OVER (ORDER BY finalScore DESC) as rank
FROM HanchanPlayer
WHERE hanchanId = :hanchanId
  AND finalScore IS NOT NULL
ORDER BY finalScore DESC
```

## 実装メモ

- 統計情報はリアルタイムで計算する（キャッシュは不要）
- パフォーマンスを考慮し、必要に応じてインデックスを追加
- 半荘が完了していない場合、`finalScore`と`rank`は`null`または`undefined`
- `currentScore`と`currentRank`は半荘が完了していない場合でも計算される
- `currentScore`の計算: `initialScore + SUM(scoreChange)`（Scoreテーブルから該当半荘の全局の得点変動を合計）
- `currentRank`の計算: `currentScore`を降順にソートして順位を決定（同点の場合は`seatPosition`で順序を決定）

## 関連ドキュメント

- `design/api/players-statistics.md`: 参加者統計取得API
- `design/api/hanchans-history.md`: 半荘履歴取得API
- `design/mahjong-data-model.md`: データモデル設計書

