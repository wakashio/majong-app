# 型定義

## 型定義の配置

### フロントエンド

型定義は`frontend/src/types/`ディレクトリに配置します。

```
frontend/src/types/
└── progress.ts    # 学習進捗関連の型定義
```

将来的に型が増える場合は、機能ごとにファイルを分割します。

```
frontend/src/types/
├── progress.ts    # 学習進捗関連
├── question.ts    # 問題関連（将来追加時）
└── index.ts       # 型のエクスポート（将来追加時）
```

### バックエンド（将来実装時）

型定義は`backend/src/types/`ディレクトリに配置します。

```
backend/src/types/
└── index.ts    # 型定義の集約
```

## インターフェース命名規則

### PascalCaseを使用

すべてのインターフェースと型エイリアスはPascalCaseで命名します。

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

export type DataSourceId = string;

// 悪い例
export interface question { }  // 小文字
export interface quiz_progress { }  // スネークケース
```

### 明確で説明的な名前

型名はその用途が明確に分かる名前を付けます。

```typescript
// 良い例
export interface LearningStatistics {
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  accuracy: number;
}

export interface DailyStudyRecord {
  date: string;
  studyTimeMinutes: number;
  questionsAnswered: number;
  correctAnswers: number;
}

// 悪い例
export interface Stats { }  // 曖昧
export interface Record { }  // 汎用的すぎる
```

## 既存の型定義例

### Question

問題データの構造を定義します。

```typescript
// composables/useQuiz.ts で定義
export interface Question {
  number: number;
  question: string;
  choiceA: string;
  choiceB: string;
  choiceC: string;
  choiceD: string;
  correct_answer: string;
  explanation: string;
}
```

### DataSource

データソース設定の構造を定義します。

```typescript
// config/dataSources.ts で定義
export interface DataSource {
  id: string;
  name: string;
  filePath: string;
}
```

### QuizProgress

学習進捗データの構造を定義します。

```typescript
// types/progress.ts で定義
export interface QuizProgress {
  version: string;
  lastUpdated: string;
  currentPosition: number;
  lastStudyDate: string;
  answers: Record<number, QuestionAnswer>;
  statistics: LearningStatistics;
  review: ReviewData;
  session: SessionData;
  dailyRecords: Record<string, DailyStudyRecord>;
}
```

### QuestionAnswer

回答データの構造を定義します。

```typescript
// types/progress.ts で定義
export interface QuestionAnswer {
  userAnswer: string | string[];  // 単一選択または複数選択に対応
  isCorrect: boolean;
  attemptCount: number;
  firstAnsweredAt: string;
  lastAnsweredAt: string;
}
```

### LearningStatistics

学習統計データの構造を定義します。

```typescript
// types/progress.ts で定義
export interface LearningStatistics {
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  accuracy: number;
  totalStudyTimeMinutes: number;
  sessionsCount: number;
}
```

### DailyStudyRecord

日別学習記録の構造を定義します。

```typescript
// types/progress.ts で定義
export interface DailyStudyRecord {
  date: string;  // YYYY-MM-DD format
  studyTimeMinutes: number;
  questionsAnswered: number;
  correctAnswers: number;
}
```

### ReviewData

復習データの構造を定義します。

```typescript
// types/progress.ts で定義
export interface ReviewData {
  incorrectQuestions: number[];
  needsReview: number[];
  masteredQuestions: number[];
}
```

### SessionData

セッションデータの構造を定義します。

```typescript
// types/progress.ts で定義
export interface SessionData {
  startTime: string;
  lastActiveTime: string;
  sessionDurationMinutes: number;
}
```

## 型の共有

### 共通型の配置

複数のモジュールで使用する型は`types/`ディレクトリに配置します。

```typescript
// types/progress.ts
export interface QuizProgress {
  // ...
}

// 使用例
import type { QuizProgress } from "../types/progress";
```

### バックエンド実装時の型共有

バックエンド実装時は、フロントエンドとバックエンドで型を共有する方法を検討します。

**オプション1: 共有型定義ディレクトリ**

```
shared/
└── types/
    └── index.ts
```

**オプション2: バックエンドから型をエクスポート**

バックエンドで型を定義し、フロントエンドでインポート（API経由で型を提供）

## 型の使用パターン

### Ref型の定義

```typescript
import { ref, type Ref } from "vue";

const questions = ref<Question[]>([]);
const currentIndex: Ref<number> = ref(0);
```

### Computed型の定義

```typescript
import { computed, type ComputedRef } from "vue";

const currentQuestion: ComputedRef<Question | null> = computed(() => {
  return questions.value[currentIndex.value] || null;
});
```

### 関数の型定義

```typescript
export interface QuizComposable {
  questions: Ref<Question[]>;
  currentIndex: Ref<number>;
  loadCSV: () => Promise<void>;
  submitAnswer: (answer: string) => void;
  goToQuestion: (index: number) => void;
}
```

### 型ガード

```typescript
function isAnswerCorrect(
  userAnswer: string | string[] | null,
  correctAnswers: string[]
): boolean {
  if (!userAnswer) return false;
  
  if (Array.isArray(userAnswer)) {
    // 複数選択の場合
    return (
      userAnswer.length === correctAnswers.length &&
      userAnswer.every((answer) => correctAnswers.includes(answer))
    );
  } else {
    // 単一選択の場合
    return correctAnswers.includes(userAnswer);
  }
}
```

## 型定義のベストプラクティス

### 型の明示

可能な限り型を明示的に指定します。

```typescript
// 良い例
const questions: Question[] = [];
function loadCSV(): Promise<void> { }

// 型推論が明確な場合は省略可
const count = questions.length;  // numberと推論される
```

### 型エイリアスの使用

複雑な型は型エイリアスで定義します。

```typescript
// 良い例
type UserAnswers = (string | string[] | null)[];
const userAnswers: UserAnswers = [];

// 悪い例
const userAnswers: (string | string[] | null)[] = [];  // 長すぎる
```

### Record型の使用

オブジェクトのキーと値の型を定義する場合は`Record`を使用します。

```typescript
// 良い例
answers: Record<number, QuestionAnswer>;
dailyRecords: Record<string, DailyStudyRecord>;

// 悪い例
answers: { [key: number]: QuestionAnswer };  // Recordの方が明確
```

### 定数の型固定

定数は`as const`で型を固定します。

```typescript
// 良い例
export const STORAGE_KEYS = {
  QUIZ_PROGRESS: "salesforce_quiz_progress",
  SESSION_START: "salesforce_quiz_session_start",
} as const;

// 型: { readonly QUIZ_PROGRESS: "salesforce_quiz_progress"; ... }
```

