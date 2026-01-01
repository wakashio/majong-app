# アーキテクチャ

## 技術スタック

### フロントエンド

- **Vue 3**: プログレッシブJavaScriptフレームワーク
  - Composition APIを使用
  - `<script setup>`構文を採用
- **TypeScript**: 型安全性を確保
  - strict mode有効
  - 型定義を徹底
- **Vite**: 高速なビルドツール
  - HMR（Hot Module Replacement）対応
  - 開発サーバー: `http://localhost:5173`
- **Vuetify**: Material Designコンポーネントライブラリ
  - UIコンポーネントの提供

### バックエンド

- **TypeScript**: 型安全性を確保
- **Node.js**: ランタイム環境
- **Express**: Webフレームワーク（予定）
- **データベース**: PostgreSQL
  - 開発環境: Docker ComposeでPostgreSQLコンテナを用意
  - 本番環境: クラウドのマネージドサービス（AWS RDS、Google Cloud SQL、Azure Database等）を想定
- **ORM**: Prisma
- **Jest**: テストフレームワーク
- **ESLint**: リンター

## アーキテクチャパターン

### Vue 3 Composition API

Composition APIを使用して、ロジックの再利用性と保守性を向上させます。

```typescript
// composables/useHanchan.ts の例
export function useHanchan() {
  const hanchan = ref<Hanchan | null>(null);
  const rounds = ref<Round[]>([]);
  // ...
  return {
    hanchan,
    rounds,
    // ...
  };
}
```

### Composablesパターン

ビジネスロジックを`composables/`ディレクトリに集約し、コンポーネント間で共有します。

- `usePlayer.ts`: 参加者管理のロジック
- `useHanchan.ts`: 半荘管理のロジック
- `useRound.ts`: 局管理のロジック
- `useScore.ts`: 打点計算のロジック

### モノレポ構成

フロントエンドとバックエンドを分離したモノレポ構成を採用しています。

```
majong-app/
├── frontend/    # フロントエンドアプリケーション
├── backend/     # バックエンドAPI
├── design/      # 実装設計書
└── prompts/     # AI開発用プロンプト
```

### 状態管理

- **Vue Composition API**: コンポーネント内の状態管理
- **データベース**: 永続化が必要なデータ（参加者、半荘、局の記録）
- **provide/inject**: コンポーネント間での状態共有

```typescript
// App.vue
const hanchan = useHanchan();
provide("hanchan", hanchan);

// 子コンポーネント
const hanchan = inject<HanchanComposable>("hanchan");
```

## データフロー

### 局記録フロー

```
1. ユーザーが局を開始
   ↓
2. useRound()が初期化される
   ↓
3. 局開始APIを呼び出し
   ↓
4. データベースに局情報を保存
   ↓
5. 局情報を表示
```

### 打点計算フロー

```
1. ユーザーが局を終了
   ↓
2. 打点情報を入力
   ↓
3. calculateScore()が呼び出される
   ↓
4. 打点計算APIを呼び出し
   ↓
5. データベースに打点情報を保存
   ↓
6. スコアを更新
```

### リアルタイム更新フロー

```
1. 局の進行中に記録が発生
   ↓
2. APIを呼び出してデータベースに保存
   ↓
3. フロントエンドの状態を更新
   ↓
4. UIをリアルタイムで更新
```

## ディレクトリ構造

### フロントエンド

- `src/components/`: Vueコンポーネント
  - `PlayerList.vue`: 参加者一覧コンポーネント
  - `HanchanManager.vue`: 半荘管理コンポーネント
  - `RoundManager.vue`: 局管理コンポーネント
  - `ScoreCalculator.vue`: 打点計算コンポーネント
- `src/composables/`: Composition API関数
  - `usePlayer.ts`: 参加者管理のロジック
  - `useHanchan.ts`: 半荘管理のロジック
  - `useRound.ts`: 局管理のロジック
  - `useScore.ts`: 打点計算のロジック
