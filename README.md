# 麻雀記録アプリ

麻雀の記録を行うためのアプリケーションです。

## プロジェクト構成

```
majong-app/
├── frontend/          # フロントエンドアプリケーション (Vue 3 + TypeScript + Vuetify)
├── backend/           # バックエンドAPI (Node.js + TypeScript + Express)
├── design/            # 実装設計書
├── prompts/           # AI開発用プロンプト
└── README.md          # プロジェクト全体のREADME
```

## 技術スタック

### フロントエンド

- Vue 3 (Composition API)
- TypeScript
- Vuetify 3
- Vite
- Pinia
- Vue Router

### バックエンド

- Node.js
- TypeScript
- Express
- Prisma (ORM)
- PostgreSQL (データベース)
- Jest (テストフレームワーク)

## セットアップ

### 前提条件

- Node.js 20.19.0 以上 または 22.12.0 以上
- npm または yarn

### フロントエンド

```bash
cd frontend
npm install
npm run dev
```

フロントエンドは `http://localhost:5173` で起動します。

### バックエンド

#### データベースのセットアップ

1. Docker ComposeでPostgreSQLを起動
   ```bash
   docker-compose up -d
   ```

2. 環境変数を設定
   `backend/.env`ファイルを作成し、以下を設定:
   ```env
   DATABASE_URL="postgresql://majong_user:majong_password@localhost:5432/majong_db?schema=public"
   ```

3. Prismaマイグレーションを実行
   ```bash
   cd backend
   npx prisma migrate dev --name init
   npx prisma generate
   ```

#### アプリケーションの起動

```bash
cd backend
npm install
npm run dev
```

バックエンドは `http://localhost:3000` で起動します。

## 開発

### フロントエンド

```bash
cd frontend
npm run dev          # 開発サーバー起動
npm run build        # ビルド
npm run test:unit    # ユニットテスト
npm run test:e2e     # E2Eテスト
npm run lint         # リンター実行
npm run format       # フォーマット
```

### バックエンド

```bash
cd backend
npm run dev          # 開発サーバー起動
npm run build        # ビルド
npm run start        # 本番モードで起動
npm test             # テスト実行
npm run lint         # リンター実行
```

## AI開発フロー

このプロジェクトはAI開発フローを使用して開発を進めます。詳細は `prompts/00-ai-workflow.md` を参照してください。

### フローの概要

開発フローは以下の順序で実行します:

```
アイデア記録 → 議論 → 議事録記録 → タスク切り出し → 設計 → 実装 → テスト → AIレビュー
```

### コマンド一覧

開発フローを効率的に進めるためのコマンドが用意されています:

- **`/idea`**: アイデア記録フローに入る
  - 新しいアイデアを記録する際に使用
  - `prompts/12-ideas.md`に`[議論待ち]`で記録

- **`/discuss`**: 議論フローに入る
  - アイデアについて議論を開始する際に使用
  - `[議論待ち]`のアイデアを`[議論中]`→`[議論完了]`に更新

- **`/design`**: 設計フローに入る
  - タスクの設計フェーズを開始する際に使用
  - `14-tasks.md`で設計フェーズが`[未着手]`のタスクを確認
  - 設計ドキュメントに反映し、タスクの設計フェーズを`[完了]`に更新

- **`/implement`**: 実装フローに入る
  - タスクの実装フェーズを開始する際に使用
  - `14-tasks.md`で設計フェーズが`[完了]`で実装フェーズが`[未着手]`のタスクを確認
  - 設計ドキュメントに基づいて実装を開始
  - API実装時は必ずフロントエンドとバックエンドの両方を同時に実装する
  - バックエンドの実装にはTDDを推奨（テストコードを先に作成）

- **`/test`**: テストフローに入る
  - タスクのテストフェーズを開始する際に使用
  - `14-tasks.md`で実装フェーズが`[完了]`でテストフェーズが`[未着手]`のタスクを確認
  - テストを実行し、カバレッジを確認
  - 不足しているテストを特定し、作成支援

