# RoundManageView.vue コンポーネント分割設計書

## 概要

`RoundManageView.vue`（現在1049行）を8つのコンポーネントに分割し、コードの可読性と保守性を向上させる。

## 分割方針

- 各コンポーネントは単一責任の原則に従い、UI表示とユーザーインタラクションに集中する
- ロジックは既存のComposables（`useRoundManagement`, `useRoundActions`, `useResultInput`, `useRoundDisplay`など）に集約し、コンポーネント間でのロジックの重複を避ける
- props/emitsで親子間のデータフローを明確にする（既存の`PlayerSelectButton.vue`のパターンを参考）
- コンポーネントは`frontend/src/components/`ディレクトリに配置する

## 実装順序

1. **表示系コンポーネント**（`HanchanInfoCard`, `HanchanDashboard`, `ActionList`, `ScoreTable`）
2. **インタラクション系コンポーネント**（`RoundActionButtons`, `RoundCard`）
3. **ダイアログ系コンポーネント**（`ActionAddDialog`, `ResultInputDialog`）

---

## 1. HanchanInfoCard コンポーネント

### コンポーネント情報

- **コンポーネント名**: `HanchanInfoCard`
- **ファイルパス**: `frontend/src/components/HanchanInfoCard.vue`
- **コンポーネントタイプ**: Vue 3 Composition API (`<script setup lang="ts">`)

### 責務

半荘情報（半荘名、参加者）を表示するカードコンポーネント。

### プロップス

| プロップス名 | 型 | 必須 | デフォルト値 | 説明 |
|------------|-----|------|------------|------|
| `hanchan` | `Hanchan \| null` | 必須 | - | 半荘情報（`name`, `hanchanPlayers`を含む） |

### イベント

なし

### スロット

なし

### 実装詳細

- `v-card`を使用してカード形式で表示
- 半荘名が存在しない場合は「無題」を表示
- 参加者は`hanchan.hanchanPlayers.map((hp) => hp.player.name).join(", ")`で表示

### 使用例

```vue
<HanchanInfoCard :hanchan="hanchan" />
```

---

## 2. HanchanDashboard コンポーネント

### コンポーネント情報

- **コンポーネント名**: `HanchanDashboard`
- **ファイルパス**: `frontend/src/components/HanchanDashboard.vue`
- **コンポーネントタイプ**: Vue 3 Composition API (`<script setup lang="ts">`)

### 責務

半荘の統計情報（参加者ごとの得点、順位、和了回数など）をテーブル形式で表示するダッシュボードコンポーネント。

### プロップス

| プロップス名 | 型 | 必須 | デフォルト値 | 説明 |
|------------|-----|------|------------|------|
| `hanchanStatistics` | `HanchanStatistics \| null` | 必須 | - | 半荘統計情報 |
| `isLoading` | `boolean` | 必須 | - | ローディング状態 |

### イベント

なし

### スロット

なし

### 実装詳細

- `v-data-table`を使用して統計情報をテーブル形式で表示
- ローディング中は`v-progress-linear`を表示
- テーブルヘッダー: `playerName`, `currentScore`, `currentRank`, `totalWins`, `totalRiichi`
- 順位は`v-chip`で色分け表示（`getRankColor`関数を使用）
- 得点は`toLocaleString()`でフォーマット

### 使用例

```vue
<HanchanDashboard
  :hanchan-statistics="hanchanStatistics"
  :is-loading="isLoadingStatistics"
/>
```

### 依存関係

- `useRoundDisplay`の`getRankColor`関数を使用

---

## 3. ActionList コンポーネント

### コンポーネント情報

- **コンポーネント名**: `ActionList`
- **ファイルパス**: `frontend/src/components/ActionList.vue`
- **コンポーネントタイプ**: Vue 3 Composition API (`<script setup lang="ts">`)

### 責務

鳴き・リーチ記録のリストを表示し、追加・削除のインタラクションを提供するコンポーネント。

### プロップス

