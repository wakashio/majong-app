# よくあるタスク

## 新機能追加手順

### 1. 要件確認

- 機能の目的を明確にする
- 必要なデータ構造を定義
- UI/UXの要件を確認

### 2. 既存ロジック確認

新規ロジック作成前に、使用可能な既存ロジックがないか確認します。

```bash
# コードベースを検索
grep -r "類似の機能" src/
# または
codebase_search "類似の機能について"
```

**確認ポイント:**
- 同じ機能が既に実装されていないか
- 再利用可能な関数がないか
- 類似のパターンがないか

### 3. 型定義追加（`types/`）

必要な型定義を`frontend/src/types/`に追加します。

```typescript
// types/progress.ts に追加
export interface NewFeatureData {
  id: string;
  name: string;
  // ...
}
```

### 4. 実装

コーディング規約に従って実装します。

- 型定義を適切に使用
- エラーハンドリングを実装
- コメントを適切に記述

### 5. テスト作成（バックエンド）

バックエンドの機能追加時は必ずテストを作成します。

```typescript
// backend/tests/unit/newFeature.test.ts
import { newFeature } from "../../src/utils/newFeature";

describe("newFeature", () => {
  it("正常に動作する", () => {
    const result = newFeature(input);
    expect(result).toBe(expected);
  });
});
```

### 6. lint対応

コード修正後は必ずlintを実行し、エラーを修正します。

```bash
cd backend
npm run lint
npm run lint:fix
```

## コンポーネント追加

### 1. `src/components/`に配置

新しいコンポーネントを`frontend/src/components/`に配置します。

```vue
<!-- components/NewComponent.vue -->
<template>
  <div class="new-component">
    <!-- コンテンツ -->
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const data = ref<string>("");
</script>

<style scoped>
.new-component {
  /* スタイル */
}
</style>
```

### 2. `<script setup lang="ts">`使用

すべてのコンポーネントで`<script setup lang="ts">`を使用します。

### 3. 型定義追加

必要な型定義を追加します。

```typescript
// コンポーネント内で定義
interface ComponentProps {
  title: string;
  count: number;
}

// または types/ に定義
export interface ComponentData {
  // ...
}
```

### 4. 親コンポーネントで使用

```vue
<!-- App.vue など -->
<script setup lang="ts">
import NewComponent from "./components/NewComponent.vue";
</script>

<template>
  <NewComponent />
</template>
```

## APIエンドポイント追加（バックエンド実装時）

### 1. ルーティング定義

```typescript
// backend/src/routes/questions.ts
import { Router } from "express";
import { getQuestions } from "../controllers/questionController";

const router = Router();

router.get("/:dataSourceId", getQuestions);

export default router;
```

### 2. コントローラー実装

```typescript
// backend/src/controllers/questionController.ts
import { Request, Response } from "express";
import { getQuestionsService } from "../services/questionService";

export async function getQuestions(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { dataSourceId } = req.params;
    const questions = await getQuestionsService(dataSourceId);
    res.json({ questions });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}
```

### 3. サービス層実装

```typescript
// backend/src/services/questionService.ts
import { parseCSV } from "../utils/csvParser";
import { AVAILABLE_DATA_SOURCES } from "../config/dataSources";

export async function getQuestionsService(
  dataSourceId: string
): Promise<Question[]> {
  const dataSource = AVAILABLE_DATA_SOURCES.find(
    (ds) => ds.id === dataSourceId
  );
  
  if (!dataSource) {
    throw new Error(`Data source not found: ${dataSourceId}`);
  }
  
  return parseCSV(dataSource.filePath);
}
```

### 4. テスト作成

```typescript
// backend/tests/integration/api.test.ts
import request from "supertest";
import app from "../../src/app";

describe("GET /api/questions/:dataSourceId", () => {
  it("問題データを取得できる", async () => {
    const response = await request(app)
      .get("/api/questions/data_cloud")
      .expect(200);
    
    expect(response.body).toHaveProperty("questions");
    expect(Array.isArray(response.body.questions)).toBe(true);
  });
  
  it("存在しないデータソースIDでエラーを返す", async () => {
    const response = await request(app)
      .get("/api/questions/invalid")
      .expect(404);
    
    expect(response.body).toHaveProperty("error");
  });
});
```