- **`/review`**: AIレビューフローに入る
  - タスクのAIレビューフェーズを開始する際に使用
  - `14-tasks.md`でテストフェーズが`[完了]`でAIレビューフェーズが`[未着手]`のタスクを確認
  - 実装コード、テストコードをレビュー
  - コーディング規約の遵守を確認
  - 設計ドキュメントとの整合性を確認
  - 改善点があれば指摘

- **`/task`**: タスク管理フローに入る
  - タスクの切り出し、進捗確認、ステータス更新を行う際に使用
  - `14-tasks.md`を確認し、各フェーズの進捗を管理
  - 実行するタスクを決定し、設計フェーズに進む

- **`/status`**: フローの進捗状況を確認
  - アイデア、議事録、タスクが途中で止まっていないか確認
  - 各フェーズの進捗状況を確認し、問題点を検出
  - 次のアクションを提示

- **`/continue`**: 直前の作業を再開
  - 会話履歴から直前の作業を特定し、その続きから再開
  - 設計、実装、テスト、AIレビューなど、会話中に開始された作業を再開
  - 同じコンテキスト上の会話のみから特定（ファイルやタスクステータスは参照しない）

- **`/policy`**: プロジェクトの運用方針を確認
  - 開発フロー、コーディング規約、ディレクトリ構造、テスト戦略、制約事項を確認
  - カテゴリ選択式で表示
  - `prompts/`ディレクトリ内の該当ドキュメントを参照

各コマンドの詳細は `.cursor/commands/` ディレクトリ内の各コマンドファイルを参照してください。

### 開発フローの詳細

各ステップの詳細:

1. **アイデア記録**: `prompts/12-ideas.md`に記録
2. **議論**: アイデアについて議論し、`[議論完了]`に更新
3. **議事録記録**: `prompts/11-meeting-notes.md`に記録
4. **タスク切り出し**: `prompts/14-tasks.md`にタスクを記録
5. **設計**: 設計ドキュメントを作成・更新
6. **実装**: コードを実装
7. **テスト**: テストを作成・実行
8. **AIレビュー**: コードレビューを実施

## プロジェクトの運用方針

プロジェクトの運用方針は `prompts/` ディレクトリ内のドキュメントに記載されています。

### `/policy`コマンド

`/policy`コマンドを使用することで、プロジェクトの運用方針を確認できます。以下のカテゴリから選択できます:

1. **開発フロー**: `prompts/00-ai-workflow.md`の内容
2. **コーディング規約**: `prompts/03-coding-standards.md`の内容
3. **ディレクトリ構造**: `prompts/04-directory-structure.md`の内容
4. **テスト戦略**: `prompts/07-testing-strategy.md`の内容
5. **制約事項**: `prompts/10-constraints.md`の内容

### `prompts/`ディレクトリ

`prompts/`ディレクトリには以下のドキュメントが含まれます:

- `00-ai-workflow.md`: AI開発フローの全体像
- `01-project-overview.md`: プロジェクト概要
- `02-architecture.md`: アーキテクチャ設計
- `03-coding-standards.md`: コーディング規約
- `04-directory-structure.md`: ディレクトリ構造
- `05-code-patterns.md`: コードパターン
- `06-type-definitions.md`: 型定義
- `07-testing-strategy.md`: テスト戦略
- `08-development-workflow.md`: 開発フロー
- `10-constraints.md`: 制約事項
- `11-meeting-notes.md`: 議事録
- `12-ideas.md`: アイデア
- `13-api-specifications.md`: API仕様
- `14-tasks.md`: タスク管理
- `15-review-guidelines.md`: レビューガイドライン

## 主要機能

- 参加者登録機能
- 半荘管理機能（開始、終了、席順）
- 局管理機能（開始、進行中、終了）
- 打点計算機能（ツモ、ロン、流局）
- 積み棒・本場の計算機能
- 統計・履歴表示機能

## ライセンス

ISC

