# ディレクトリ構造

## プロジェクトルート構造

```
majong-app/
├── frontend/          # フロントエンドアプリケーション
├── backend/           # バックエンドAPI
├── design/            # 実装設計書
│   ├── screen/        # 画面項目定義書
│   ├── api/           # API仕様書
│   └── model/         # データモデル（DB設計書）
├── prompts/           # AI開発用プロンプト
└── README.md          # プロジェクト全体のREADME
```

## フロントエンド構造

```
frontend/
├── src/               # ソースコード
│   ├── components/    # Vueコンポーネント
│   │   ├── PlayerList.vue
│   │   ├── PlayerForm.vue
│   │   ├── HanchanManager.vue
│   │   ├── RoundManager.vue
│   │   └── ScoreCalculator.vue
│   ├── composables/   # Composition API関数
│   │   ├── usePlayer.ts
│   │   ├── useHanchan.ts
│   │   ├── useRound.ts
│   │   └── useScore.ts
│   ├── utils/         # ユーティリティ関数
│   │   └── api.ts
│   ├── types/         # TypeScript型定義
│   │   ├── player.ts
│   │   ├── hanchan.ts
│   │   ├── round.ts
│   │   └── score.ts
│   ├── config/        # 設定ファイル
│   │   └── api.ts
│   ├── plugins/       # プラグイン設定
│   │   └── vuetify.ts
│   ├── assets/        # 静的アセット
│   ├── App.vue        # ルートコンポーネント
│   ├── main.ts        # エントリーポイント
│   └── style.css      # グローバルスタイル
├── public/            # 静的ファイル（ビルド時にそのままコピー）
├── dist/              # ビルド出力（gitignore対象）
├── node_modules/      # 依存パッケージ（gitignore対象）
├── package.json       # 依存関係とスクリプト
├── tsconfig.json      # TypeScript設定
└── vite.config.ts     # Vite設定
```

## バックエンド構造

```
backend/
├── src/               # ソースコード
│   ├── config/        # 設定ファイル（将来実装）
│   ├── types/         # 型定義（将来実装）
│   └── utils/         # ユーティリティ（将来実装）
├── dist/              # ビルド出力（gitignore対象）
├── node_modules/      # 依存パッケージ（gitignore対象）
├── package.json       # 依存関係とスクリプト
├── tsconfig.json      # TypeScript設定
└── README.md          # バックエンドのREADME
```

## ディレクトリの役割

### `src/components/`

Vue コンポーネントを配置します。

- **命名規則**: PascalCase（例: `PlayerList.vue`）
- **役割**: UI の表示とユーザーインタラクション
- **使用例**:
  - `PlayerList.vue`: 参加者一覧コンポーネント
  - `PlayerForm.vue`: 参加者登録・編集フォーム
  - `HanchanManager.vue`: 半荘管理コンポーネント
  - `RoundManager.vue`: 局管理コンポーネント
  - `ScoreCalculator.vue`: 打点計算コンポーネント

### `src/composables/`

Composition API の再利用可能な関数を配置します。

- **命名規則**: camelCase、`use`で始める（例: `usePlayer.ts`）
- **役割**: ビジネスロジックの集約と再利用
- **使用例**:
  - `usePlayer.ts`: 参加者管理のロジック
  - `useHanchan.ts`: 半荘管理のロジック
  - `useRound.ts`: 局管理のロジック
  - `useScore.ts`: 打点計算のロジック

### `src/utils/`

純粋関数やユーティリティ関数を配置します。

- **命名規則**: camelCase（例: `api.ts`）
- **役割**: 汎用的な処理の提供
- **使用例**:
  - `api.ts`: API呼び出しのユーティリティ

### `src/types/`

TypeScript の型定義を配置します。

- **命名規則**: camelCase（例: `player.ts`）
- **役割**: 型定義の集約
- **使用例**:
  - `player.ts`: 参加者関連の型定義
  - `hanchan.ts`: 半荘関連の型定義
  - `round.ts`: 局関連の型定義
  - `score.ts`: 打点関連の型定義

### `src/config/`

設定ファイルを配置します。