| プロップス名 | 型 | 必須 | デフォルト値 | 説明 |
|------------|-----|------|------------|------|
| `roundId` | `string` | 必須 | - | 局ID |
| `actions` | `Array<RoundAction>` | 必須 | - | アクション（鳴き・リーチ）のリスト |
| `isLoading` | `boolean` | 必須 | - | ローディング状態 |

### イベント

| イベント名 | 型 | 説明 |
|----------|-----|------|
| `add` | `(roundId: string) => void` | アクション追加ボタンがクリックされたときに発火 |
| `delete` | `(roundId: string, actionId: string) => void` | アクション削除ボタンがクリックされたときに発火 |

### スロット

なし

### 実装詳細

- `v-list`を使用してアクションリストを表示
- 各アクションは`v-list-item`で表示
- アクションタイプに応じて表示テキストを変更（`getActionText`関数を使用）
- 鳴きの場合は対象参加者も表示
- 削除ボタンは各アイテムの`append`スロットに配置

### 使用例

```vue
<ActionList
  :round-id="round.id"
  :actions="getAllActions(round.id)"
  :is-loading="isLoading"
  @add="openActionDialog"
  @delete="handleDeleteAction"
/>
```

### 依存関係

- `useRoundActions`の`getActionText`関数を使用

---

## 4. ScoreTable コンポーネント

### コンポーネント情報

- **コンポーネント名**: `ScoreTable`
- **ファイルパス**: `frontend/src/components/ScoreTable.vue`
- **コンポーネントタイプ**: Vue 3 Composition API (`<script setup lang="ts">`)

### 責務

打点記録をテーブル形式で表示するコンポーネント（読み取り専用、局終了時のみ表示）。

### プロップス

| プロップス名 | 型 | 必須 | デフォルト値 | 説明 |
|------------|-----|------|------------|------|
| `roundId` | `string` | 必須 | - | 局ID |
| `scores` | `Array<Score>` | 必須 | - | 打点記録のリスト |
| `round` | `Round` | 必須 | - | 局情報（積み棒・本場の計算に使用） |

### イベント

なし

### スロット

なし

### 実装詳細

- `v-data-table`を使用して打点記録をテーブル形式で表示
- テーブルヘッダー: `playerName`, `scoreChange`, `riichiSticksScoreChange`, `honbaScoreChange`
- 点数変動は色分け表示（プラス: `text-success`, マイナス: `text-error`）
- 積み棒・本場による点数変動は`useScoreCalculation`の関数を使用して計算

### 使用例

```vue
<ScoreTable
  v-if="round.endedAt && getDisplayScores(round.id).length > 0"
  :round-id="round.id"
  :scores="getDisplayScores(round.id)"
  :round="round"
/>
```

### 依存関係

- `useScoreCalculation`の`getRiichiSticksScoreChangeForTable`, `getHonbaScoreChangeForTable`関数を使用
- `useRoundDisplay`の`getDisplayScores`関数を使用

---

## 5. RoundActionButtons コンポーネント

### コンポーネント情報

- **コンポーネント名**: `RoundActionButtons`
- **ファイルパス**: `frontend/src/components/RoundActionButtons.vue`
- **コンポーネントタイプ**: Vue 3 Composition API (`<script setup lang="ts">`)

### 責務

局のアクションボタン（局を終了、次局へ、削除）を表示するコンポーネント。

### プロップス

| プロップス名 | 型 | 必須 | デフォルト値 | 説明 |
|------------|-----|------|------------|------|
| `round` | `Round` | 必須 | - | 局情報 |
| `isLoading` | `boolean` | 必須 | - | ローディング状態 |

### イベント

| イベント名 | 型 | 説明 |
|----------|-----|------|
| `end` | `(roundId: string) => void` | 「局を終了」ボタンがクリックされたときに発火 |
| `next` | `(roundId: string) => void` | 「次局へ」ボタンがクリックされたときに発火 |
| `delete` | `(roundId: string) => void` | 「削除」ボタンがクリックされたときに発火 |