## よくある実装パターン

### CSV読み込み

`Papa.parse`を使用してCSVファイルを読み込みます。

```typescript
// composables/useQuiz.ts の例
import Papa from "papaparse";

async function loadCSV(): Promise<void> {
  const response = await fetch(dataSource.filePath);
  const csvText = await response.text();
  
  // BOM除去
  const contentWithoutBOM =
    csvText.charCodeAt(0) === 0xfeff ? csvText.slice(1) : csvText;
  
  const parseResult = Papa.parse(contentWithoutBOM, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header: string) => header.trim(),
    transform: (value: string) => value.trim(),
  });
  
  const questions: Question[] = parseResult.data.map((row) => ({
    number: parseInt(row.number),
    question: row.question,
    // ...
  }));
}
```

### LocalStorage操作

`progressStorage.ts`を参考にLocalStorageを操作します。

```typescript
// utils/progressStorage.ts の例
export function loadProgress(
  dataSourceId: string = "data_cloud"
): QuizProgress {
  try {
    const storageKey = getStorageKey(dataSourceId);
    const stored = localStorage.getItem(storageKey);
    
    if (!stored) {
      return createInitialProgress();
    }
    
    return JSON.parse(stored) as QuizProgress;
  } catch (error) {
    console.error("Failed to load progress data:", error);
    return createInitialProgress();
  }
}

export function saveProgress(
  progress: QuizProgress,
  dataSourceId: string = "data_cloud"
): void {
  try {
    progress.lastUpdated = new Date().toISOString();
    const storageKey = getStorageKey(dataSourceId);
    localStorage.setItem(storageKey, JSON.stringify(progress));
  } catch (error) {
    console.error("Failed to save progress data:", error);
  }
}
```

### データソース切り替え

`changeDataSource`を参考にデータソースを切り替えます。

```typescript
// composables/useQuiz.ts の例
async function changeDataSource(dataSourceId: string): Promise<void> {
  if (!AVAILABLE_DATA_SOURCES.find((ds) => ds.id === dataSourceId)) {
    console.error(`無効なデータソースID: ${dataSourceId}`);
    return;
  }
  
  // 現在のデータソースのセッションを終了
  stopSessionTimer();
  endSession(selectedDataSource.value);
  
  // データソースを変更
  selectedDataSource.value = dataSourceId;
  localStorage.setItem(DATA_SOURCE_STORAGE_KEY, dataSourceId);
  
  // セッション時間をリセット
  sessionTime.value = 0;
  
  // 新しいデータソースのCSVを読み込み
  await loadCSV();
}
```

### エラーハンドリング

try-catchを使用してエラーを適切に処理します。

```typescript
async function loadData(): Promise<void> {
  try {
    isLoading.value = true;
    loadError.value = null;
    
    // 処理...
  } catch (error) {
    console.error("エラー:", error);
    loadError.value =
      error instanceof Error
        ? error.message
        : "データの読み込みに失敗しました";
  } finally {
    isLoading.value = false;
  }
}
```

### 計算プロパティ

`computed`を使用して計算された値を定義します。

```typescript
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

## データソース追加

### 1. CSVファイルを配置

`frontend/public/`にCSVファイルを配置します。

```bash
cp your_questions.csv frontend/public/your_questions.csv
```

### 2. データソース設定を追加

`frontend/src/config/dataSources.ts`に新しいデータソースを追加します。

```typescript
export const AVAILABLE_DATA_SOURCES: DataSource[] = [
  // 既存のデータソース...
  {
    id: "your_data_source_id",
    name: "あなたの問題集名",
    filePath: "/your_questions.csv",  // /で始める
  },
];
```

### 3. アプリケーションを再起動

開発サーバーを再起動すると、新しいデータソースが利用可能になります。

