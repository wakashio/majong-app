# コードパターン

## Vue 3 Composition APIパターン

### `<script setup>`構文

すべてのVueコンポーネントで`<script setup lang="ts">`を使用します。

```vue
<script setup lang="ts">
import { ref, computed } from "vue";
import type { Question } from "../types";

const questions = ref<Question[]>([]);
const currentIndex = ref<number>(0);

const currentQuestion = computed(() => {
  return questions.value[currentIndex.value] || null;
});
</script>
```

### refとreactive

- **ref**: プリミティブ値やオブジェクトの参照を保持
- **reactive**: オブジェクトのリアクティブなプロキシを作成（使用頻度は低い）

```typescript
// refの使用例
const questions = ref<Question[]>([]);
const currentIndex = ref<number>(0);
const isLoading = ref<boolean>(true);

// 値の取得と設定
questions.value.push(newQuestion);
const count = questions.value.length;
```

### computed

計算された値を定義します。依存する値が変更されたときに自動的に再計算されます。

```typescript
// composables/useQuiz.ts の例
const currentQuestion = computed<Question | null>(
  () => questions.value[currentIndex.value] || null
);

const progress = computed<number>(() =>
  questions.value.length
    ? ((currentIndex.value + 1) / questions.value.length) * 100
    : 0
);

const accuracy = computed<number>(() =>
  answeredCount.value > 0
    ? Math.round((correctCount.value / answeredCount.value) * 100)
    : 0
);
```

### ライフサイクルフック

コンポーネントのライフサイクルに応じた処理を実行します。

```typescript
// composables/useQuiz.ts の例
onMounted(() => {
  loadCSV();

  // ページ離脱時に学習時間を保存
  const handleBeforeUnload = () => {
    updateSession(selectedDataSource.value);
  };

  window.addEventListener("beforeunload", handleBeforeUnload);
});

onUnmounted(() => {
  stopSessionTimer();
  endSession(selectedDataSource.value);
});
```

## Composablesの設計

### useQuizパターン

ビジネスロジックをComposablesに集約し、コンポーネント間で共有します。

```typescript
// composables/useQuiz.ts の構造
export interface QuizComposable {
  questions: Ref<Question[]>;
  currentIndex: Ref<number>;
  // ... 他のプロパティ
  loadCSV: () => Promise<void>;
  submitAnswer: (answer: string) => void;
  goToQuestion: (index: number) => void;
}

export function useQuiz(): QuizComposable {
  // 状態の定義
  const questions = ref<Question[]>([]);
  const currentIndex = ref<number>(0);
  
  // 関数の定義
  async function loadCSV(): Promise<void> {
    // ...
  }
  
  function submitAnswer(answer: string): void {
    // ...
  }
  
  // 返り値の定義
  return {
    questions,
    currentIndex,
    loadCSV,
    submitAnswer,
    // ...
  };
}
```

### 使用例

```typescript
// App.vue
import { useQuiz } from "./composables/useQuiz";

const quiz = useQuiz();
provide("quiz", quiz);

// 子コンポーネント
import { inject } from "vue";
import type { QuizComposable } from "../composables/useQuiz";

const quiz = inject<QuizComposable>("quiz");
```

## コンポーネント設計

### 単一責任の原則

各コンポーネントは単一の責任を持ちます。

- `QuizMain.vue`: 問題の表示と解答入力
- `QuizSidebarLeft.vue`: データソース選択と統計表示
- `QuizSidebarRight.vue`: 進捗表示

### provide/injectパターン

親コンポーネントから子コンポーネントへ状態を提供します。

```vue
<!-- App.vue -->
<script setup lang="ts">
import { provide } from "vue";
import { useQuiz } from "./composables/useQuiz";

const quiz = useQuiz();
provide("quiz", quiz);
</script>

<!-- 子コンポーネント -->
<script setup lang="ts">
import { inject } from "vue";
import type { QuizComposable } from "../composables/useQuiz";

const quiz = inject<QuizComposable>("quiz");
</script>
```