### スロット

なし

### 実装詳細

- `v-card-actions`を使用してボタンを配置
- 「局を終了」ボタン: 局が終了していない場合のみ有効
- 「次局へ」ボタン: 局が作成済みかつ終了済みの場合のみ表示
- 「削除」ボタン: 常に表示（エラー色、テキストバリアント）

### 使用例

```vue
<RoundActionButtons
  :round="round"
  :is-loading="isLoading"
  @end="openResultDialog"
  @next="handleNextRoundFromPanel"
  @delete="handleDeleteRound"
/>
```

---

## 6. RoundCard コンポーネント

### コンポーネント情報

- **コンポーネント名**: `RoundCard`
- **ファイルパス**: `frontend/src/components/RoundCard.vue`
- **コンポーネントタイプ**: Vue 3 Composition API (`<script setup lang="ts">`)

### 責務

局カード（ExpansionPanel内の各局の表示、鳴き・リーチ記録、打点記録、アクションボタンを含む）を表示するコンポーネント。

### プロップス

| プロップス名 | 型 | 必須 | デフォルト値 | 説明 |
|------------|-----|------|------------|------|
| `round` | `Round` | 必須 | - | 局情報 |
| `roundLabel` | `string` | 必須 | - | 局のラベル（例: "東1局"） |
| `actions` | `Array<RoundAction>` | 必須 | - | アクション（鳴き・リーチ）のリスト |
| `scores` | `Array<Score>` | 必須 | - | 打点記録のリスト |
| `isLoading` | `boolean` | 必須 | - | ローディング状態 |

### イベント

| イベント名 | 型 | 説明 |
|----------|-----|------|
| `add-action` | `(roundId: string) => void` | アクション追加ボタンがクリックされたときに発火 |
| `delete-action` | `(roundId: string, actionId: string) => void` | アクション削除ボタンがクリックされたときに発火 |
| `end-round` | `(roundId: string) => void` | 「局を終了」ボタンがクリックされたときに発火 |
| `next-round` | `(roundId: string) => void` | 「次局へ」ボタンがクリックされたときに発火 |
| `delete-round` | `(roundId: string) => void` | 「削除」ボタンがクリックされたときに発火 |

### スロット

なし

### 実装詳細

- `v-expansion-panel-text`内に配置
- `ActionList`, `ScoreTable`, `RoundActionButtons`を組み合わせて使用
- 局が終了していない場合は打点記録を非表示

### 使用例

```vue
<v-expansion-panel
  v-for="round in sortedRounds"
  :key="round.id"
  :value="round.id"
>
  <v-expansion-panel-title>
    {{ getRoundLabelForId(round.id) }}
  </v-expansion-panel-title>
  <v-expansion-panel-text>
    <RoundCard
      :round="round"
      :round-label="getRoundLabelForId(round.id)"
      :actions="getAllActions(round.id)"
      :scores="getDisplayScores(round.id)"
      :is-loading="isLoading"
      @add-action="openActionDialog"
      @delete-action="handleDeleteAction"
      @end-round="openResultDialog"
      @next-round="handleNextRoundFromPanel"
      @delete-round="handleDeleteRound"
    />
  </v-expansion-panel-text>
</v-expansion-panel>
```

### 依存関係

- `ActionList`, `ScoreTable`, `RoundActionButtons`コンポーネントを使用

---

## 7. ActionAddDialog コンポーネント

### コンポーネント情報

- **コンポーネント名**: `ActionAddDialog`
- **ファイルパス**: `frontend/src/components/ActionAddDialog.vue`
- **コンポーネントタイプ**: Vue 3 Composition API (`<script setup lang="ts">`)

### 責務

アクション（鳴き・リーチ）追加ダイアログを表示するコンポーネント。

### プロップス

