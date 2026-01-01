# リーチ記録と点数変動の記録の連動

## 概要

リーチ記録と点数変動の記録を連動させる設計です。リーチ記録追加/削除時に点数変動をリアルタイムで更新するのではなく、局終了時にリーチ記録、本場、積み棒の点数変動を一括で計算して統合する方針です。

## 背景

### 問題点

- リーチ記録を追加/削除したときに、点数変動の表示（打点記録テーブル）と点数変動の記録（データベースへの保存）がリアルタイムで更新されていない
- 特に、局が終了していない状態でリーチ記録を追加/削除した場合、点数変動の表示が更新されない
- リーチ宣言時は-1000点の支払いが発生するため、リーチ記録の追加/削除に応じて点数変動の表示と記録の両方を自動的に更新されるべき

### 決定事項

- **リアルタイム更新は不要である**
- **局終了時に、リーチ記録と本場の点数算出を一括で行う方針に統一する**
- リーチ記録追加時: Scoreを作成しない（`riichiSticks`の更新のみ）
- 局終了時: 以下を一括で計算し、`scoreChange`に統合してScoreに記録する
  - リーチ記録による点数変動（-1000点 × リーチ者数）
  - 本場による点数変動（親子の判定と結果タイプに応じて計算）
  - 和了・流局による点数変動
  - 積み棒による点数変動（和了者が獲得）

## 実装方針

### バックエンド

#### `createRoundAction`関数（`backend/src/services/roundService.ts`）

- リーチ記録追加時（`type === RoundActionType.RIICHI`）に、Scoreを作成しない
- `riichiSticks`の更新のみ行う（既存の実装を維持）
- トランザクション内でリーチ記録と`riichiSticks`の更新を行う

#### `deleteRoundAction`関数（`backend/src/services/roundService.ts`）

- リーチ記録削除時に、Scoreを削除しない
- `riichiSticks`の更新のみ行う（既存の実装を維持）
- トランザクション内でリーチ記録と`riichiSticks`の更新を行う

#### `endRound`関数（`backend/src/services/roundService.ts`）

- 局終了時に、リーチ記録による点数変動を計算する
  - `round.actions`からリーチ記録（`type === RoundActionType.RIICHI`）を取得
  - 各リーチ者に対して-1000点を計算
- 局終了時に、本場による点数変動を計算する
  - 親子の判定と結果タイプ（ツモ・ロン）に応じて本場による点数変動を計算
  - 親がツモ: 子1人あたり`-round.honba × 300`点
  - 子がツモ: 親から`-round.honba × 300`点、子から`-round.honba × 100`点
  - 親がロン: 放銃者から`-round.honba × 300`点
  - 子がロン（親から）: 放銃者（親）から`-round.honba × 300`点
  - 子がロン（子から）: 放銃者（子）から`-round.honba × 100`点
- 局終了時に、積み棒による点数変動を計算する
  - 和了時（ツモ・ロン）: 和了者が`round.riichiSticks × 1000`点を獲得
  - 流し満貫時: 流し満貫を達成した参加者が`round.riichiSticks × 1000`点を獲得
  - 流局時: 積み棒による点数変動は0（次局に持ち越される）
- リーチ記録による点数変動、本場による点数変動、積み棒による点数変動を、和了・流局による点数変動（`data.scores`の`scoreChange`）に加算して統合する
- 統合された`scoreChange`でScoreを作成する
- トランザクション内で処理する

### フロントエンド

#### `RoundManageView.vue`

- 局終了前は打点記録テーブルを表示しない、または空の状態で表示する
- `getDisplayScores`関数は、Scoreから直接値を取得して表示する形に変更（既存の実装を維持）
- リーチ記録追加/削除時に`loadRoundData`を呼び出して、Scoreを再読み込みする（局終了前はScoreが存在しないため、空の配列が返される）

#### `useRoundDisplay.ts`

- `getDisplayScores`関数は、`roundScores`から直接取得する（既存の実装を維持）
- リーチ記録があるがScoreが存在しない参加者について仮想的なScoreを作成する処理は削除済み

### テスト

#### `backend/tests/integration/rounds.test.ts`

- リーチ記録追加時にScoreが作成されないことを確認
- リーチ記録削除時にScoreが削除されないことを確認
- 局終了時にリーチ記録による点数変動が正しく計算され、Scoreに統合されることを確認

## 関連API

- `POST /api/rounds/:id/actions` - 局アクション記録追加API（`design/api/rounds-actions-create.md`）
- `DELETE /api/rounds/:id/actions/:actionId` - 局アクション記録削除API（`design/api/rounds-actions-delete.md`）
- `PUT /api/rounds/:id/end` - 局終了API（`design/api/rounds-end.md`）

## 関連議事録

- `11-meeting-notes.md` (2026-01-01 リーチ記録と点数変動の記録が連動していない)
- `11-meeting-notes.md` (2026-01-01 リーチ記録と本場の点数算出を「局を終了」時に行うように統一したい)

## 備考

- リーチ記録を追加/削除したときに、点数変動の表示と記録の両方を自動的に更新することで、ユーザーがリアルタイムで点数変動を確認できるようになる
- 局終了時にリーチ記録によるScoreと局終了時のScoreを統合することで、打点記録にリーチの点数が正しく反映されるようになる
- 局終了時に一括で計算する方針により、処理のタイミングが明確になり、ロジックが簡素化される
- 本場と積み棒による点数移動も`scoreChange`に統合するため、Scoreモデルに追加のフィールドは不要である

