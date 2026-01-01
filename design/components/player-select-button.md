# PlayerSelectButton コンポーネント

## 概要

参加者や鳴きタイプなどをボタン形式で選択できるコンポーネントです。`v-chip`を使用したグリッドレイアウトで表示し、単一選択と複数選択の両方に対応します。

## コンポーネント情報

- **コンポーネント名**: `PlayerSelectButton`
- **ファイルパス**: `frontend/src/components/PlayerSelectButton.vue`
- **コンポーネントタイプ**: Vue 3 Composition API (`<script setup lang="ts">`)

## プロップス

| プロップス名 | 型 | 必須 | デフォルト値 | 説明 |
|------------|-----|------|------------|------|
| `items` | `Array<{ value: string, title: string }>` | 必須 | - | 選択肢のリスト（`value`: 選択値、`title`: 表示ラベル） |
| `modelValue` | `string \| string[]` | 必須 | - | 選択された値（単一選択時は`string`、複数選択時は`string[]`） |
| `label` | `string` | 任意 | `""` | ラベルテキスト |
| `disabled` | `boolean` | 任意 | `false` | 無効化フラグ |
| `required` | `boolean` | 任意 | `false` | 必須フラグ |
| `multiple` | `boolean` | 任意 | `false` | 複数選択フラグ（`true`の場合、複数選択可能） |

## イベント

| イベント名 | 型 | 説明 |
|----------|-----|------|
| `update:modelValue` | `(value: string \| string[]) => void` | 選択値が変更されたときに発火（`v-model`で使用） |

## スロット

なし

## 実装詳細

### レイアウト

- `v-chip-group`を使用してグリッドレイアウトで表示
- 各選択肢は`v-chip`で表示
- グリッドレイアウトはVuetifyのグリッドシステムを使用（`v-row`、`v-col`）

### 選択状態の視覚的フィードバック

- 選択された`v-chip`は色が変更される（Vuetifyのデフォルトスタイル）
- `v-chip-group`の`selected-class`プロパティを使用して選択状態のスタイルを指定

### バリデーション

- `required`プロップスが`true`の場合、選択が必須
- バリデーションエラーは親コンポーネントで処理（このコンポーネントでは表示しない）

### 無効化

- `disabled`プロップスが`true`の場合、すべての`v-chip`が無効化される
- 無効化時はクリックできない

## 使用例

### 単一選択（参加者選択）

```vue
<PlayerSelectButton
  v-model="selectedPlayerId"
  :items="playerOptions"
  label="参加者"
  :required="true"
/>
```

### 複数選択（対象参加者選択）

```vue
<PlayerSelectButton
  v-model="selectedPlayerIds"
  :items="playerOptions"
  label="対象参加者"
  :multiple="true"
  :required="true"
/>
```

### 鳴きタイプ選択

```vue
<PlayerSelectButton
  v-model="nakiType"
  :items="nakiTypeItems"
  label="鳴きタイプ"
  :required="true"
/>
```

## 適用箇所

1. **鳴き追加ダイアログ** (`RoundManageView.vue`)
   - 参加者選択（単一選択）
   - 対象参加者選択（単一選択、暗槓以外の場合）
   - 鳴きタイプ選択（単一選択）

2. **リーチ追加ダイアログ** (`RoundManageView.vue`)
   - 参加者選択（単一選択）

3. **親選択** (`RoundManageView.vue`)
   - 参加者選択（単一選択、将来的に手動選択が必要になった場合に適用）

4. **半荘作成画面** (`HanchanFormView.vue`)
   - 参加者選択（4人分、単一選択）

## 既存実装からの変更点

### 変更前

- `v-select`を使用したプルダウン形式の選択UI

### 変更後

- `PlayerSelectButton`コンポーネントを使用したボタン形式の選択UI
- `v-chip`を使用したグリッドレイアウトで表示
- 視覚的に分かりやすく、操作性が向上

## 注意事項

- `items`プロップスは必ず`value`と`title`プロパティを持つオブジェクトの配列である必要がある
- `multiple`プロップスが`true`の場合、`modelValue`は`string[]`型である必要がある
- `multiple`プロップスが`false`の場合、`modelValue`は`string`型である必要がある
- バリデーションエラーの表示は親コンポーネントで実装する

