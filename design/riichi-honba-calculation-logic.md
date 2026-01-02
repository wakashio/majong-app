# 積み棒・本場の計算ロジック設計書

## 概要

麻雀の積み棒（リーチ棒）と本場の計算ロジックの設計書です。局終了時に次局への積み棒と本場を自動計算します。

## 計算ルール

### 積み棒（riichiSticks）の計算

積み棒は局開始時の積み棒数に、局中に宣言されたリーチ数を加算して計算します。

#### 局開始時の積み棒

- 前局から持ち越された積み棒数
- 局開始時に`riichiSticks`として記録

#### 局中のリーチ宣言

- リーチ宣言時に1000点を供託
- 局の`riichiSticks`に1を加算（`roundService.createRiichi`で実装済み）

#### 局終了時の積み棒の処理

1. **和了した場合（ツモ・ロン）**
   - 和了者が積み棒を獲得（打点計算に含まれる）
   - 次局の積み棒は0にリセット

2. **流局した場合（通常流局・特殊流局）**
   - 積み棒は次局に持ち越される
   - 次局の積み棒 = 現在の積み棒数（変更なし）

3. **流し満貫の場合**
   - 流し満貫を達成した参加者が積み棒を獲得（打点計算に含まれる）
   - 次局の積み棒は0にリセット

### 本場（honba）の計算

本場は局終了時の結果に基づいて次局の本場を計算します。

#### 局開始時の本場

- 前局から持ち越された本場数
- 局開始時に`honba`として記録

#### 局終了時の本場の処理

1. **親が和了した場合（ツモ・ロン）**
   - 次局の本場 = 現在の本場 + 1
   - 連荘（`isRenchan: true`）になる

2. **子が和了した場合（ツモ・ロン）**
   - 次局の本場 = 0（リセット）
   - 連荘にならない（`isRenchan: false`）

3. **通常の流局（荒牌流局）**
   - 親がテンパイしている場合: 次局の本場 = 現在の本場 + 1、連荘になる（`isRenchan: true`）
   - 親がノーテンの場合: 次局の本場 = 現在の本場 + 1、連荘にならない（`isRenchan: false`）

4. **流し満貫**
   - 次局の本場 = 0（リセット）
   - 連荘にならない（`isRenchan: false`）

5. **特殊流局（四槓、四風、九種九牌）**
   - 親がテンパイしている場合: 次局の本場 = 現在の本場 + 1、連荘になる（`isRenchan: true`）
   - 親がノーテンの場合: 次局の本場 = 現在の本場 + 1、連荘にならない（`isRenchan: false`）

## 計算式

### 次局の積み棒の計算

```typescript
function calculateNextRiichiSticks(
  currentRiichiSticks: number,
  resultType: RoundResultType
): number {
  // 和了または流し満貫の場合、積み棒はリセット
  if (
    resultType === RoundResultType.TSUMO ||
    resultType === RoundResultType.RON ||
    resultType === RoundResultType.NAGASHI_MANGAN
  ) {
    return 0;
  }
  // 流局の場合、積み棒は持ち越される
  return currentRiichiSticks;
}
```

### 次局の本場の計算

```typescript
function calculateNextHonba(
  currentHonba: number,
  resultType: RoundResultType,
  isDealerWinner: boolean,
  isDealerTenpai?: boolean
): number {
  // 親が連荘する場合（親が和了した場合、または流局で親がテンパイした場合）
  if (isDealerRenchan(resultType, isDealerWinner, isDealerTenpai)) {
    return currentHonba + 1;
  }
  // 子が和了した場合、または流し満貫の場合
  if (
    resultType === RoundResultType.TSUMO ||
    resultType === RoundResultType.RON ||
    resultType === RoundResultType.NAGASHI_MANGAN
  ) {
    return 0;
  }
  // 流局で親がノーテンの場合（連荘ではないが本場は増加）
  if (
    (resultType === RoundResultType.DRAW || resultType === RoundResultType.SPECIAL_DRAW) &&
    isDealerTenpai !== true
  ) {
    return currentHonba + 1;
  }
  // その他の場合
  return currentHonba;
}
```

### 親が連荘する条件を判定する共通関数

```typescript
export function isDealerRenchan(
  resultType: RoundResultType,
  isDealerWinner: boolean,
  isDealerTenpai?: boolean
): boolean {
  // 親が和了した場合
  if (isDealerWinner) {
    return true;
  }
  // 流局（通常の流局・特殊流局）で親がテンパイしていた場合
  if (
    (resultType === RoundResultType.DRAW || resultType === RoundResultType.SPECIAL_DRAW) &&
    isDealerTenpai === true
  ) {
    return true;
  }
  return false;
}
```

### 連荘の判定

```typescript
// 親が連荘する条件を判定する共通関数（上記のisDealerRenchanを使用）
function calculateIsRenchan(
  resultType: RoundResultType,
  isDealerWinner: boolean,
  isDealerTenpai?: boolean
): boolean {
  return isDealerRenchan(resultType, isDealerWinner, isDealerTenpai);
}
```

## 局作成時の連荘判定と本場設定

局作成時に、前局の結果から連荘を判定し、本場を自動設定します。

### 前局の取得方法

1. **通常の場合（連荘でない場合）**
   - 同じ`hanchanId`で、`roundNumber`が1つ前の局を取得
   - 例: 局番号5を作成する場合、局番号4を取得

2. **連荘の場合**
   - 同じ`hanchanId`で、同じ`roundNumber`で`honba`が1つ前の局を取得
   - 例: 局番号4、本場2を作成する場合、局番号4、本場1を取得

### 連荘判定と本場設定のロジック