| プロップス名 | 型 | 必須 | デフォルト値 | 説明 |
|------------|-----|------|------------|------|
| `modelValue` | `boolean` | 必須 | - | ダイアログの表示状態（`v-model`で使用） |
| `roundId` | `string \| null` | 必須 | - | 対象の局ID |
| `playerOptions` | `Array<{ value: string, title: string }>` | 必須 | - | 参加者選択肢 |
| `actionType` | `string` | 必須 | - | アクションタイプ（`RoundActionType`） |
| `playerId` | `string` | 必須 | - | 選択された参加者ID |
| `nakiType` | `string \| null` | 任意 | `null` | 鳴きタイプ（鳴きの場合のみ） |
| `targetPlayerId` | `string \| null` | 任意 | `null` | 対象参加者ID（鳴きの場合のみ、暗槓以外） |
| `isLoading` | `boolean` | 必須 | - | ローディング状態 |

### イベント

| イベント名 | 型 | 説明 |
|----------|-----|------|
| `update:modelValue` | `(value: boolean) => void` | ダイアログの表示状態が変更されたときに発火（`v-model`で使用） |
| `update:actionType` | `(value: string) => void` | アクションタイプが変更されたときに発火 |
| `update:playerId` | `(value: string) => void` | 参加者IDが変更されたときに発火 |
| `update:nakiType` | `(value: string \| null) => void` | 鳴きタイプが変更されたときに発火 |
| `update:targetPlayerId` | `(value: string \| null) => void` | 対象参加者IDが変更されたときに発火 |
| `confirm` | `() => void` | 「追加」ボタンがクリックされたときに発火 |

### スロット

なし

### 実装詳細

- `v-dialog`を使用してダイアログを表示
- `PlayerSelectButton`を使用して各選択項目を表示
- アクションタイプに応じて表示項目を切り替え（鳴きの場合は鳴きタイプ・対象参加者を表示）
- 参加者情報が読み込まれていない場合は警告メッセージを表示

### 使用例

```vue
<ActionAddDialog
  v-model="showActionDialog"
  :round-id="currentRoundIdForDialog"
  :player-options="playerOptions"
  v-model:action-type="newAction.type"
  v-model:player-id="newAction.playerId"
  v-model:naki-type="newAction.nakiType"
  v-model:target-player-id="newAction.targetPlayerId"
  :is-loading="isLoading"
  @confirm="handleAddAction"
/>
```

### 依存関係

- `PlayerSelectButton`コンポーネントを使用
- `useRoundDialogs`の`newAction`状態を使用

---

## 8. ResultInputDialog コンポーネント

### コンポーネント情報

- **コンポーネント名**: `ResultInputDialog`
- **ファイルパス**: `frontend/src/components/ResultInputDialog.vue`
- **コンポーネントタイプ**: Vue 3 Composition API (`<script setup lang="ts">`)

### 責務

局終了時の結果入力ダイアログを表示するコンポーネント。

### プロップス

| プロップス名 | 型 | 必須 | デフォルト値 | 説明 |
|------------|-----|------|------------|------|
| `modelValue` | `boolean` | 必須 | - | ダイアログの表示状態（`v-model`で使用） |
| `roundId` | `string \| null` | 必須 | - | 対象の局ID |
| `resultType` | `RoundResultType` | 必須 | - | 結果タイプ |
| `specialDrawType` | `SpecialDrawType \| null` | 任意 | `null` | 特殊流局タイプ（特殊流局の場合のみ） |
| `scoreInputs` | `Array<ScoreInput>` | 必須 | - | スコア入力データ |
| `playerOptions` | `Array<{ value: string, title: string }>` | 必須 | - | 参加者選択肢 |
| `riichiPlayerIds` | `Array<string>` | 必須 | - | リーチ者のIDリスト |
| `isLoading` | `boolean` | 必須 | - | ローディング状態 |
| `errors` | `RoundEditErrors \| null` | 任意 | `null` | バリデーションエラー |

### イベント

