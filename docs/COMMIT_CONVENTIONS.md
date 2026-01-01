# コミットメッセージの規約

このプロジェクトでは、[Conventional Commits](https://www.conventionalcommits.org/)の規約に従ってコミットメッセージを記述します。

## 基本形式

```
<type>(<scope>): <subject>

<body>

<footer>
```

## タイプ（type）

コミットの種類を指定します。以下のいずれかを使用してください。

- `feat`: 新機能の追加
- `fix`: バグ修正
- `docs`: ドキュメントのみの変更
- `style`: コードの動作に影響しない変更（フォーマット、セミコロンなど）
- `refactor`: バグ修正や機能追加を伴わないコード変更
- `test`: テストの追加・修正
- `chore`: ビルドプロセスやツールの変更
- `perf`: パフォーマンスの改善
- `ci`: CI/CD設定の変更

## スコープ（scope）

オプション。変更が影響する範囲を指定します。

例:
- `api`: バックエンドAPI
- `frontend`: フロントエンド
- `database`: データベース
- `config`: 設定ファイル
- `readme`: READMEファイル

## サブジェクト（subject）

変更内容を簡潔に記述します。

- 50文字以内
- 命令形で記述（例: "add" ではなく "added"）
- 文末にピリオドを付けない
- 大文字で始める

## ボディ（body）

オプション。変更の理由や詳細を記述します。

- 空行でサブジェクトと区切る
- 各行は72文字以内
- 変更の理由や、以前の動作との違いを説明

## フッター（footer）

オプション。破壊的変更や関連するIssue番号を記述します。

- 空行でボディと区切る
- `Closes #123` のようにIssue番号を参照
- `BREAKING CHANGE:` で破壊的変更を明示

## 例

### 基本的な例

```
feat(api): add user authentication endpoint
```

```
fix(frontend): fix round calculation display
```

```
docs(readme): update setup instructions
```

### ボディとフッターを含む例

```
feat(api): add user authentication endpoint

Add POST /api/auth/login endpoint to handle user authentication.
Implements JWT token generation and validation.

Closes #123
```

```
fix(backend): fix score calculation for double riichi

The score calculation was incorrect when multiple players declared riichi.
This fix ensures the correct player receives the riichi sticks.

Fixes #456
```

### 破壊的変更を含む例

```
feat(api): change authentication endpoint path

BREAKING CHANGE: The authentication endpoint has been moved from
/api/login to /api/auth/login. Update your client code accordingly.
```

## 注意事項

- コミットメッセージは日本語でも英語でも可
- 一つのコミットには一つの変更のみを含める
- 関連する変更は複数のコミットに分ける
- コミットメッセージは将来の自分や他の開発者が理解できるように記述する