1. **前局が存在する場合**
   - 前局の`scores`から`isDealerWinner`を取得
   - 前局の`scores`から`isDealerTenpai`を取得
   - `calculateIsRenchan`関数を使用して連荘を判定
   - `calculateNextHonba`関数を使用して次局の本場を計算
   - 計算された本場を局作成時に設定

2. **前局が存在しない場合（1局目など）**
   - デフォルト値（本場0）を使用

### `isRenchan`フィールドの削除

- `isRenchan`フィールドは不要であるため、削除する
- 連荘の判定は前局の結果から計算可能なため、データベースに保存する必要がない
- 削除対象:
  - データベーススキーマ（`Round`モデル）
  - 型定義（`backend/src/types/round.ts`、`frontend/src/types/round.ts`）
  - APIレスポンス（`roundController.list`、`roundController.get`、`roundController.create`）
  - フロントエンドでの送信（`RoundManageView.vue`）

## 実装方針

### サービス層

- `backend/src/services/riichiHonbaCalculationService.ts`に実装
- 純粋関数として実装（副作用なし）
- 型安全性を確保

### 共通関数の作成

- `isDealerRenchan`関数を作成（export）
  - 親が和了した場合、または流局（通常の流局・特殊流局）で親がテンパイした場合に`true`を返す
  - 他のサービス（`roundService.ts`、`roundController.ts`など）からも使用可能にする

### 関数の修正

- `calculateNextHonba`関数を修正
  - 共通関数`isDealerRenchan`を使用して連荘判定を行う
  - 流局で親がノーテンの場合も本場+1を返すように修正（連荘判定とは独立）
  - 特殊流局で親がテンパイした場合も本場を+1する（実装済み、設計ドキュメントを更新）
- `calculateIsRenchan`関数を修正
  - 共通関数`isDealerRenchan`を使用してロジックを簡潔化

### 局作成時の処理

- `backend/src/services/roundService.ts`の`create`関数を修正
  - 前局を取得（同じ`hanchanId`で、`roundNumber`が1つ前、または連荘の場合は同じ`roundNumber`で`honba`が1つ前）
  - 前局が存在する場合、前局の結果から連荘を判定
  - 前局の`scores`から親のテンパイ情報を取得
  - 連荘に応じて本場を設定（`calculateNextHonba`関数を使用）
  - 前局が存在しない場合（1局目など）は、デフォルト値（本場0）を使用

### 関数設計

```typescript
// 親が連荘する条件を判定する共通関数（他のサービスでも使用可能）
export function isDealerRenchan(
  resultType: RoundResultType,
  isDealerWinner: boolean,
  isDealerTenpai?: boolean
): boolean;

// 次局の積み棒を計算
function calculateNextRiichiSticks(
  currentRiichiSticks: number,
  resultType: RoundResultType
): number;

// 次局の本場を計算
function calculateNextHonba(
  currentHonba: number,
  resultType: RoundResultType,
  isDealerWinner: boolean,
  isDealerTenpai?: boolean
): number;

// 連荘を判定
function calculateIsRenchan(
  resultType: RoundResultType,
  isDealerWinner: boolean,
  isDealerTenpai?: boolean
): boolean;

// 次局の積み棒・本場・連荘を一括計算
function calculateNextRoundSettings(params: {
  currentRiichiSticks: number;
  currentHonba: number;
  resultType: RoundResultType;
  isDealerWinner: boolean;
  isDealerTenpai?: boolean;
}): {
  nextRiichiSticks: number;
  nextHonba: number;
  isRenchan: boolean;
};

// 次の局の番号を計算
function calculateNextRoundNumber(
  currentRoundNumber: number,
  isRenchan: boolean
): number {
  // 連荘の場合: 現在の局番号を維持
  if (isRenchan) {
    return currentRoundNumber;
  }
  // 連荘でない場合: 局番号+1（最大16局まで）
  return Math.min(currentRoundNumber + 1, 16);
}

// 次の局の風を計算
function calculateNextWind(
  currentRoundNumber: number,
  isRenchan: boolean
): "EAST" | "SOUTH" | "WEST" | "NORTH" {
  // 連荘の場合: 現在の風を維持（局番号から計算）
  if (isRenchan) {
    if (currentRoundNumber >= 1 && currentRoundNumber <= 4) return "EAST";
    if (currentRoundNumber >= 5 && currentRoundNumber <= 8) return "SOUTH";
    if (currentRoundNumber >= 9 && currentRoundNumber <= 12) return "WEST";
    if (currentRoundNumber >= 13 && currentRoundNumber <= 16) return "NORTH";
    return "EAST";
  }
  // 連荘でない場合: 次の風（局番号+1から計算）
  const nextRoundNumber = currentRoundNumber + 1;
  if (nextRoundNumber >= 1 && nextRoundNumber <= 4) return "EAST";
  if (nextRoundNumber >= 5 && nextRoundNumber <= 8) return "SOUTH";
  if (nextRoundNumber >= 9 && nextRoundNumber <= 12) return "WEST";
  if (nextRoundNumber >= 13 && nextRoundNumber <= 16) return "NORTH";
  return "EAST";
}
```

### エラーハンドリング

- 無効な入力値の場合はエラーを返す
- エラーメッセージは日本語で記述

## テスト方針

- 正常系のテスト（各種結果タイプでの計算）
- 異常系のテスト（無効な入力値）
- エッジケースのテスト（本場・積み棒の境界値）

## 関連ドキュメント

- `design/api/rounds-end.md`: 局終了API
- `design/api/rounds-calculate-score.md`: 打点計算API
- `design/score-calculation-logic.md`: 打点計算ロジック設計書
- `design/mahjong-data-model.md`: データモデル設計書