| イベント名 | 型 | 説明 |
|----------|-----|------|
| `update:modelValue` | `(value: boolean) => void` | ダイアログの表示状態が変更されたときに発火（`v-model`で使用） |
| `update:resultType` | `(value: RoundResultType) => void` | 結果タイプが変更されたときに発火 |
| `update:specialDrawType` | `(value: SpecialDrawType \| null) => void` | 特殊流局タイプが変更されたときに発火 |
| `update:scoreInputs` | `(value: Array<ScoreInput>) => void` | スコア入力データが変更されたときに発火 |
| `winner-selection-change` | `(value: string \| string[]) => void` | 和了者選択が変更されたときに発火 |
| `ron-target-selection-change` | `(value: string) => void` | 放銃者選択が変更されたときに発火 |
| `score-change-input` | `(scoreInput: ScoreInput) => void` | 点数入力が変更されたときに発火 |
| `tenpai-selection-change` | `(value: string[]) => void` | テンパイ選択が変更されたときに発火 |
| `confirm` | `() => void` | 「確定」ボタンがクリックされたときに発火 |
| `cancel` | `() => void` | 「キャンセル」ボタンがクリックされたときに発火 |

### スロット

なし

### 実装詳細

- `v-dialog`を使用してダイアログを表示（`persistent`属性を設定）
- 結果タイプ選択: `v-chip-group`を使用
- 特殊流局タイプ選択: 結果タイプが`SPECIAL_DRAW`の場合のみ表示
- スコア入力セクション: ツモ・ロンの場合のみ表示
  - 和了者選択: `v-chip-group`を使用（ロンの場合は複数選択可能）
  - 放銃者選択: ロンの場合のみ表示
  - 点数入力: `v-text-field`を使用（点数、飜、符）
  - ツモ時は他家の点数を自動計算して表示（読み取り専用）
  - 積み棒・本場による点数変動と局収支を横並びで表示
- テンパイ入力セクション: 流局の場合のみ表示
- バリデーションエラーは`v-alert`で表示

### 使用例

```vue
<ResultInputDialog
  v-model="showResultDialog"
  :round-id="currentRoundIdForResultDialog"
  v-model:result-type="resultDialogData.resultType"
  v-model:special-draw-type="resultDialogData.specialDrawType"
  v-model:score-inputs="resultDialogData.scoreInputs"
  :player-options="playerOptions"
  :riichi-player-ids="getRiichiPlayers(currentRoundIdForResultDialog)"
  :is-loading="isLoading"
  :errors="roundEditErrors[currentRoundIdForResultDialog]"
  @winner-selection-change="handleWinnerSelectionChange"
  @ron-target-selection-change="handleRonTargetSelectionChange"
  @score-change-input="handleScoreChangeInput"
  @tenpai-selection-change="handleTenpaiSelectionChange"
  @confirm="handleConfirmResult"
  @cancel="closeResultDialog"
/>
```

### 依存関係

- `PlayerSelectButton`コンポーネントを使用
- `useResultInput`の各種関数を使用
- `useScoreCalculation`の`getRiichiHonbaScoreChange`, `getTotalScoreChange`関数を使用

---

## 実装時の注意事項

1. **段階的な実装**: 既存の機能を壊さないように、各コンポーネントを順次作成・統合する
2. **型安全性**: 各コンポーネントのprops/emitsを明確に定義し、TypeScriptの型チェックを活用する
3. **Composablesの活用**: ロジックは既存のComposablesに集約し、コンポーネントは主にUI表示とユーザーインタラクションに集中する
4. **テスト**: 各ステップで動作確認を行い、既存の機能が正常に動作することを確認する
5. **一貫性**: 既存の`PlayerSelectButton.vue`のパターンを参考にし、一貫性のあるコンポーネント設計を目指す

## 既存実装からの変更点

### 変更前

- `RoundManageView.vue`にすべてのUIが集約されている（1049行）

### 変更後

- 8つのコンポーネントに分割され、各コンポーネントが単一責任を持つ
- `RoundManageView.vue`は各コンポーネントを組み合わせる親コンポーネントとして機能
- コードの可読性と保守性が向上