- **命名規則**: camelCase（例: `api.ts`）
- **役割**: アプリケーションの設定値
- **使用例**:
  - `api.ts`: API設定

### `public/`

ビルド時にそのままコピーされる静的ファイルを配置します。

- **役割**: 画像などの静的リソース

### `tools/`

開発用のスクリプトを配置します。

- **役割**: データ変換スクリプトなど

## ファイル配置ルール

### 機能ごとのディレクトリ分割

関連する機能は同じディレクトリに配置します。

```
src/
├── components/
│   └── quiz/              # クイズ関連コンポーネント（将来拡張時）
│       ├── QuizMain.vue
│       ├── QuizSidebarLeft.vue
│       └── QuizSidebarRight.vue
```

### 型定義の集約

型定義は`types/`ディレクトリに集約します。

```
src/
├── types/
│   ├── player.ts          # 参加者関連の型
│   ├── hanchan.ts         # 半荘関連の型
│   ├── round.ts           # 局関連の型
│   ├── score.ts           # 打点関連の型
│   └── index.ts           # 型のエクスポート
```

### 設定ファイルの分離

設定値は`config/`ディレクトリに分離します。

```
src/
├── config/
│   ├── api.ts             # API設定
│   └── constants.ts       # 定数定義（将来追加時）
```

## バックエンドの将来構造（実装時）

```
backend/
├── src/
│   ├── index.ts           # エントリーポイント
│   ├── app.ts             # アプリケーション設定
│   ├── controllers/       # コントローラー
│   │   ├── player.controller.ts
│   │   ├── hanchan.controller.ts
│   │   ├── round.controller.ts
│   │   └── score.controller.ts
│   ├── routes/            # ルーティング
│   │   ├── player.routes.ts
│   │   ├── hanchan.routes.ts
│   │   ├── round.routes.ts
│   │   └── score.routes.ts
│   ├── services/          # ビジネスロジック
│   │   ├── player.service.ts
│   │   ├── hanchan.service.ts
│   │   ├── round.service.ts
│   │   └── score.service.ts
│   ├── models/            # データモデル
│   │   ├── player.model.ts
│   │   ├── hanchan.model.ts
│   │   ├── round.model.ts
│   │   └── score.model.ts
│   ├── middleware/        # ミドルウェア
│   ├── types/             # 型定義
│   └── utils/             # ユーティリティ
├── tests/                 # テストファイル
│   ├── unit/              # ユニットテスト
│   └── integration/      # 統合テスト
├── migrations/            # データベースマイグレーション
└── dist/                  # ビルド出力
```

## ファイル命名規則

### Vue コンポーネント

- PascalCase（例: `QuizMain.vue`）
- ファイル名とコンポーネント名を一致させる

### TypeScript ファイル

- camelCase（例: `useQuiz.ts`, `progressStorage.ts`）
- 機能を表す明確な名前

### 設定ファイル

- camelCase（例: `dataSources.ts`, `vite.config.ts`）

### テストファイル

- 対象ファイル名 + `.test.ts`（例: `progressStorage.test.ts`）

## 実装設計書の配置

### `design/`ディレクトリ

実装設計書を配置するディレクトリです。

```
design/
├── screen/            # 画面項目定義書
│   ├── template.md    # 画面項目定義書のテンプレート
│   ├── [画面名]-screen.md
│   └── ...
├── api/               # API仕様書
│   ├── template.md    # API仕様書のテンプレート
│   ├── [リソース名]-[アクション].md
│   └── ...
└── model/             # データモデル（DB設計書）
    ├── template.md    # データモデルのテンプレート
    ├── [モデル名]-model.md
    └── ...
```

### 設計書の命名規則

- **画面項目定義書**: `[画面名]-screen.md` (例: `user-list-screen.md`)
- **API 仕様書**: `[リソース名]-[アクション].md` (例: `users-list.md`, `users-create.md`)
- **データモデル**: `[モデル名]-model.md` (例: `user-model.md`)

### 設計書とタスクの関連付け

タスクの設計フェーズでは、必要な設計書（API、画面、モデル）を`design/`ディレクトリに作成・更新します。タスクと設計書の関連付けは、`14-tasks.md`の設計フェーズに設計書へのリンクを記載します。
