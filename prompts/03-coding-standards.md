# コーディング規約

## TypeScript設定

### strict mode必須

`tsconfig.json`で`strict: true`を設定し、型安全性を確保します。

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### 型定義の徹底

- すべての関数、変数に型を明示
- `any`型の使用は可能な限り避ける
- 型推論を活用しつつ、必要な箇所では明示的に型を指定

## 命名規則

### インターフェース・型

- **PascalCase**を使用
- 明確で説明的な名前を付ける

```typescript
// 良い例
export interface Question {
  number: number;
  question: string;
}

export interface QuizProgress {
  version: string;
  lastUpdated: string;
}

// 悪い例
export interface q { }  // 短すぎる
export interface question_data { }  // スネークケース
```

### 関数・変数

- **camelCase**を使用
- 動詞で始める（関数の場合）

```typescript
// 良い例
const userAnswers = ref<(string | string[] | null)[]>([]);
function loadCSV(): Promise<void> { }
function submitAnswer(answer: string): void { }

// 悪い例
const UserAnswers = ref([]);  // パスカルケース
function load_csv() { }  // スネークケース
```

### 定数

- **UPPER_SNAKE_CASE**を使用
- `as const`を使用して型を固定

```typescript
// 良い例
export const STORAGE_KEYS = {
  QUIZ_PROGRESS: "salesforce_quiz_progress",
  SESSION_START: "salesforce_quiz_session_start",
} as const;

export const DATA_VERSION = "1.0.0";
export const DATA_SOURCE_STORAGE_KEY = "quiz_selected_data_source";

// 悪い例
export const storageKeys = { };  // キャメルケース
export const dataVersion = "1.0.0";  // キャメルケース
```

### コンポーネント名

- **PascalCase**を使用
- ファイル名とコンポーネント名を一致させる

```typescript
// QuizMain.vue
export default defineComponent({
  name: "QuizMain",
  // ...
});
```

## インポート順序

### ルール

1. **Vueからのimportは省略しない**
2. 外部ライブラリのimport
3. 内部モジュールのimport（相対パス）
4. 型定義のimport（`type`キーワードを使用）

```typescript
// 良い例
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  type Ref,
  type ComputedRef,
} from "vue";
import Papa from "papaparse";
import {
  loadProgress,
  saveAnswer,
  saveCurrentPosition,
} from "../utils/progressStorage";
import type { LearningStatistics } from "../types/progress";

// 悪い例
import { ref } from "vue";  // 必要なものだけimport（可読性が下がる）
import type { LearningStatistics } from "../types/progress";
import { loadProgress } from "../utils/progressStorage";  // 順序が違う
```

## コメント規約

### 日本語コメント使用

- すべてのコメントは日本語で記述
- JSDoc形式を推奨

```typescript
/**
 * CSVファイルを読み込む
 * BOM除去、空行/カラム不足スキップ、改行/カンマ対応
 */
async function loadCSV(): Promise<void> {
  // ...
}

/**
 * 回答を記録
 * @param questionNumber - 問題番号
 * @param userAnswer - ユーザーの回答
 * @param correctAnswer - 正解
 * @param dataSourceId - データソースID
 */
export function saveAnswer(
  questionNumber: number,
  userAnswer: string,
  correctAnswer: string,
  dataSourceId: string = "data_cloud"
): void {
  // ...
}
```

### インラインコメント

- 複雑なロジックには説明を追加
- なぜそうしているかを説明

```typescript
// BOM除去
if (csvText.charCodeAt(0) === 0xfeff) {
  csvText = csvText.slice(1);
}

// データソースごとに独立して管理
const storageKey = getStorageKey(dataSourceId);
```

## 記号使用ルール

### 全角記号禁止

- **全角記号は一切使用しない**
- すべて半角記号を使用

```typescript
// 良い例
const message = "エラーが発生しました。";
const items = ["A", "B", "C"];
if (condition) {
  // 処理
}

// 悪い例
const message = "エラーが発生しました。";  // 全角ピリオド
const items = ["A", "B", "C"];  // 全角カンマ
if (condition) {  // 全角括弧
  // 処理
}
```

### 使用する記号

