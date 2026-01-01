# git管理とCI/CD設定設計

## 概要

プロジェクトのgit管理とCI/CDパイプラインを設定し、開発フローの効率化とコード品質の向上を図る。

## 実装内容

### 1. gitリポジトリの初期化

#### 1.1 リポジトリ初期化

- ルートディレクトリでgitリポジトリを初期化
- 初期コミットを作成

#### 1.2 `.gitignore`の作成

ルートに`.gitignore`を作成し、以下の内容を含める:

```
# Dependencies
node_modules/
package-lock.json
yarn.lock
pnpm-lock.yaml

# Build outputs
dist/
dist-ssr/
*.local

# Environment variables
.env
.env.local
.env.*.local

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# OS files
Thumbs.db
.DS_Store

# Database
*.db
*.db-journal
dev.db

# Test coverage
coverage/
*.lcov

# Playwright
test-results/
playwright-report/

# Prisma
/src/generated/prisma

# Temporary files
*.tmp
*.temp
```

既存の`frontend/.gitignore`と`backend/.gitignore`は必要に応じて残す。

### 2. ブランチ戦略

#### 2.1 GitHub Flowの採用

- **mainブランチ**: 本番環境にデプロイ可能な状態を常に保持
- **機能ブランチ**: 新機能や修正は`feature/`プレフィックスでブランチを作成
- **プルリクエスト**: 機能ブランチからmainブランチへのマージは必ずPR経由

#### 2.2 ブランチ命名規則

- `feature/` - 新機能の開発
- `fix/` - バグ修正
- `docs/` - ドキュメント更新
- `refactor/` - リファクタリング
- `test/` - テスト追加・修正

例:
- `feature/add-user-authentication`
- `fix/round-calculation-bug`
- `docs/update-readme`

### 3. コミットメッセージの規約

#### 3.1 Conventional Commitsの採用

コミットメッセージは以下の形式に従う:

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### 3.2 タイプ（type）

- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメントのみの変更
- `style`: コードの動作に影響しない変更（フォーマット、セミコロンなど）
- `refactor`: バグ修正や機能追加を伴わないコード変更
- `test`: テストの追加・修正
- `chore`: ビルドプロセスやツールの変更

#### 3.3 スコープ（scope）

オプション。変更が影響する範囲を指定。

例:
- `feat(api): add user authentication endpoint`
- `fix(frontend): fix round calculation display`
- `docs(readme): update setup instructions`

#### 3.4 サブジェクト（subject）

- 50文字以内
- 命令形で記述（例: "add" ではなく "added"）
- 文末にピリオドを付けない

#### 3.5 ボディ（body）

オプション。変更の理由や詳細を記述。

#### 3.6 フッター（footer）

オプション。破壊的変更や関連するIssue番号を記述。

例:
```
feat(api): add user authentication endpoint

Add POST /api/auth/login endpoint to handle user authentication.
Implements JWT token generation and validation.

Closes #123
```

#### 3.7 ドキュメント化

`docs/COMMIT_CONVENTIONS.md`を作成し、コミットメッセージの規約をドキュメント化する。

### 4. CI/CDパイプライン

#### 4.1 GitHub Actionsの使用

`.github/workflows/ci.yml`を作成し、以下のパイプラインを実装する。

#### 4.2 ワークフローの構成

##### 4.2.1 トリガー

- `push`イベント: mainブランチへのpush
- `pull_request`イベント: PRの作成・更新

##### 4.2.2 ジョブ構成

1. **Lintチェック**
   - バックエンドのlintチェック
   - フロントエンドのlintチェック

2. **テスト実行**
   - バックエンドのユニットテスト
   - フロントエンドのユニットテスト
   - フロントエンドのE2Eテスト（オプション）

3. **ビルド**
   - バックエンドのビルド
   - フロントエンドのビルド

##### 4.2.3 実行環境

- Node.js 20.x または 22.x
- PostgreSQL（テスト用）

##### 4.2.4 並列実行

可能な限りジョブを並列実行して、CI時間を短縮する。

#### 4.3 ワークフローファイルの構造

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    # lintチェック
  test-backend:
    # バックエンドテスト
  test-frontend:
    # フロントエンドテスト
  build:
    # ビルド
    needs: [lint, test-backend, test-frontend]
```

### 5. プルリクエストテンプレート

#### 5.1 PRテンプレートの作成

`.github/pull_request_template.md`を作成し、以下の項目を含める:

- 変更内容の概要
- 変更の種類（新機能、バグ修正、リファクタリングなど）
- 関連するIssue番号
- テストの実施状況
- チェックリスト（lint、テスト、ドキュメント更新など）

#### 5.2 テンプレートの内容

```markdown
## 変更内容

