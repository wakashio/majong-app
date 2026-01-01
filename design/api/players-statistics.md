# 参加者統計取得API

## 概要

参加者の統計情報を取得するAPIです。参加者の成績、和了回数、放銃回数、平均順位などの統計情報を返します。

## エンドポイント

```
GET /api/players/:id/statistics
```

## リクエスト

### パスパラメータ

- `id`: UUID、必須、参加者ID

### クエリパラメータ

なし

## レスポンス

### 成功レスポンス (200 OK)

```typescript
{
  "data": {
    "playerId": "550e8400-e29b-41d4-a716-446655440000",
    "playerName": "参加者1",
    "totalHanchans": 10,
    "totalRounds": 150,
    "totalWins": 25,
    "totalTsumo": 15,
    "totalRon": 10,
    "totalRonTarget": 8,
    "averageRank": 2.5,
    "totalFinalScore": 250000,
    "maxScore": 35000,
    "minScore": 15000,
    "winRate": 0.167,
    "ronTargetRate": 0.053
  }
}
```

### エラーレスポンス

#### 404 Not Found

```typescript
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Player not found"
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
interface PlayerStatisticsResponse {
  data: {
    playerId: string;
    playerName: string;
    totalHanchans: number;
    totalRounds: number;
    totalWins: number;
    totalTsumo: number;
    totalRon: number;
    totalRonTarget: number;
    averageRank: number;
    totalFinalScore: number;
    maxScore: number;
    minScore: number;
    winRate: number;
    ronTargetRate: number;
  };
}
```

## 統計項目の説明

- `totalHanchans`: 参加した半荘数
- `totalRounds`: 参加した局数
- `totalWins`: 総和了回数（ツモ + ロン）
- `totalTsumo`: ツモ回数
- `totalRon`: ロン回数
- `totalRonTarget`: 放銃回数（ロンの対象になった回数）
- `averageRank`: 平均順位（1.0-4.0）
- `totalFinalScore`: 返し点換算した合計最終得点（各半荘の`(finalScoreWithUmaOka - returnScore) / 1000`の合計、単位: 点（1000点単位））
- `maxScore`: 最高最終得点（ウマオカ考慮前の`finalScore`の最大値）
- `minScore`: 最低最終得点
- `winRate`: 和了率（総和了回数 / 参加局数）
- `ronTargetRate`: 放銃率（放銃回数 / 参加局数）

## 計算ロジック

### 参加した半荘数

```sql
SELECT COUNT(DISTINCT hanchanId)
FROM HanchanPlayer
WHERE playerId = :playerId
```

### 参加した局数

```sql
SELECT COUNT(*)
FROM Round r
INNER JOIN HanchanPlayer hp ON r.hanchanId = hp.hanchanId
WHERE hp.playerId = :playerId
```

### 総和了回数

```sql
SELECT COUNT(*)
FROM Score s
WHERE s.playerId = :playerId
  AND s.isWinner = true
```

### ツモ回数

```sql
SELECT COUNT(DISTINCT s.roundId)
FROM Score s
INNER JOIN Round r ON s.roundId = r.id
WHERE s.playerId = :playerId
  AND s.isWinner = true
  AND r.resultType = 'TSUMO'
```

### ロン回数

```sql
SELECT COUNT(DISTINCT s.roundId)
FROM Score s
INNER JOIN Round r ON s.roundId = r.id
WHERE s.playerId = :playerId
  AND s.isWinner = true
  AND r.resultType = 'RON'
```

### 放銃回数

```sql
SELECT COUNT(*)
FROM Score s
WHERE s.playerId = :playerId
  AND s.isRonTarget = true
```

### 平均順位

各半荘での順位を計算し、平均を算出

```sql
SELECT AVG(rank)
FROM (
  SELECT 
    hp.hanchanId,
    hp.playerId,
    ROW_NUMBER() OVER (PARTITION BY hp.hanchanId ORDER BY hp.finalScore DESC) as rank
  FROM HanchanPlayer hp
  WHERE hp.playerId = :playerId
    AND hp.finalScore IS NOT NULL
) subquery
```

### 返し点換算した合計最終得点

`finalScoreWithUmaOka`は既に返し点を引いた値になっているため、単に1000で割るだけでよい。

計算ロジック:
1. 各半荘の`HanchanPlayer`から`finalScoreWithUmaOka`を取得
2. 各半荘ごとに`finalScoreWithUmaOka / 1000`を計算
3. すべての半荘の変換後の値を合計

```typescript
// 疑似コード
let totalFinalScore = 0;
for (const hanchanPlayer of hanchanPlayers) {
  if (hanchanPlayer.finalScoreWithUmaOka !== null) {
    const convertedScore = hanchanPlayer.finalScoreWithUmaOka / 1000;
    totalFinalScore += convertedScore;
  }
}
```

### 最高最終得点

```sql
SELECT MAX(finalScore)
FROM HanchanPlayer
WHERE playerId = :playerId
  AND finalScore IS NOT NULL
```

### 最低最終得点

```sql
SELECT MIN(finalScore)
FROM HanchanPlayer
WHERE playerId = :playerId
  AND finalScore IS NOT NULL
```

## 実装メモ

- 統計情報はリアルタイムで計算する（キャッシュは不要）
- パフォーマンスを考慮し、必要に応じてインデックスを追加
- 計算結果は小数点以下3桁まで表示

## 関連ドキュメント

- `design/api/hanchans-statistics.md`: 半荘統計取得API
- `design/api/players-history.md`: 参加者履歴取得API
- `design/mahjong-data-model.md`: データモデル設計書