- 括弧: `()` （全角`（）`は禁止）
- カンマ: `,` （全角`，`は禁止）
- ピリオド: `.` （全角`．`は禁止）
- セミコロン: `;` （必要に応じて）
- コロン: `:` （型定義など）

## エラーハンドリング

### try-catchの使用

非同期処理やエラーが発生する可能性がある処理には必ずtry-catchを使用します。

```typescript
// 良い例
async function loadCSV(): Promise<void> {
  try {
    isLoading.value = true;
    loadError.value = null;
    
    const response = await fetch(dataSource.filePath);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // 処理...
  } catch (error) {
    console.error("CSV読み込みエラー:", error);
    loadError.value =
      error instanceof Error
        ? error.message
        : "CSVファイルの読み込みに失敗しました";
  } finally {
    isLoading.value = false;
  }
}
```

### エラーメッセージ

- ユーザーに分かりやすい日本語のメッセージを表示
- 開発者向けの詳細情報はconsoleに出力

```typescript
// 良い例
catch (error) {
  console.error("詳細なエラー情報:", error);
  loadError.value = "CSVファイルの読み込みに失敗しました";
}

// 悪い例
catch (error) {
  console.error(error);  // ユーザー向けメッセージがない
}
```

## コードの重複回避

### 既存ロジックの確認

新規ロジック作成前に、使用可能な既存ロジックがないか確認します。

```typescript
// 既存の関数を確認
// utils/progressStorage.ts に既に実装されているか確認
// composables/useQuiz.ts に既に実装されているか確認
```

### 関数の抽出

重複する処理は関数として抽出し、再利用します。

```typescript
// 良い例: 共通処理を関数化
function getStorageKey(dataSourceId: string): string {
  return `${STORAGE_KEYS.QUIZ_PROGRESS}_${dataSourceId}`;
}

// 悪い例: 同じ処理が複数箇所に散在
const key1 = `${STORAGE_KEYS.QUIZ_PROGRESS}_${dataSourceId}`;
const key2 = `${STORAGE_KEYS.QUIZ_PROGRESS}_${dataSourceId}`;
```

## ファイル構造

### ファイル先頭

- import文は必ずファイルの先頭に記述
- その後にコードを記述

```typescript
// 良い例
import { ref } from "vue";
import type { Question } from "./types";

const data = ref<Question[]>([]);

// 悪い例
const data = ref<Question[]>([]);
import { ref } from "vue";  // importが後にある
```

## Vueのslot記法

### 基本的なルール

Vue 3のslot記法は、静的slot名と動的slot名で使い分けます。

### 静的slot名

静的slot名（固定の文字列）の場合は、簡潔な記法を使用します。ただし、slot名にドット（`.`）が含まれる場合は、`#[`xxx`]`の記法を使用します（lintエラー回避のため）。

```vue
<!-- 良い例: ドットを含まない静的slot名 -->
<template #default="{ item }">
  <div>{{ item.name }}</div>
</template>

<!-- 良い例: ドットを含む静的slot名（v-data-tableなど） -->
<template #[`item.status`]="{ item }">
  <v-chip>{{ item.statusText }}</v-chip>
</template>

<template #[`item.actions`]="{ item }">
  <v-btn @click="handleEdit(item.id)">編集</v-btn>
</template>
```

### 動的slot名

動的slot名（変数や式を使用）の場合は、`#[`xxx`]`の記法を使用します。lintエラーを回避するために必要です。

```vue
<!-- 良い例: 動的slot名 -->
<template #[`item.${fieldName}`]="{ item }">
  <div>{{ item[fieldName] }}</div>
</template>
```

### 使い分けの判断基準

- **静的slot名（ドットなし）**: slot名が固定の文字列でドットを含まない場合（例: `default`, `header`）→ `#default`の記法を使用
- **静的slot名（ドットあり）**: slot名が固定の文字列でドットを含む場合（例: `item.status`, `item.actions`）→ `#[`item.status`]`の記法を使用（lintエラー回避のため）
- **動的slot名**: slot名が変数や式で動的に決定される場合（例: `` `item.${fieldName}` ``）→ `#[`item.${fieldName}`]`の記法を使用

### 既存コードとの整合性

- 既存コードの修正は必要に応じて実施（優先度: 低）
- 新規コードは統一された記法を使用
- 動的slot名が必要な場合は必ず`#[`xxx`]`の記法を使用