- `src/utils/`: ユーティリティ関数
  - `api.ts`: API呼び出しのユーティリティ
- `src/types/`: TypeScript型定義
  - `player.ts`: 参加者関連の型定義
  - `hanchan.ts`: 半荘関連の型定義
  - `round.ts`: 局関連の型定義
  - `score.ts`: 打点関連の型定義
- `src/config/`: 設定ファイル
  - `api.ts`: API設定

### バックエンド

- `src/controllers/`: コントローラー
- `src/routes/`: ルーティング
- `src/services/`: ビジネスロジック
- `src/models/`: データモデル
- `src/middleware/`: ミドルウェア
- `src/types/`: 型定義
- `src/utils/`: ユーティリティ

## UI/UX

### レイアウト設計

#### App.vueのレイアウト

VuetifyのAppBar + Navigation Drawerを採用したレイアウトです。

- **v-app**: Vuetifyアプリケーションのルートコンポーネント
- **v-app-bar**: 上部に固定のアプリケーションバー
  - アプリタイトル（「麻雀記録アプリ」）
  - メニューボタン（Navigation Drawerの開閉）
- **v-navigation-drawer**: 左側のサイドメニュー
  - ナビゲーション項目:
    - ホーム（`/`）
    - 参加者一覧（`/players`）
    - 半荘一覧（`/hanchans`）
    - 統計・履歴（将来の機能）
    - About（`/about`）
  - モバイル端末では自動的にドロワー形式で表示
- **v-main**: メインコンテンツエリア
  - `<RouterView />`で各画面を表示

#### レスポンシブデザイン

- デスクトップ: Navigation Drawerは常に表示（固定）
- モバイル: Navigation Drawerはドロワー形式で表示（メニューボタンで開閉）

#### ナビゲーション

- ルーティングはVue Routerを使用
- アクティブなルートは自動的にハイライト表示
- モバイル端末でも使いやすいナビゲーション

#### フロー改善（2025-12-30）

半荘と局登録のUIを実用に寄せるため、以下のフロー改善を実施:

- **半荘作成後の遷移**: 半荘作成成功後、そのまま局入力画面（`/hanchans/:hanchanId/rounds/new?roundNumber=1`）へ遷移
- **局管理画面の1画面完結型**: タブまたはセクション切り替えで「局開始」「局進行中」「局終了」を1画面で管理
- **次の局への自動遷移**: 局保存成功後、「次の局へ」ボタンで次の局番号の入力画面へ自動遷移（確認ダイアログ表示）
- **デフォルト値の自動設定**: 
  - 局番号: 前の局+1（または自動計算）
  - 風: 局番号に応じて自動設定（1-4局: 東、5-8局: 南、9-12局: 西、13-16局: 北）
  - 親: 前の局の親を継続（流局時）または次の人へ
  - 本場・積み棒: 前の局から継承

これにより、半荘作成から局の記録まで、スムーズなフローで操作できるようになります。

### 画面設計

各画面の詳細設計は`design/screen/`ディレクトリ内の設計書を参照してください。

- `home-screen.md`: ホーム画面の設計
- `about-screen.md`: About画面の設計
- `player-list-screen.md`: 参加者一覧画面の設計
- `player-form-screen.md`: 参加者登録・編集画面の設計
- `hanchan-list-screen.md`: 半荘一覧画面の設計
- `hanchan-form-screen.md`: 半荘作成・編集画面の設計
- `round-list-screen.md`: 局一覧画面の設計
- `round-manage-screen.md`: 局管理画面の設計
- `statistics-history-screen.md`: 統計・履歴表示画面の設計

## 将来の拡張計画

### バックエンド実装時

- RESTful APIの提供
- データベース連携（参加者、半荘、局の記録の永続化）
- リアルタイム更新機能（WebSocket、Server-Sent Eventsなど）
- ユーザー認証機能

### アーキテクチャの進化

- 現在: フロントエンド + バックエンド（データベース）
- 将来: フロントエンド + バックエンド（データベース）+ リアルタイム通信
