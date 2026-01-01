# セッション統計取得API

## 概要

セッション単位の統計情報を取得するAPIです。総局数、総時間、参加者ごとの成績などを返却します。

## エンドポイント

```
GET /api/sessions/:id/statistics
```

## リクエスト

### パスパラメータ

- `id`: セッションID（UUID）

## レスポンス

### 成功レスポンス (200 OK)

```typescript
{
  "data": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "totalRounds": 16,
    "totalHanchans": 2,
    "playerStatistics": [
      {
        "playerId": "参加者ID1",
        "playerName": "参加者名1",
        "totalWins": 5,
        "totalTsumo": 3,
        "totalRon": 2,
        "totalDealIn": 4,
        "totalFinalScore": 250000,
        "rank": 1
      },
      // ... 他の参加者
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
    "message": "Session not found"
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
interface PlayerStatistics {
  playerId: string;
  playerName: string;
  totalWins: number;
  totalTsumo: number;
  totalRon: number;
  totalDealIn: number;
  totalFinalScore: number;
  rank: number;
}

interface SessionStatistics {
  sessionId: string;
  totalRounds: number;
  totalHanchans: number;
  playerStatistics: PlayerStatistics[];
}

interface GetSessionStatisticsResponse {
  data: SessionStatistics;
}
```

## 実装メモ

- セッションに紐づく半荘の統計情報を集計する
- 参加者ごとの成績（和了回数、ツモ回数、ロン回数、放銃回数、返し点換算した合計最終得点、順位）を計算する
- 順位は返し点換算した合計最終得点で決定する（高い順）
- `totalFinalScore`: 各参加者の全半荘における返し点換算した合計最終得点（各半荘の`(finalScoreWithUmaOka - returnScore) / 1000`の合計、単位: 点（1000点単位））

### 返し点換算した合計最終得点の計算ロジック

`finalScoreWithUmaOka`は既に返し点を引いた値になっているため、単に1000で割るだけでよい。

計算ロジック:
1. 各半荘の`HanchanPlayer`から`finalScoreWithUmaOka`を取得
2. 各半荘ごとに`finalScoreWithUmaOka / 1000`を計算
3. すべての半荘の変換後の値を合計

```typescript
// 疑似コード
for (const player of players) {
  let totalFinalScore = 0;
  for (const hanchan of session.hanchans) {
    const hanchanPlayer = hanchan.hanchanPlayers.find(hp => hp.playerId === player.id);
    if (hanchanPlayer?.finalScoreWithUmaOka !== null) {
      const convertedScore = hanchanPlayer.finalScoreWithUmaOka / 1000;
      totalFinalScore += convertedScore;
    }
  }
  player.totalFinalScore = totalFinalScore;
}
```

