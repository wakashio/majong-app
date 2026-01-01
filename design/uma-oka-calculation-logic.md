# ウマオカ計算ロジック設計書

## 概要

麻雀のウマオカ計算ロジックの設計書です。半荘終了時に、各参加者の最終得点をウマオカを考慮して計算します。

## 計算ルール

### ウマオカの定義

- **オカ（オカ）**: 返し点と持ち点の差（計算には使用しないが、返り値として返す）
  - デフォルト: 25000持ち30000返しの場合、`oka = 30000 - 25000 = 5000`
  - 実際の計算では、全員から返し点（`returnScore`）を減算し、1位に20000を加算する
- **ウマ**: 順位による点数の加減
  - デフォルト: 1位+30、2位+10、3位-10、4位-30（1000点単位で表現）
  - 実際の計算では1000倍される（1位+30000点、2位+10000点、3位-10000点、4位-30000点）
  - 順位に応じて異なる値が適用される

### 計算手順

1. **現在の持ち点を計算**
   - 各参加者の`initialScore`（開始点数）に、全局の`scoreChange`（点数変動）の合計を加算
   - `currentScore = initialScore + SUM(scoreChange)`

2. **順位を決定**
   - `currentScore`を降順にソート
   - 同点の場合は元の順序を維持（先に出現した方が上位）
   - 順位は1位から4位まで

3. **オカを計算**（返り値として返すが、実際の計算には使用しない）
   - `oka = returnScore - initialScore`
   - デフォルト: `oka = 30000 - 25000 = 5000`
   - 実際の計算では、全員から返し点（`returnScore`）を減算し、1位に20000を加算する

4. **ウマを取得**
   - 順位に応じてウマを取得（1000点単位で表現）
   - デフォルト: 1位+30、2位+10、3位-10、4位-30
   - 実際の計算では1000倍される（1位+30000点、2位+10000点、3位-10000点、4位-30000点）

5. **最終得点を計算**
   - 全員から返し点（`returnScore`）を減算
   - 1位に20000を加算
   - 各順位に応じた`uma`を加算
   - 計算式:
     - 1位: `finalScore = currentScore - returnScore + 20000 + uma`
     - 2位以下: `finalScore = currentScore - returnScore + uma`

## 計算式

### 基本計算

```
oka = returnScore - initialScore
```

### 最終得点の計算

```
1位: finalScore = currentScore - returnScore + 20000 + uma[0]
2位: finalScore = currentScore - returnScore + uma[1]
3位: finalScore = currentScore - returnScore + uma[2]
4位: finalScore = currentScore - returnScore + uma[3]
```

### デフォルト設定の例

- `initialScore = 25000`
- `returnScore = 30000`
- `oka = 5000`（計算には使用しないが、返り値として返す）
- `uma = [30, 10, -10, -30]`

例: 1位の参加者の`currentScore = 30000`の場合
- `finalScore = 30000 - 30000 + 20000 + 30000 = 50000`

例: 2位の参加者の`currentScore = 25000`の場合
- `finalScore = 25000 - 30000 + 10000 = 5000`

## データモデル

### HanchanPlayer

```prisma
model HanchanPlayer {
  id                String   @id @default(uuid())
  hanchanId         String
  playerId          String
  seatPosition      Int      // 0-3
  initialScore      Int      @default(25000)
  finalScore        Int?     // ウマオカ考慮前の値（currentScore）
  finalScoreWithUmaOka Int?  // ウマオカ考慮後の値
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  hanchan Hanchan @relation(fields: [hanchanId], references: [id], onDelete: Cascade)
  player  Player  @relation(fields: [playerId], references: [id], onDelete: Cascade)

  @@unique([hanchanId, playerId])
  @@unique([hanchanId, seatPosition])
  @@index([hanchanId])
  @@index([playerId])
}
```

### フィールドの説明

- `finalScore`: ウマオカ考慮前の最終持ち点（`currentScore`と同じ値）
- `finalScoreWithUmaOka`: ウマオカ考慮後の最終得点

## 実装方針

### サービス層

`backend/src/services/umaOkaCalculationService.ts`の`calculateUmaOka`関数を修正:

```typescript
export function calculateUmaOka(
  playerScores: PlayerScore[],
  config: UmaOkaConfig = {
    initialScore: 25000,
    returnScore: 30000,
    uma: [30, 10, -10, -30],
  }
): FinalScore[] {
  // 1. 持ち点でソート（降順、同点の場合は元の順序を維持）
  const sortedScores = [...playerScores].sort((a, b) => {
    if (b.currentScore !== a.currentScore) {
      return b.currentScore - a.currentScore;
    }
    const originalIndexA = playerScores.findIndex((p) => p.playerId === a.playerId);
    const originalIndexB = playerScores.findIndex((p) => p.playerId === b.playerId);
    return originalIndexA - originalIndexB;
  });

  // 2. 順位を決定
  const rankedScores: (PlayerScore & { rank: number })[] = sortedScores.map((score, index) => ({
    ...score,
    rank: index + 1,
  }));

  // 3. オカを計算
  const oka = config.returnScore - config.initialScore;

  // 4. 各プレイヤーの最終得点を計算
  const finalScores: FinalScore[] = rankedScores.map((rankedScore) => {
    // ウマの値は1000点単位なので、1000倍する
    const uma = config.uma[rankedScore.rank - 1] * 1000;
    
    // 全員から返し点を減算
    let finalScore = rankedScore.currentScore - config.returnScore + uma;
    
    // 1位に20000を加算
    if (rankedScore.rank === 1) {
      finalScore += 20000;
    }

    return {
      playerId: rankedScore.playerId,
      currentScore: rankedScore.currentScore,
      rank: rankedScore.rank,
      oka,
      uma,
      finalScore: Math.round(finalScore),
    };
  });

  return finalScores;
}
```

### 半荘終了処理

`backend/src/services/hanchanService.ts`の`update`関数を修正:

- `finalScore`: `currentScore`をそのまま保存
- `finalScoreWithUmaOka`: ウマオカ計算後の値を保存

## テスト方針

- 正常系のテスト（デフォルト設定、カスタム設定）
- 全員から返し点が正しく減算されることを確認
- 1位に20000が正しく加算されることを確認
- 2位以下に20000が加算されないことを確認
- 同点時の順位決定のテスト
- エッジケースのテスト（極端な点数差、同点など）

## 関連ドキュメント

- `design/mahjong-data-model.md`: データモデル設計書
- `design/api/hanchans-update.md`: 半荘更新API
- `backend/src/services/umaOkaCalculationService.ts`: ウマオカ計算サービス