### テンプレートの構造

```vue
<template>
  <div class="component-name">
    <!-- 条件分岐 -->
    <div v-if="condition">...</div>
    <div v-else-if="otherCondition">...</div>
    <div v-else>...</div>
    
    <!-- リストレンダリング -->
    <div v-for="item in items" :key="item.id">
      {{ item.name }}
    </div>
    
    <!-- イベントハンドリング -->
    <button @click="handleClick">クリック</button>
  </div>
</template>
```

## ユーティリティ関数

### 純粋関数として実装

副作用のない純粋関数として実装します。

```typescript
// utils/progressStorage.ts の例
export function createInitialProgress(): QuizProgress {
  const now = new Date().toISOString();
  
  return {
    version: DATA_VERSION,
    lastUpdated: now,
    currentPosition: 0,
    // ...
  };
}

export function loadProgress(
  dataSourceId: string = "data_cloud"
): QuizProgress {
  try {
    const storageKey = getStorageKey(dataSourceId);
    const stored = localStorage.getItem(storageKey);
    
    if (!stored) {
      return createInitialProgress();
    }
    
    const parsed = JSON.parse(stored) as QuizProgress;
    return parsed;
  } catch (error) {
    console.error("Failed to load progress data:", error);
    return createInitialProgress();
  }
}
```

### 型安全性の重視

すべての関数に型を明示し、型安全性を確保します。

```typescript
// 良い例
export function saveAnswer(
  questionNumber: number,
  userAnswer: string,
  correctAnswer: string,
  dataSourceId: string = "data_cloud"
): void {
  // ...
}

// 悪い例
export function saveAnswer(questionNumber, userAnswer, correctAnswer) {
  // 型が不明確
}
```

## 既存コード例

### useQuiz.tsのパターン

```typescript
// composables/useQuiz.ts
export function useQuiz() {
  // 1. 状態の定義
  const questions = ref<Question[]>([]);
  const currentIndex = ref<number>(0);
  
  // 2. 計算プロパティ
  const currentQuestion = computed(() => {
    return questions.value[currentIndex.value] || null;
  });
  
  // 3. 関数の定義
  async function loadCSV(): Promise<void> {
    try {
      isLoading.value = true;
      // 処理...
    } catch (error) {
      // エラーハンドリング
    } finally {
      isLoading.value = false;
    }
  }
  
  // 4. ライフサイクル
  onMounted(() => {
    loadCSV();
  });
  
  // 5. 返り値
  return {
    questions,
    currentIndex,
    currentQuestion,
    loadCSV,
    // ...
  };
}
```

### progressStorage.tsのパターン

```typescript
// utils/progressStorage.ts
// 1. プライベート関数
function getStorageKey(dataSourceId: string): string {
  return `${STORAGE_KEYS.QUIZ_PROGRESS}_${dataSourceId}`;
}

// 2. 公開関数
export function loadProgress(
  dataSourceId: string = "data_cloud"
): QuizProgress {
  // 実装...
}

export function saveProgress(
  progress: QuizProgress,
  dataSourceId: string = "data_cloud"
): void {
  // 実装...
}
```

## エラーハンドリングパターン

### try-catch-finally

非同期処理には必ずtry-catch-finallyを使用します。

```typescript
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

## データ変換パターン

### CSVパース

```typescript
// PapaParseを使用したCSVパース
const parseResult = Papa.parse(csvText, {
  header: true,
  skipEmptyLines: "greedy",
  transformHeader: (header: string) => header.trim(),
  transform: (value: string) => value.trim(),
});

const rawData = parseResult.data as any[];
const validQuestions: Question[] = [];

rawData.forEach((row, index) => {
  // バリデーション
  const hasAllFields = requiredFields.every((field) => {
    const value = row[field];
    return value !== undefined && value !== null && String(value).trim() !== "";
  });
  
  if (hasAllFields) {
    validQuestions.push({
      number: parseInt(row.number) || validQuestions.length + 1,
      question: String(row.question).trim(),
      // ...
    });
  }
});
```