<!-- 変更内容の概要を記述 -->

## 変更の種類

- [ ] 新機能
- [ ] バグ修正
- [ ] リファクタリング
- [ ] ドキュメント更新
- [ ] その他

## 関連するIssue

<!-- 関連するIssue番号を記述（例: Closes #123） -->

## テストの実施状況

- [ ] ユニットテストを追加・更新
- [ ] E2Eテストを追加・更新
- [ ] 手動テストを実施

## チェックリスト

- [ ] コードのlintチェックを通過
- [ ] テストが全て通過
- [ ] ドキュメントを更新（必要に応じて）
- [ ] コミットメッセージがConventional Commitsに準拠
```

### 6. プリコミットフック

#### 6.1 Huskyとlint-stagedの使用

コミット前に自動的にlintチェックを実行するため、Huskyとlint-stagedを設定する。

#### 6.2 設定内容

- **ルートに`package.json`を作成**: Huskyとlint-stagedをdevDependenciesに追加
- **`.husky/pre-commit`を作成**: lint-stagedを実行するフック
- **`lint-staged`の設定**: ステージングされたファイルのみをlint

#### 6.3 lint-stagedの設定

ルートの`package.json`に`lint-staged`の設定を追加:

```json
{
  "lint-staged": {
    "backend/**/*.{ts,js}": [
      "cd backend && npm run lint"
    ],
    "frontend/**/*.{ts,js,vue}": [
      "cd frontend && npm run lint"
    ]
  }
}
```

#### 6.4 セットアップ手順

1. ルートで`npm install`を実行（Huskyとlint-stagedをインストール）
2. `npm run prepare`を実行（Huskyを初期化）
3. `.husky/pre-commit`が作成される

### 7. Gitエイリアスの設定

#### 7.1 推奨エイリアス

開発効率を向上させるため、以下のgitエイリアスを設定することを推奨します。

```bash
git config --global alias.ss status
```

これにより、`git ss`で`git status`を実行できます。

#### 7.2 その他の推奨エイリアス

必要に応じて、以下のエイリアスも設定できます:

```bash
# 短縮形
git config --global alias.ss status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.cm commit

# 便利なコマンド
git config --global alias.last 'log -1 HEAD'
git config --global alias.unstage 'reset HEAD --'
git config --global alias.graph 'log --oneline --graph --all'
```

#### 7.3 設定の確認

設定したエイリアスは以下のコマンドで確認できます:

```bash
git config --global --list | grep alias
```

### 8. コードレビュープロセス

#### 8.1 PRベースの開発

- すべての変更はPR経由でmainブランチにマージ
- PRには適切な説明とチェックリストを含める

#### 8.2 レビューのポイント

- コードの品質
- テストのカバレッジ
- ドキュメントの更新
- パフォーマンスへの影響
- セキュリティへの影響

#### 8.3 マージ方法

- Squash and merge または Rebase and merge を推奨
- コミット履歴を整理し、mainブランチをクリーンに保つ

## 実装手順

1. ルートに`.gitignore`を作成
2. ルートに`package.json`を作成（Huskyとlint-stagedの設定）
3. `.husky/pre-commit`を作成
4. `docs/COMMIT_CONVENTIONS.md`を作成
5. `.github/workflows/ci.yml`を作成
6. `.github/pull_request_template.md`を作成
7. gitリポジトリを初期化
   ```bash
   git init
   ```
8. プリコミットフックをセットアップ
   ```bash
   npm install
   npm run prepare
   ```
9. 初回コミットを作成（すべてのファイルを含める）
   ```bash
   git add .
   git commit -m "chore: initial commit with git and CI/CD setup"
   ```
   **注意**: 初回コミットには以下を含める:
   - `.gitignore`
   - `package.json`（ルート）
   - `.husky/pre-commit`
   - `docs/COMMIT_CONVENTIONS.md`
   - `.github/workflows/ci.yml`
   - `.github/pull_request_template.md`
   - 既存のプロジェクトファイル（frontend、backend、design、promptsなど）
10. GitHubにリポジトリを作成し、リモートを設定
    ```bash
    git remote add origin <repository-url>
    git branch -M main
    git push -u origin main
    ```

## 注意事項

- 既存の開発フロー（`prompts/00-ai-workflow.md`）との整合性を考慮
- Playwrightの設定で`process.env.CI`を参照しているため、CI環境での動作を確認
- 環境変数（`.env`）は`.gitignore`に含めるが、`.env.example`はコミットする
- セキュリティ上重要な情報（APIキー、パスワードなど）は環境変数で管理

## 参考資料

- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

