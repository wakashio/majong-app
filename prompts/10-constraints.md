# 制約事項

## 使用禁止事項

### 全角記号の使用禁止

コード内では全角記号を一切使用しません。すべて半角記号を使用します。

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

**使用する記号:**
- 括弧: `()` （全角`（）`は禁止）
- カンマ: `,` （全角`，`は禁止）
- ピリオド: `.` （全角`．`は禁止）
- セミコロン: `;` （必要に応じて）
- コロン: `:` （型定義など）

### コード重複禁止

同じ処理が複数箇所に存在しないようにします。

```typescript
// 良い例: 共通処理を関数化
function getStorageKey(dataSourceId: string): string {
  return `${STORAGE_KEYS.QUIZ_PROGRESS}_${dataSourceId}`;
}

// 悪い例: 同じ処理が複数箇所に散在
const key1 = `${STORAGE_KEYS.QUIZ_PROGRESS}_${dataSourceId}`;
const key2 = `${STORAGE_KEYS.QUIZ_PROGRESS}_${dataSourceId}`;
```

**対策:**
- 新規ロジック作成前に既存ロジックを確認
- 共通処理は関数として抽出
- ユーティリティ関数として`utils/`に配置

### Vueからのimport省略禁止

Vueからのimportは省略せず、明示的に記述します。

```typescript
// 良い例
import {
  ref,
  computed,
  onMounted,
  type Ref,
  type ComputedRef,
} from "vue";

// 悪い例
// 自動インポートに依存しない
```

## パフォーマンス要件

### CSV読み込み時のBOM除去必須

CSVファイルを読み込む際は、BOM（Byte Order Mark）を除去する必要があります。

```typescript
// 必須の処理
let csvText = await response.text();

// BOM除去
if (csvText.charCodeAt(0) === 0xfeff) {
  csvText = csvText.slice(1);
}
```

### 大量データ処理時の最適化検討

大量のデータを処理する場合は、パフォーマンスを考慮します。

- バッチ処理の検討
- 仮想スクロールの検討（リスト表示時）
- メモ化の検討（計算コストが高い処理）

### 不要な再レンダリングの回避

Vueコンポーネントで不要な再レンダリングを避けます。

- `computed`を適切に使用
- `v-memo`の使用を検討（Vue 3.2+）
- 大きなリストの場合は仮想スクロールを検討

## セキュリティ要件

### 現時点での制約

- 現在はLocalStorageを使用（クライアント側のみ）
- ユーザー認証は未実装
- データの暗号化は未実装

### 将来の拡張

- バックエンド実装時に認証機能を追加
- データの暗号化を検討
- HTTPSの使用を必須化

### 入力値の検証

ユーザー入力は適切に検証します。

```typescript
// CSVパース時の検証例
const requiredFields = [
  "number",
  "question",
  "choiceA",
  "choiceB",
  "choiceC",
  "choiceD",
  "correct_answer",
  "explanation",
];

const hasAllFields = requiredFields.every((field) => {
  const value = row[field];
  return value !== undefined && value !== null && String(value).trim() !== "";
});
```

## ブラウザサポート

### モダンブラウザ対応

以下のモダンブラウザをサポートします。

- Chrome（最新版）
- Firefox（最新版）
- Safari（最新版）
- Edge（最新版）

### 使用しない機能

- Internet Explorer（サポートしない）
- 古いブラウザ向けのpolyfillは基本的に不要

## 既知の制約

### 現在の実装状況

- **フロントエンド**: 実装済み（Vue 3 + TypeScript）
- **バックエンド**: 未実装（TypeScript環境のみ構築済み）
- **データ管理**: LocalStorageを使用
- **デプロイ**: 未実施

### データ管理の制約

- データはLocalStorageで管理（ブラウザに依存）
- データのバックアップ機能なし
- データのクラウド同期機能なし
- データソースごとに独立して管理

### 機能の制約

- オフラインでのみ動作（API連携なし）
- ユーザー認証なし
- 複数デバイス間での同期なし
- 問題の追加・編集機能なし（CSVファイルを直接編集）

### パフォーマンスの制約

- 大量の問題データ（1000問以上）での動作は未検証
- CSVファイルのサイズ制限は未定義
- メモリ使用量の最適化は未実施

## 技術的制約

### TypeScript設定

- `strict: true`が必須
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noFallthroughCasesInSwitch: true`

### 依存関係

- Node.js v18以上が必要
- 特定のバージョンに依存する可能性があるライブラリ

### ビルドツール

- Viteを使用（フロントエンド）
- カスタムビルド設定の制約

## 開発環境の制約

### 必須ツール

- Node.js（v18以上）
- npm または yarn
- Git

### 推奨ツール

- VS Code（エディタ）
- Vue DevTools（ブラウザ拡張）
- ESLint（コード品質）

## 将来の拡張時の注意点

### バックエンド実装時

- 既存のLocalStorage実装との互換性を考慮
- データ移行の計画が必要
- API設計時にフロントエンドとの整合性を確保

### データベース導入時

- スキーマ設計の検討
- マイグレーション戦略の検討
- パフォーマンス最適化の検討

