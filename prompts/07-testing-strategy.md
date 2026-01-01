# テスト戦略

## テストフレームワーク

### バックエンド

- **Jest**: テストフレームワーク（`backend/package.json`に設定済み）
- テストファイルは`*.test.ts`の命名規則

```json
{
  "scripts": {
    "test": "jest"
  },
  "devDependencies": {
    "jest": "^29.7.0"
  }
}
```

### フロントエンド

- 現在は未設定
- 将来的にはVitestやVue Test Utilsの導入を検討

## テストカバレッジ目標

### バックエンド

- **必須**: すべての機能にテストを作成
- 新規機能追加時は必ずテストを作成
- テスト実行してエラーがないことを確認

### フロントエンド

- 現在は未設定（将来追加検討）
- 優先度: 低（現時点では手動テストで対応）

## テスト種別

### ユニットテスト

各関数・クラスの動作を検証します。

```typescript
// backend/src/utils/csvParser.test.ts の例（将来実装時）
import { parseCSV } from "./csvParser";

describe("parseCSV", () => {
  it("正常なCSVファイルをパースできる", () => {
    const filePath = "test.csv";
    const result = parseCSV(filePath);
    
    expect(result).toHaveLength(10);
    expect(result[0]).toHaveProperty("number");
    expect(result[0]).toHaveProperty("question");
  });
  
  it("BOM付きCSVファイルを正しく処理できる", () => {
    // テスト実装
  });
  
  it("必須フィールドが不足している行をスキップする", () => {
    // テスト実装
  });
});
```

### 統合テスト

APIエンドポイントの動作を検証します（バックエンド実装時）。

```typescript
// backend/tests/integration/api.test.ts の例（将来実装時）
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
});
```

## バックエンドテスト必須ルール

### テストコードの実装タイミング

**実装フェーズとテストフェーズの関係:**
- **実装フェーズ**: 実装コード + テストコード作成（TDD推奨）
  - テストコードを先に作成（TDD）
  - その後、実装コードを作成してテストが通ることを確認
- **テストフェーズ**: テスト実行、カバレッジ確認、不足テストの補完
  - 実装フェーズで作成されたテストを実行
  - テストカバレッジを確認
  - 不足しているテストを特定し、作成支援

### 新規機能追加時

1. **テストを先に書く（TDD推奨）**
   - 実装フェーズでテストケースを先に定義
   - 実装コードを作成後、テストが通ることを確認
   - 実装フェーズでテストコードと実装コードの両方を作成

2. **すべての関数にテストを作成**
   - 正常系のテスト
   - 異常系のテスト
   - エッジケースのテスト

3. **テスト実行の確認**
   ```bash
   cd backend
   npm test
   ```
   - すべてのテストが通ることを確認
   - エラーがある場合は修正してからコミット
   - テストフェーズでテストを実行し、カバレッジを確認

### 既存機能の修正時

1. **既存のテストを確認**
   - 影響を受けるテストを特定
   - テストも修正が必要か確認

2. **テストの修正**
   - 変更に合わせてテストを更新
   - 新しいテストケースを追加（必要に応じて）

3. **テスト実行**
   - すべてのテストが通ることを確認

## テストファイルの配置

### バックエンド

```
backend/
├── src/
│   └── utils/
│       └── csvParser.ts
├── tests/
│   ├── unit/
│   │   └── csvParser.test.ts
│   └── integration/
│       └── api.test.ts
└── package.json
```

または、ソースファイルと同じディレクトリに配置：

```
backend/
└── src/
    └── utils/
        ├── csvParser.ts
        └── csvParser.test.ts
```

## テストの書き方

### 基本的な構造

```typescript
import { functionToTest } from "./module";

describe("functionToTest", () => {
  it("正常系のテストケース", () => {
    const result = functionToTest(input);
    expect(result).toBe(expected);
  });
  
  it("異常系のテストケース", () => {
    expect(() => {
      functionToTest(invalidInput);
    }).toThrow();
  });
});
```

### 非同期処理のテスト

```typescript
describe("asyncFunction", () => {
  it("非同期処理が正常に完了する", async () => {
    const result = await asyncFunction();
    expect(result).toBeDefined();
  });
  
  it("エラーが発生した場合", async () => {
    await expect(asyncFunction()).rejects.toThrow();
  });
});
```

### モックの使用

```typescript
import { parseCSV } from "./csvParser";
import * as fs from "fs";

jest.mock("fs");

describe("parseCSV", () => {
  it("ファイル読み込みエラーを処理する", () => {
    (fs.readFileSync as jest.Mock).mockImplementation(() => {
      throw new Error("File not found");
    });
    
    expect(() => {
      parseCSV("nonexistent.csv");
    }).toThrow("File not found");
  });
});
```

## テスト実行

### バックエンド

```bash
cd backend
npm test
```

### ウォッチモード（開発時）

```bash
cd backend
npm test -- --watch
```

### カバレッジレポート

```bash
cd backend
npm test -- --coverage
```

## テストのベストプラクティス

### 1. テストは独立させる

各テストは他のテストに依存しないようにします。

```typescript
// 良い例: 各テストが独立
describe("function", () => {
  it("test 1", () => {
    const result = function(input1);
    expect(result).toBe(expected1);
  });
  
  it("test 2", () => {
    const result = function(input2);
    expect(result).toBe(expected2);
  });
});

// 悪い例: テストが依存している
describe("function", () => {
  let sharedState;
  
  it("test 1", () => {
    sharedState = function(input1);  // 状態を共有
  });
  
  it("test 2", () => {
    const result = function(sharedState);  // test 1に依存
  });
});
```

### 2. 明確なテスト名

テスト名は何をテストしているかが明確に分かるようにします。

```typescript
// 良い例
it("必須フィールドが不足している行をスキップする", () => { });
it("BOM付きCSVファイルを正しく処理できる", () => { });

// 悪い例
it("test 1", () => { });
it("should work", () => { });
```

### 3. アサーションは明確に

期待値を明確に指定します。

```typescript
// 良い例
expect(result.length).toBe(10);
expect(result[0].number).toBe(1);
expect(result[0]).toHaveProperty("question");

// 悪い例
expect(result).toBeTruthy();  // 曖昧
```

### 4. エッジケースもテスト

正常系だけでなく、エッジケースもテストします。

- 空のデータ
- null/undefined
- 境界値
- エラーケース

