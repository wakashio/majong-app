# 議事録

## 記録ルール

- 日付順（新しいものから上）に記録
- 各エントリに `[未反映]` / `[反映済み]` / `[却下]` のステータスを付与
- 反映先の設計ドキュメントへのリンクを記載
- 元のアイデアへの参照を記載（`12-ideas.md`へのリンク）

## テンプレート

```markdown
## YYYY-MM-DD 会議名

### [未反映] タイトル

- **元のアイデア**: `12-ideas.md` (YYYY-MM-DD アイデア名)
- **議論内容**:
  - 議論のポイント 1
  - 議論のポイント 2
- **決定事項**:
  - 決定事項 1
  - 決定事項 2
- **実装方針**:
  - 実装方法の概要
- **反映先**: `XX-design-document.md` (セクション名)
- **優先度**: 高/中/低
- **期限**: YYYY-MM-DD（オプション）
```

---

## 議事録一覧

### 2026-01-03 ロン時の点数計算の修正（本場・積み棒・放銃者の点数計算）

### [反映済み] ロン時の点数計算の修正（本場・積み棒・放銃者の点数計算）

- **元のアイデア**: `12-ideas.md` (2026-01-03 ロンの時の点数のマイナスが計算されなくなってしまった)
- **議論内容**:
  - 問題確認: ロン時に本場も積み棒も放銃者の点数も計算されていない
  - 原因: バックエンドでの計算を削除し、フロントエンドから送信された点数をそのまま使用するように変更した際に、ロン時の放銃者のマイナス点数、本場、積み棒が正しく計算されなくなった
  - ツモ時は点数表を使って計算するように変更したが、ロン時は点数表を使わず、フロントエンドから送信された点数をそのまま使用するように変更した
- **決定事項**:
  - **修正方針**: フロントエンドで、ロン時に和了者の点数（本場・積み棒除く）を入力した際に、本場・積み棒を加算して和了者の最終獲得点数と放銃者の最終支払い点数（マイナス）を自動計算する関数を追加する
  - **計算式**:
    - 和了者の最終獲得点数 = 和了点（本場・積み棒除く） + (本場 × 300) + (積み棒 × 1000)
    - 放銃者の最終支払い点数 = -(和了点（本場・積み棒除く） + (本場 × 300) + (積み棒 × 1000))
  - **本場の計算**: 親子の差はない（常に本場 × 300点）
  - **積み棒の計算**: 和了者が積み棒を獲得（通常のロンの場合）
- **実装方針**:
  - **フロントエンド**:
    - `ResultInputDialog.vue`に`calculateRonScoresFromWinnerScore`関数を追加
      - 引数: 和了点（本場・積み棒除く）、本場、積み棒、和了者、放銃者、全プレイヤー
      - 和了者の最終獲得点数を計算: 和了点 + (本場 × 300) + (積み棒 × 1000)
      - 放銃者の最終支払い点数を計算: -(和了点 + (本場 × 300) + (積み棒 × 1000))
      - 各プレイヤーの`scoreChange`を返す
    - ロン時の点数入力（`v-text-field`）の`@update:model-value`で、この関数を呼び出す
    - 和了点（本場・積み棒除く）を入力した際に、自動的に和了者と放銃者の点数を計算して更新
- **反映先**: `frontend/src/components/ResultInputDialog.vue`、`design/score-calculation-logic.md` (ロンの打点計算セクション)
- **優先度**: 高
- **備考**: 
  - ツモ時と同様に、ロン時も点数入力時に自動計算するようにする
  - 本場・積み棒は点数表に含めず、別途計算する方針は維持
  - ダブロン・トリロン時の本場・積み棒の分配は現時点では考慮しない（通常のロンのみ対応）

### 2026-01-02 ツモ・ロン時の点数入力方式の変更（計算方式からテーブル方式へ）

### [反映済み] ツモ・ロン時の点数入力方式の変更（計算方式からテーブル方式へ）

- **元のアイデア**: `12-ideas.md` (2026-01-02 ツモ・ロン時の点数入力方式の変更（計算方式からテーブル方式へ）)
- **議論内容**:
  - 点数表の要件を確認: ロン時は点数表不要（和了点 = 放銃者の支払い点数そのまま）
  - 点数表はツモ時のみ必要: (1) ツモ（親が和了）: 和了点 → 子1人あたりの支払い点数（本場・積み棒除く）、(2) ツモ（子が和了）: 和了点 → 親からの支払い点数、子からの支払い点数（本場・積み棒除く）
  - 点数表の範囲: 1000点〜144000点（トリプル役満まで。子: 96000点、親: 144000点）
  - 本場・積み棒は点数表に含めず、別途計算
  - バックエンドで点数表を保持し、計算もバックエンドで行う
  - フロントエンドでは点数をプルダウン（v-select）で選択し、選択した点数をバックエンドに送信して計算を行う
- **決定事項**:
  - **点数表の対象**: ツモ時のみ（ロン時は点数表不要）
  - **点数表の構造**:
    - ツモ（親が和了）: `{ [totalScore: number]: { fromNonDealer: number } }`
    - ツモ（子が和了）: `{ [totalScore: number]: { fromDealer: number, fromNonDealer: number } }`
  - **点数表の範囲**: 1000点〜144000点（トリプル役満まで。子: 96000点、親: 144000点）
  - **本場・積み棒**: 点数表に含めず、別途計算
  - **実装場所**: バックエンドで点数表を保持し、計算もバックエンドで行う
  - **UI変更**: 点数入力をテキスト入力（v-text-field）からプルダウン（v-select）に変更
- **実装方針**:
  - **バックエンド**:
    - `backend/src/services/scoreCalculationService.ts`に点数表を定義（定数として保持）
    - 点数表は`tsumoScoreTable`として定義: `{ dealer: { [score]: { fromNonDealer } }, nonDealer: { [score]: { fromDealer, fromNonDealer } } }`
    - `calculateTsumoScore`関数を修正し、点数表から値を取得する方式に変更
    - 本場・積み棒は別途計算して加算
    - ロン時の計算は変更不要（和了点 = 放銃者の支払い点数そのまま）
  - **フロントエンド**:
    - `ResultInputDialog.vue`の点数入力をプルダウン（v-select）に変更
    - プルダウンの選択肢は1000点〜144000点（トリプル役満まで。子: 96000点、親: 144000点）
    - 選択した点数をバックエンドに送信
    - 本場・積み棒の計算はバックエンドで行うため、フロントエンドの計算ロジックを削除または簡素化
- **反映先**: `design/score-calculation-logic.md` (点数計算ロジック設計書)、`backend/src/services/scoreCalculationService.ts`、`frontend/src/components/ResultInputDialog.vue`
- **優先度**: 中
- **備考**: 点数表は麻雀の標準的な点数表を使用。本場・積み棒は点数表に含めず、別途計算することで、点数表のサイズを小さくし、本場・積み棒の変更に対応しやすくする。

### 2026-01-02 流局時の本場計算ロジックの簡素化

### [反映済み] 流局時の本場計算ロジックの簡素化

- **元のアイデア**: 会話中の要望（流局時の本場の仕組みについて質問後、修正要求）
- **議論内容**:
  - 流局時の本場計算ロジックについて確認
  - 現在の実装では「親がノーテンで全員ノーテン」の場合と「親がノーテンで全員ノーテンでない」場合で分岐している
  - ユーザー要望: 全員ノーテンかどうかの分岐は不要で、親がノーテンの場合は常に本場+1とする
- **決定事項**:
  - 流局時の本場計算を簡素化: 全員ノーテンかどうかの判定を削除
  - 親がノーテンの場合（`isDealerTenpai !== true`）は常に本場+1とする
  - 親がテンパイしている場合: 本場+1、連荘
  - 親がノーテンの場合: 本場+1、連荘なし（全員ノーテンかどうかは関係なし）
- **実装方針**:
  - `riichiHonbaCalculationService.ts`の`calculateNextHonba`関数から`isAllNoten`パラメータを削除
  - 流局で親がノーテンの場合は常に本場+1を返すように修正
  - `calculateNextRoundSettings`関数から`isAllNoten`パラメータを削除
  - `roundService.ts`の`create`関数から全員ノーテン判定ロジックを削除
  - テストケースを修正（親がノーテンの場合は本場+1になるように）
  - 設計ドキュメントを更新
- **反映先**: `design/riichi-honba-calculation-logic.md` (本場の計算セクション)
- **優先度**: 中
- **備考**: 
  - 全員ノーテン判定のロジックとパラメータを削除することで、コードを簡素化
  - 親がノーテンの場合は全員ノーテンかどうかに関係なく本場+1となる仕様に統一
  - ユニットテスト53件、統合テスト76件すべて成功
  - lintエラーなし

### 2026-01-02 ステージング環境の500エラー問題: Cloud RunからCloud SQLへの接続エラーを解決する

### [未反映] ステージング環境の500エラー問題: Cloud RunからCloud SQLへの接続エラーを解決する

- **元のアイデア**: `12-ideas.md` (2026-01-02 ステージング環境の500エラー問題: Cloud RunからCloud SQLへの接続エラーを解決する)
- **議論内容**:
  - 問題の確認: ステージング環境でフロントエンドからAPIを実行すると500エラーが発生。ログを確認した結果、Cloud RunからCloud SQL（プライベートIP `10.103.0.3`）への接続がタイムアウトしている（レイテンシー127秒や0.6-0.8秒）
  - 原因の特定: Cloud SQLがプライベートIPのみで設定されているが、Cloud RunにVPCコネクタが設定されていないため、プライベートIP接続ができない
  - 解決方法の比較: (1) Cloud SQL Proxyを使用する方法（推奨・簡単）、(2) VPCコネクタを設定する方法（複雑）
  - Cloud SQL Proxyのメリット: 実装が簡単、VPCコネクタ不要、セキュアな接続、接続管理が自動、GCPの推奨方法
  - VPCコネクタのデメリット: VPCコネクタの作成が必要（追加リソース）、設定が複雑、コストが発生する可能性
- **決定事項**:
  - **解決方法**: Cloud SQL Proxyを使用する方法を採用
  - **実装内容**:
    1. Cloud SQLインスタンスの接続名を取得（`PROJECT_ID:REGION:INSTANCE_NAME`形式）
    2. デプロイ時に`--add-cloudsql-instances`フラグを追加
    3. DATABASE_URLを`postgresql://user:password@/database?host=/cloudsql/CONNECTION_NAME`形式に変更
  - **対象環境**: ステージング環境と本番環境の両方に対応
- **実装方針**:
  - デプロイワークフロー（`.github/workflows/deploy.yml`、`.github/workflows/deploy-production.yml`）を修正
  - Cloud SQLインスタンスの接続名を取得するステップを追加
  - `gcloud run deploy`コマンドに`--add-cloudsql-instances`フラグを追加
  - DATABASE_URLの接続文字列を`/cloudsql/CONNECTION_NAME`形式に変更
  - Prismaクライアントの設定は変更不要（接続文字列の変更のみ）
- **反映先**: `.github/workflows/deploy.yml`、`.github/workflows/deploy-production.yml`、デプロイ設定ドキュメント
- **優先度**: 高
- **備考**: Cloud SQLインスタンス名は`majong-app-db-staging`（ステージング）、`majong-app-db-production`（本番）。接続名は`PROJECT_ID:REGION:INSTANCE_NAME`形式（例: `majong-app-staging:us-west1:majong-app-db-staging`）。Terraformのoutputsに`connection_name`が定義されているが、GitHub Actionsのデプロイワークフローでは直接取得する必要がある。

### 2026-01-02 GCPインフラ設計

### [反映済み] GCPインフラ設計

- **元のアイデア**: `12-ideas.md` (2026-01-02 Teratermを使ったGCPへのデプロイ設定を行いたい。そのためにまず、インフラの設計を行いたい。)
- **議論内容**:
  - ユーザー要件の確認: 想定ユーザー数5人程度（同時使用最大5人）、コスト予算ほぼ0円想定、可用性目標オンデマンド利用、環境分離ステージング/本番、既存のGCPプロジェクトなし、GCPへのこだわりなし
  - 「Teraterm」は「Terraform」の誤記であることを確認（インフラのコード化の目的）
  - GCPの無料枠とコスト見積もりを提示: Cloud Run（無料枠内）、Cloud Storage（無料枠内）、Cloud SQL PostgreSQL（最小構成で月額¥1,000-1,500程度）
  - 他の選択肢（AWS、Railway/Render、VPS）との比較検討
  - GCPを選択することを決定
- **決定事項**:
  - **クラウドプロバイダー**: GCPを選択
  - **インフラ構成**:
    - フロントエンド: Cloud Run（無料枠内、月200万リクエストまで無料）
    - バックエンド: Cloud Run（無料枠内、月200万リクエストまで無料）
    - データベース: Cloud SQL for PostgreSQL（最小構成: db-f1-micro、vCPU共有0.2コア、メモリ0.6GB、ストレージ10GB HDD、月額約¥1,000-1,500）
    - ストレージ: Cloud Storage（無料枠内、月5GBまで無料）
    - ネットワーク: VPC、Cloud Load Balancer（無料枠内）
    - 監視・ログ: Cloud Logging、Cloud Monitoring（無料枠内）
  - **リージョン**: 無料枠が適用されるus-west1、us-central1、us-east1から選択（日本リージョンは無料枠対象外）
  - **インフラコード化**: Terraformを使用してインフラをコード化し、管理を容易にする
  - **デプロイ方法**: GitHub Actionsと組み合わせたCI/CDパイプラインを構築
  - **環境分離**: ステージング環境と本番環境を分離（別プロジェクトまたは同一プロジェクト内で分離）
  - **コスト見積もり**: 月額¥1,000-1,500程度（データベースのみ有料）、初年度は新規ユーザー向け$300の無料クレジットで最初の3ヶ月は実質無料
- **実装方針**:
  - Terraformでインフラをコード化: `infrastructure/`ディレクトリにTerraformファイルを配置
  - 環境ごとの設定: ステージング環境と本番環境で別々のTerraform設定ファイルを作成
  - Cloud Runの設定: フロントエンドとバックエンドをそれぞれCloud Runサービスとしてデプロイ
  - Cloud SQLの設定: 最小構成（db-f1-micro）でPostgreSQLインスタンスを作成
  - ネットワーク設定: VPC、ファイアウォールルール、Cloud Load Balancerを設定
  - セキュリティ設定: IAMロール、サービスアカウント、シークレット管理（Secret Manager）を設定
  - CI/CDパイプライン: GitHub Actionsでビルドとデプロイを自動化
  - コスト最適化: 無料枠を最大限活用し、最小構成のデータベースを使用
- **反映先**: `design/infrastructure/gcp-infrastructure-design.md` (新規作成)
- **優先度**: 中
- **関連ファイル**:
  - `infrastructure/terraform/` (新規作成予定)
  - `.github/workflows/deploy.yml` (新規作成予定)
  - `design/infrastructure/gcp-infrastructure-design.md` (新規作成予定)

### 2026-01-02 統計情報の合計点数表示の改善（返し点換算）

### [未反映] 統計情報の合計点数表示の改善（返し点換算）

- **元のアイデア**: `12-ideas.md` (2026-01-02 合計点数は30000返しの時は30000点引いて1000で割った値の合計が表示されていて欲しい)
- **議論内容**:
  - 統計情報の合計点数表示について、現在は`finalScoreWithUmaOka`の合計をそのまま表示しているが、より分かりやすい表示方法を検討
  - 各半荘の返し点数（`Session.umaOkaConfig.returnScore`）を使って変換計算を行う方針を決定
  - 30000返しに固定せず、各半荘の実際の返し点数を使用する方針で決定
  - 計算式: `(finalScoreWithUmaOka - returnScore) / 1000`で、各半荘ごとに変換して合計する
- **決定事項**:
  - 対象API: `GET /api/players/:id/statistics`（参加者統計）、`GET /api/sessions/:id/statistics`（セッション統計）
  - 各半荘の`Session.umaOkaConfig.returnScore`を取得し、各半荘ごとに`(finalScoreWithUmaOka - returnScore) / 1000`を計算して合計する
  - フロントエンドでは「合計点数（返し点換算）」などと表示し、単位は「点」（1000点単位）で表示する
  - 実装箇所: `backend/src/services/statisticsService.ts`の`getPlayerStatistics`関数、`backend/src/services/sessionService.ts`の`getStatistics`関数
- **実装方針**:
  - `getPlayerStatistics`関数: 各半荘の`Session`を取得し、`umaOkaConfig.returnScore`を使って変換計算を行う。各半荘の`finalScoreWithUmaOka`から`returnScore`を引いて1000で割った値を合計する
  - `sessionService.getStatistics`関数: 同様に各半荘の`Session.umaOkaConfig.returnScore`を取得し、変換計算を行う
  - フロントエンド: 表示名を「合計点数（返し点換算）」に変更し、単位を「点」で表示する
  - 返し点数が取得できない場合（`umaOkaConfig`がnullなど）は、デフォルト値（30000）を使用するか、変換計算をスキップして元の値を表示する
- **反映先**: `design/api/players-statistics.md` (レスポンス仕様), `design/api/sessions-statistics.md` (レスポンス仕様)
- **優先度**: 中
- **関連ファイル**:
  - `backend/src/services/statisticsService.ts`
  - `backend/src/services/sessionService.ts`
  - `frontend/src/views/PlayerStatisticsView.vue`
  - `frontend/src/views/SessionDetailView.vue`

### 2026-01-02 最新の局までスクロールするボタンの追加

### [反映済み] 最新の局までスクロールするボタンの追加

- **元のアイデア**: `12-ideas.md` (2026-01-02 最新の局までスクロールするボタンがいつでもアクセス可能な位置に欲しい)
- **議論内容**:
  - 局が多くなった場合、最新の局までスクロールするのが大変になる問題を確認
  - フローティングボタンの配置位置について議論: 画面右下、局一覧の上部、右上などが候補として挙がった
  - ユーザーから右上に配置する方針が提示された
- **決定事項**:
  - フローティングボタンを右上に固定配置（`position: fixed`）する
  - Vuetifyの`v-btn`を使用し、`fab`プロパティでフローティングボタンとして実装する
  - スクロール先は局番号が最大の局（`sortedRounds`の最後の要素）とする
  - 局が2つ以上ある場合のみ表示する（局が1つだけの場合は不要）
  - ボタンのアイコンは`mdi-arrow-down`または`mdi-chevron-double-down`を使用する
  - ツールチップで「最新の局へスクロール」を表示する
- **実装方針**:
  - `RoundManageView.vue`にフローティングボタンを追加
  - ボタンの配置: 右上に固定（`position: fixed; top: 16px; right: 16px;`など）
  - スクロール実装: `scrollIntoView()`を使用して該当の`v-expansion-panel`までスクロール
  - 必要に応じて`expandedPanels`に該当局のIDを追加して展開する
  - 表示条件: `sortedRounds.length >= 2`の場合のみ表示
- **反映先**: `design/screen/round-manage-screen.md` (UI改善セクション)
- **優先度**: 中
- **期限**: （未設定）

### 2026-01-02 親が聴牌で流局したときに親が変わってしまう不具合の修正

### [未反映] 親が聴牌で流局したときに親が変わってしまう不具合の修正

- **元のアイデア**: `12-ideas.md` (2026-01-02 親が聴牌で流局したときに親が変わってしまうことは不具合です)
- **議論内容**:
  - 現状の問題点を確認: フロントエンドの`useRoundNavigation.ts`で局番号の比較（`nextSettings.nextRoundNumber === round.roundNumber`）で連荘を判定しているが、親がテンパイで流局した場合でも局番号が変わってしまうと親が変わってしまう不具合が発生している可能性がある
  - `isDealerTenpai`が正しく渡されていない問題を確認: `useRoundNavigation.ts`の52行目で`isDealerTenpai: undefined`となっており、親がテンパイかどうかの情報がAPIに渡されていない
  - `CalculateNextSettingsResponse`に`isRenchan`フラグが含まれていない問題を確認: バックエンドでは`isRenchan`を計算しているが、レスポンスに含まれていないため、フロントエンドで直接使用できない
  - スコア情報から親のテンパイ状態を取得する方法を確認: `roundScores`には各参加者の`isTenpai`情報が含まれており、親の`isTenpai`を取得できることを確認
- **決定事項**:
  - `CalculateNextSettingsResponse`に`isRenchan`フラグを追加: バックエンドで計算した`isRenchan`をレスポンスに含める
  - フロントエンドで`isDealerTenpai`を正しく取得: 局終了時のスコア情報（`roundScores`）から親のテンパイ状態（`isTenpai`）を取得し、APIリクエストに正しく含める
  - フロントエンドの連荘判定ロジックを修正: 局番号の比較ではなく、`isRenchan`フラグを使用して親を判定する
- **実装方針**:
  - バックエンド: `backend/src/types/round.ts`の`CalculateNextSettingsResponse`に`isRenchan: boolean`フィールドを追加
  - バックエンド: `backend/src/controllers/roundController.ts`の`calculateNextSettings`関数で、計算した`isRenchan`をレスポンスに含める
  - フロントエンド: `frontend/src/types/round.ts`の`CalculateNextSettingsResponse`に`isRenchan: boolean`フィールドを追加
  - フロントエンド: `frontend/src/composables/useRoundNavigation.ts`の`handleNextRoundFromPanel`関数で、`roundScores`から親のテンパイ状態を取得し、`calculateNextRoundSettings`のリクエストに`isDealerTenpai`を含める
  - フロントエンド: `useRoundNavigation.ts`の81行目の連荘判定ロジックを、局番号の比較から`isRenchan`フラグの使用に変更
- **反映先**: `design/api/rounds-calculate-next-settings.md` (レスポンス仕様), `design/screen/round-manage-screen.md` (次局遷移処理)
- **優先度**: 高
- **関連ファイル**:
  - `backend/src/types/round.ts`
  - `backend/src/controllers/roundController.ts`
  - `frontend/src/types/round.ts`
  - `frontend/src/composables/useRoundNavigation.ts`

### 2026-01-01 ウマオカ計算ロジックの修正と統計情報の改善

### [反映済み] ウマオカ計算ロジックの修正と統計情報の改善

- **元のアイデア**: `12-ideas.md` (2026-01-01 ウマオカ計算ロジックの修正（1位にオカの合計を加算する）), `12-ideas.md` (2026-01-01 統計情報にウマオカを考慮した合計点数を表示する)
- **議論内容**:
  - ウマオカ計算ロジックの現状確認: 現在の実装では全員に`oka`を加算した後、1位に`oka × 4`を加算していたが、計算が二重になっている可能性がある
  - 正しいウマオカ計算ロジックについて議論: 全員から返し点（`returnScore`）を減算し、1位に20000を加算する方式に変更することを決定
  - データモデルについて議論: ウマオカを含んだ値は別カラムに持つ方針で決定。`finalScore`はウマオカ考慮前の値（`currentScore`）を保存し、`finalScoreWithUmaOka`はウマオカ考慮後の値を保存する
  - 統計情報の表示内容について議論: 複数半荘の`finalScoreWithUmaOka`の合計を表示し、平均最終得点（`averageScore`）と流局回数（`totalDraws`）を削除する方針で決定
  - 既存データへの影響について議論: 既存の半荘データには反映しない（新規半荘のみ適用）方針で決定
- **決定事項**:
  - ウマオカ計算ロジックの修正: `umaOkaCalculationService.ts`の`calculateUmaOka`関数を修正し、全員から返し点（`returnScore`）を減算し、1位に20000を加算する方式に変更
  - データモデルの変更: `HanchanPlayer`モデルに`finalScoreWithUmaOka`フィールドを追加（`Int?`型）
  - `finalScore`: ウマオカ考慮前の値（`currentScore`）を保存
  - `finalScoreWithUmaOka`: ウマオカ考慮後の値を保存
  - 統計情報の変更: `totalFinalScore`フィールドを追加し、各半荘の`finalScoreWithUmaOka`の合計を表示
  - 統計情報から削除: `averageScore`（平均最終得点）、`totalDraws`（流局回数）を削除
  - 対象API: `GET /api/players/:id/statistics`（参加者統計）、`GET /api/sessions/:id/statistics`（セッション統計）
  - 既存データ: 既存の半荘データには反映しない（新規半荘のみ適用）
- **実装方針**:
  - `umaOkaCalculationService.ts`の`calculateUmaOka`関数を修正: 全員から返し点（`returnScore`）を減算し、1位に20000を加算する方式に変更
  - Prismaスキーマの更新: `HanchanPlayer`モデルに`finalScoreWithUmaOka Int?`フィールドを追加
  - マイグレーションの作成: `finalScoreWithUmaOka`フィールドを追加するマイグレーション
  - `hanchanService.ts`の`update`関数を修正: `finalScore`と`finalScoreWithUmaOka`の両方を保存
  - `statisticsService.ts`の`getPlayerStatistics`関数を修正: `totalFinalScore`を追加、`averageScore`と`totalDraws`を削除
  - `statisticsService.ts`の`getSessionStatistics`関数を修正: `totalFinalScore`を追加、`averageScore`と`totalDraws`を削除
  - テストコードの修正: ウマオカ計算ロジックのテストを修正、統計情報のテストを修正
- **反映先**: `design/api/hanchans-update.md` (半荘更新API), `design/api/players-statistics.md` (参加者統計API), `design/api/sessions-statistics.md` (セッション統計API), `design/mahjong-data-model.md` (データモデル設計書)
- **優先度**: 高（ウマオカ計算ロジックの修正）、中（統計情報の改善）
- **タスク**: `14-tasks.md` (TASK-20260101-019 ウマオカ計算ロジックの修正（1位にオカの合計を加算する）), `14-tasks.md` (TASK-20260101-020 統計情報にウマオカを考慮した合計点数を表示する)

### 2026-01-01 最近のセッションをホーム画面に追加します

### [未反映] 最近のセッションをホーム画面に追加します

- **元のアイデア**: `12-ideas.md` (2026-01-01 最近のセッションをホーム画面に追加します)
- **議論内容**:
  - ホーム画面の現状確認: 現在は「最近の半荘」セクション（最新5件）と「クイックアクション」セクションが表示されている
  - セッション機能の現状確認: セッション一覧API (`GET /api/sessions`) は実装済みで、日付順（新しい順）で返却される
  - UI配置について議論: 「最近の半荘」の上に「最近のセッション」セクションを追加する方針で決定
  - 表示件数について議論: 既存の半荘表示と同様に最新5件を表示する方針で決定
  - 表示情報について議論: 既存の半荘表示と同様の形式（セッション名、参加者情報、日付）を表示する方針で決定
  - クリック時の動作について議論: セッション詳細画面 (`/sessions/:id`) に遷移する方針で決定
  - セッションがない場合の表示について議論: 既存の半荘表示と同様に「セッションがまだありません」のようなメッセージを表示する方針で決定
  - ソート順について議論: APIのデフォルト（日付順、新しい順）を使用する方針で決定
- **決定事項**:
  - UI配置: 「最近の半荘」の上に「最近のセッション」セクションを追加
  - 表示件数: 最新5件（既存の半荘表示と同様）
  - 表示情報: セッション名（または「無題」）、参加者情報（参加者名の一覧）、日付（開始日時）
  - クリック時の動作: セッション詳細画面 (`/sessions/:id`) に遷移
  - セッションがない場合: 「セッションがまだありません」のようなメッセージを表示
  - ソート順: APIのデフォルト（日付順、新しい順）を使用
- **実装方針**:
  - `HomeView.vue`に「最近のセッション」セクションを追加（「最近の半荘」の上に配置）
  - `sessionApi.ts`の`getSessions`関数を使用してセッション一覧を取得（`limit=5`で最新5件を取得）
  - 既存の半荘表示と同様のUI形式で実装（`v-card`、`v-list`、`v-list-item`を使用）
  - セッション名、参加者情報、日付を表示
  - セッションクリック時に`router.push(/sessions/${session.id})`でセッション詳細画面に遷移
  - セッションがない場合は`v-alert`でメッセージを表示
  - エラーハンドリングとローディング表示を実装（既存の半荘表示と同様）
- **反映先**: `design/screen/home-screen.md` (最近のセッションセクション)
- **優先度**: 中
- **関連機能**: ホーム画面、セッション機能、セッション一覧、`HomeView.vue`、`sessionService.ts`、`GET /api/sessions` API

### 2026-01-01 流局時に本場が増える処理を追加したい

### [反映済み] 流局時に本場が増える処理を追加したい

- **元のアイデア**: `12-ideas.md` (2026-01-01 流局時に本場が増える処理を追加したい)
- **議論内容**:
  - 流局時の本場計算ロジックの実装状況を確認。`riichiHonbaCalculationService.ts`の`calculateNextHonba`関数で、親がテンパイしている場合の本場増加は実装済みであることを確認
  - 特殊流局で親がテンパイしている場合の本場増加について確認。実装では特殊流局でも親がテンパイしていれば本場が増加するが、設計ドキュメント（`design/score-calculation-logic.md`）では「本場は増加しない」と記載されており不整合があることを確認
  - 全員ノーテン流局時の本場増加について議論。麻雀のルールに基づき、全員ノーテン流局の場合も本場が増加する必要があることを確認
  - 連荘と本場増加は別の概念であることを確認。連荘の場合は局番号が変わらず本場が+1、全員ノーテン流局の場合は局番号が+1（連荘ではない）だが本場が+1
- **決定事項**:
  - 特殊流局で親がテンパイしている場合: 本場+1、連荘（実装は正しい、設計ドキュメントを更新）
  - 全員ノーテン流局の場合: 本場+1、連荘なし（実装が必要）
  - 本場増加の条件を明確化: (1) 親が和了した場合 → 連荘 + 本場+1、(2) 流局で親がテンパイした場合 → 連荘 + 本場+1、(3) 流局で全員ノーテンの場合 → 連荘なし + 本場+1
  - 連荘の条件（局番号変わらず）: (1) 親が和了した場合、(2) 流局で親がテンパイした場合（全員ノーテンは連荘ではない）
- **実装方針**:
  - `calculateNextHonba`関数を修正: 全員ノーテンの場合も本場+1を返すように修正（連荘判定とは独立）。全参加者のテンパイ情報を受け取るパラメータを追加
  - `isDealerRenchan`関数は現状維持: 全員ノーテンの場合はfalseを返す（連荘ではない）
  - 全員ノーテンの判定ロジックを追加: 流局時に全参加者が`isTenpai === false`の場合を判定
  - `roundService.ts`の`create`関数と`endRound`関数を修正: 全参加者のテンパイ情報を取得し、`calculateNextHonba`関数に渡す
  - 設計ドキュメントを更新: `design/riichi-honba-calculation-logic.md`に全員ノーテン流局時の本場増加を追加、`design/score-calculation-logic.md`に特殊流局で親がテンパイしている場合の本場増加を明記
- **反映先**: `design/riichi-honba-calculation-logic.md` (本場の計算セクション)、`design/score-calculation-logic.md` (流局の打点計算セクション)
- **優先度**: 中
- **関連機能**: 本場計算、流局処理、局終了処理、`riichiHonbaCalculationService.ts`、`calculateNextHonba`関数、`roundService.ts`、`endRound`関数

### 2026-01-01 点数計算ロジックを設計を含め集約したい

### [未反映] 点数計算ロジックを設計を含め集約したい

- **元のアイデア**: `12-ideas.md` (2026-01-01 点数計算ロジックを設計を含め集約したい)
- **議論内容**:
  - 点数計算ロジックが複数の場所に分散している問題を確認: (1) 設計ドキュメント: `design/score-calculation-logic.md`、(2) バックエンドサービス: `backend/src/services/scoreCalculationService.ts`、(3) フロントエンドComposable: `frontend/src/composables/useScoreCalculation.ts`、(4) バックエンドサービス（局終了処理）: `backend/src/services/roundService.ts`の`endRound`関数内、(5) フロントエンドの結果入力: `frontend/src/composables/useResultInput.ts`
  - 局の結果記録画面（`ResultInputDialog.vue`）でDB登録前の数値（積み棒・本場による点数変動、局収支）を表示していることが原因でフロントエンドの計算ロジックが煩雑になっている問題を確認
  - 確定前のプレビュー表示を削除することで、フロントエンドの計算ロジックを簡素化できることを確認
  - バックエンドの計算ロジックを単一のソース（`scoreCalculationService.ts`）に集約する方針で合意
- **決定事項**:
  - 確定前のプレビュー表示（積み棒・本場による点数変動、局収支）を削除する
  - 確定ボタン押下時にバックエンドAPI（`endRound`）で計算・保存する
  - 確定後、DBから取得したデータを打点記録テーブルに表示する
  - フロントエンドの計算ロジック（`useScoreCalculation.ts`の`getRiichiHonbaScoreChange`、`getTotalScoreChange`など）を削除または簡素化する
  - バックエンドの計算ロジック（`scoreCalculationService.ts`）を単一のソースとして使用する
- **実装方針**:
  - `ResultInputDialog.vue`の414-458行目の積み棒・本場による点数変動と局収支の表示を削除
  - `useScoreCalculation.ts`の`getRiichiHonbaScoreChange`、`getTotalScoreChange`関数を削除または簡素化（打点記録テーブル表示用の関数は残す）
  - `useResultInput.ts`の計算ロジックを削除または簡素化
  - バックエンドの`scoreCalculationService.ts`を中心に計算ロジックを集約
  - 設計ドキュメント（`design/score-calculation-logic.md`）と実装コードの整合性を保つ
- **反映先**: `design/score-calculation-logic.md` (実装方針セクション)
- **優先度**: 中
- **関連タスク**: タスク切り出しが必要

### 2026-01-01 ダブロンの時、積み棒や本場は放銃した人から最も席順が近い人だけが受け取るようにする

### [反映済み] ダブロンの時、積み棒や本場は放銃した人から最も席順が近い人だけが受け取るようにする

- **元のアイデア**: `12-ideas.md` (2026-01-01 ダブロンの時、積み棒や本場は放銃した人から最も席順が近い人だけが受け取るようにする)
- **議論内容**:
  - ダブロン時の積み棒と本場の分配ルールについて議論
  - 現在の実装では、ダブロン時に和了者全員に積み棒と本場の点数が分配されている問題を確認
  - 麻雀のルールに基づき、放銃者から見て最も近い上家のみが積み棒と本場を受け取る必要があることを確認
  - 上家の計算方法: `seatPosition`を使用（0=東、1=南、2=西、3=北）、上家の`seatPosition = (放銃者のseatPosition + 3) % 4`
  - トリロン（3人同時ロン）も同様に、最も近い上家のみが受け取ることを確認
  - ツモの場合は和了者が1人のみなので、この修正の対象外であることを確認
- **決定事項**:
  - ダブロン時の判定: ロン（`resultType === RoundResultType.RON`）かつ和了者が2人以上の場合にダブロンと判定
  - 上家の計算方法: `(放銃者のseatPosition + 3) % 4`で計算
  - 積み棒の分配: ダブロン時は最も近い上家のみに分配（`roundService.ts` 943-948行目の修正）
  - 本場の点数計算: ダブロン時は最も近い上家のみが本場の点数を受け取る（`roundService.ts` 895-900行目の修正）
  - データ取得の修正: `endRound`関数で`hanchanPlayers`を取得する際に、`seatPosition`も含める（675-679行目の修正）
- **実装方針**:
  - バックエンド修正（`backend/src/services/roundService.ts`）
    - `endRound`関数で`hanchanPlayers`を取得する際に、`seatPosition`も含める
    - 積み棒の分配処理（943-948行目）を修正: ダブロン時は最も近い上家のみに分配
    - 本場の点数計算処理（895-900行目）を修正: ダブロン時は最も近い上家のみが本場の点数を受け取る
    - ダブロン判定のヘルパー関数を作成（オプション）
  - テスト
    - ダブロン時の積み棒分配のテスト
    - ダブロン時の本場点数計算のテスト
    - トリロン時のテスト
    - 通常のロン（和了者1人）時のテスト（既存の動作が壊れていないことを確認）
- **反映先**: `design/score-calculation-logic.md` (ダブロン時のルール)
- **優先度**: 中
- **関連タスク**: 「打点記録の表にハンとフを出すのをやめ、積み棒と本場の点数移動を載せる」の別タスクとして扱う

### 2026-01-01 セッション機能の追加

### [未反映] セッション機能の追加

- **元のアイデア**: `12-ideas.md` (2026-01-01 セッション機能の追加)
- **議論内容**:
  - セッション機能の目的と要件について議論
  - データモデル設計について検討（Session、SessionPlayer、Hanchanとの関係）
  - 画面構成について検討（セッション一覧、セッション作成、セッション詳細、半荘作成画面の変更）
  - 既存の半荘一覧画面との関係について議論
  - セッション詳細画面からの半荘作成方法について議論
  - セッションの日付管理方法について議論
  - セッション削除時の動作について議論
- **決定事項**:
  - セッション詳細画面から半荘作成を行う方針で決定
  - 既存の半荘一覧画面は残し、セッション未紐づきの半荘も表示する
  - セッション作成時は参加者を4人以上選択する必要がある（バリデーション）
  - セッション詳細画面からの半荘作成時は、セッションの参加者から4人を選択する方式
  - セッションの日付は日付のみ（時刻なし）で管理する
  - 同日に複数セッションを作成できるようにする
  - セッション削除時は、紐づく半荘の`sessionId`を`null`に設定する（Cascade削除はしない）
- **実装方針**:
  - **データモデル**: Sessionモデル、SessionPlayerモデルを追加。Hanchanモデルに`sessionId`フィールドを追加（オプション）
  - **API**: セッション管理API（作成、一覧取得、詳細取得、更新、削除、統計取得）を追加。半荘作成APIに`sessionId`パラメータを追加（オプション）
  - **画面**: セッション一覧画面、セッション作成画面、セッション詳細画面を新規作成。半荘作成画面を変更（セッション詳細画面から遷移した場合の処理を追加）
  - **バリデーション**: セッション作成時に参加者が4人以上であることを確認
- **反映先**: 未定（設計ドキュメント作成が必要）
- **優先度**: 中
- **期限**: 未定

### 2026-01-01 git管理とCI/CDについて

### [反映済み] git管理とCI/CDについて

- **元のアイデア**: `12-ideas.md` (2026-01-01 git管理とCI/CDについて)
- **議論内容**:
  - 全体方針から議論を開始
  - 現状確認: gitリポジトリが未初期化、`.gitignore`が`frontend/`と`backend/`に分かれている、CI/CD設定が存在しないことを確認
  - gitリポジトリの初期化と`.gitignore`の統一について議論
  - ブランチ戦略（GitHub Flow、Git Flow、シンプルな3ブランチ）について検討
  - コミットメッセージの規約（Conventional Commits、シンプルな形式）について検討
  - CI/CDパイプライン（GitHub Actions、GitLab CI）について検討
  - コードレビュープロセス（PRベース、必須レビュー）について検討
- **決定事項**:
  - gitリポジトリの初期化を今すぐ行う
  - ブランチ戦略はGitHub Flowを採用（mainブランチのみ、機能ブランチを作成してPRでマージ）
  - コミットメッセージはConventional Commitsを採用（`feat:`, `fix:`, `docs:`, `refactor:`などのプレフィックス）
  - CI/CDはGitHub Actionsを使用
  - コードレビューはPRベースの開発を採用（必須レビューは後で検討）
  - ルートに`.gitignore`を作成し、frontend/backend共通の除外を定義する
  - 既存の`frontend/.gitignore`と`backend/.gitignore`は必要に応じて残す
- **実装方針**:
  - ルートに`.gitignore`を作成し、以下の内容を含める: node_modules、dist、.env、ログファイル、エディタ設定、OS固有ファイルなど
  - gitリポジトリを初期化し、初期コミットを作成
  - GitHub Flowに基づいたブランチ運用を開始
  - Conventional Commitsの規約をドキュメント化
  - GitHub Actionsのワークフローファイルを作成し、以下のパイプラインを実装:
    - 自動テスト（バックエンド・フロントエンド）
    - 自動ビルド
    - lintチェック
    - 将来的に自動デプロイも検討
  - PRテンプレートを作成し、コードレビュープロセスを明確化
- **反映先**: 設計ドキュメントを作成予定（`design/documentation/git-cicd-setup.md`など）
- **優先度**: 中
- **備考**: 既存の開発フロー（`prompts/00-ai-workflow.md`）との整合性を考慮する。Playwrightの設定で`process.env.CI`を参照しているため、CI環境での動作を確認する必要がある。

### 2026-01-01 会話上の流れで行った変更を備考などにまとめる summarize コマンドの作成

### [未反映] 会話上の流れで行った変更を備考などにまとめる summarize コマンドの作成

- **元のアイデア**: `12-ideas.md` (2025-12-31 会話上の流れで行った変更を備考などにまとめる summarize コマンドの作成)
- **議論内容**:
  - 会話上の流れで行った変更を備考などにまとめる機能の必要性について議論
  - 開発中に会話を通じて行った変更や修正を、後から参照できるようにまとめる機能は有用であることを確認
  - 会話履歴から変更内容を抽出し、構造化された形式でまとめる機能が必要
  - 既存の`/status`コマンドや`/continue`コマンドとの関係を整理
  - 議事録やタスクの備考欄に自動的に反映する機能も検討
- **決定事項**:
  - `/summarize`コマンドを作成する方針で決定
  - 会話履歴から変更内容を抽出し、構造化された形式でまとめる機能を実装
  - 変更内容、修正理由、影響範囲などを備考として記録
  - 議事録やタスクの備考欄に自動的に反映する機能を実装
  - 既存の`/status`コマンドや`/continue`コマンドとは異なる機能として実装
- **実装方針**:
  - `.cursor/commands/summarize.md`を作成
  - 会話履歴から変更内容を抽出するロジックを実装
  - 構造化された形式でまとめる機能を実装
  - 議事録やタスクの備考欄に自動的に反映する機能を実装
  - 出力形式: 変更内容、修正理由、影響範囲などを構造化された形式で出力
- **反映先**: 
  - `.cursor/commands/summarize.md` (新規作成)
  - `prompts/00-ai-workflow.md` (コマンド一覧に追加)
- **優先度**: 中

### 2026-01-01 ReadMeを更新する

### [反映済み] ReadMeを更新する

- **元のアイデア**: `12-ideas.md` (2025-12-30 ReadMeを更新する)
- **議論内容**:
  - 現在のREADMEには基本的なセットアップ情報と技術スタックのみが記載されている
  - AI開発フロー（`/idea`, `/discuss`, `/design`, `/implement`, `/test`, `/review`などのコマンド）の説明が不足している
  - プロジェクトの開発フローやワークフローの説明が不足している
  - コマンドシステムの説明が不足している
  - READMEはプロジェクトの入り口となる重要なドキュメントであり、新規参加者やAIがプロジェクトの全体像を理解するために必要な情報を含めるべき
- **決定事項**:
  - READMEにAI開発フローのセクションを追加する
    - フローの概要（`prompts/00-ai-workflow.md`を参照）
    - コマンド一覧と各コマンドの説明
    - 開発フローの全体像（アイデア記録 → 議論 → 議事録記録 → タスク切り出し → 設計 → 実装 → テスト → AIレビュー）
  - プロジェクトの運用方針への参照を追加する
    - `/policy`コマンドの説明
    - `prompts/`ディレクトリの説明
- **実装方針**:
  - `README.md`を更新
    - AI開発フローのセクションを追加
      - フローの概要
      - コマンド一覧と各コマンドの説明（`/idea`, `/discuss`, `/design`, `/implement`, `/test`, `/review`, `/task`, `/status`, `/continue`, `/policy`）
      - 開発フローの全体像
    - プロジェクトの運用方針への参照を追加
      - `/policy`コマンドの説明
      - `prompts/`ディレクトリの説明
- **反映先**: `README.md`
- **優先度**: 中
- **反映日**: 2026-01-01
- **反映者**: AI
- **タスク**: `14-tasks.md` (TASK-20260101-013)

### 2026-01-01 RoundManageView.vueのコンポーネント分割

### [反映済み] RoundManageView.vueのコンポーネント分割

- **元のアイデア**: `12-ideas.md` (2026-01-01 RoundManageView.vueのコンポーネント分割)
- **議論内容**:
  - `RoundManageView.vue`が1049行と非常に長く、テンプレート部分も複雑である
  - Composablesへの分離は完了しているが、コンポーネント分割は未対応
  - 複数の責務（半荘情報表示、ダッシュボード、局カード、ダイアログなど）が1つのファイルに集約されている
  - 既存の`PlayerSelectButton.vue`のような再利用可能なコンポーネントのパターンを参考にする
- **決定事項**:
  - **8つのコンポーネントに分割する方針で決定**:
    1. `HanchanInfoCard.vue` - 半荘情報カード（半荘名、参加者表示）
    2. `HanchanDashboard.vue` - ダッシュボード（統計情報のテーブル表示）
    3. `RoundCard.vue` - 局カード（ExpansionPanel内の各局の表示、鳴き・リーチ記録、打点記録、アクションボタンを含む）
    4. `ActionList.vue` - 鳴き・リーチ記録のリスト表示
    5. `ScoreTable.vue` - 打点記録テーブル
    6. `RoundActionButtons.vue` - 局のアクションボタン（局を終了、次局へ、削除）
    7. `ActionAddDialog.vue` - アクション追加ダイアログ（鳴き・リーチ追加）
    8. `ResultInputDialog.vue` - 結果入力ダイアログ（局終了時の結果記録）
  - **コンポーネント設計方針**:
    - 各コンポーネントは単一責任の原則に従い、UI表示とユーザーインタラクションに集中する
    - ロジックは既存のComposables（`useRoundManagement`, `useRoundActions`, `useResultInput`, `useRoundDisplay`など）に集約し、コンポーネント間でのロジックの重複を避ける
    - props/emitsで親子間のデータフローを明確にする（既存の`PlayerSelectButton.vue`のパターンを参考）
    - コンポーネントは`frontend/src/components/`ディレクトリに配置する
  - **実装順序**: 段階的に実装し、各コンポーネントを順次作成・統合する
    - まず表示系コンポーネント（`HanchanInfoCard`, `HanchanDashboard`, `ActionList`, `ScoreTable`）から開始
    - 次にインタラクション系コンポーネント（`RoundActionButtons`, `RoundCard`）を実装
    - 最後にダイアログ系コンポーネント（`ActionAddDialog`, `ResultInputDialog`）を実装
- **実装方針**:
  - 既存の機能を壊さないように、段階的に分割を進める
  - 各コンポーネントのprops/emitsを明確に定義し、型安全性を保つ
  - 既存のComposablesを活用し、コンポーネントは主にUI表示とユーザーインタラクションに集中する
  - テストを実行しながら進め、各ステップで動作確認を行う
  - 既存の`PlayerSelectButton.vue`のパターンを参考にし、一貫性のあるコンポーネント設計を目指す
- **反映先**: 実装時に決定
- **優先度**: 中

### 2026-01-01 RoundManageView.vueのコメント整理とさらなるリファクタリング

### [反映済み] RoundManageView.vueのコメント整理とさらなるリファクタリング

- **元のアイデア**: `12-ideas.md` (2026-01-01 RoundManageView.vueのコメント整理とさらなるリファクタリング)
- **議論内容**:
  - `RoundManageView.vue`には多数のコメントが存在し、可読性と保守性の低下が問題
  - 不要なコメント（「Composablesから取得済み」など）、デバッグ用のconsole.log、TODOコメント、重複した説明コメントが存在
  - コメントの統一性（形式や言語）が取れていない
  - コンポーザブルへの切り出しの対応が済んでいない部分がまだ存在する
- **決定事項**:
  - **コンポーザブルへの切り出しを優先的に実施**: まだComposablesに切り出されていないロジックを適切なComposablesに切り出す
  - 以下のComposablesを作成または拡張する:
    1. `useRoundData` - 局データ（鳴き・リーチ・打点記録）の読み込み処理（`loadRoundData`）
    2. `useRoundActions`の拡張 - アクション追加/削除処理（`handleAddAction`, `handleDeleteAction`）を追加
    3. `useResultInput`の拡張 - 結果確定処理（`handleConfirmResult`）とスコア入力バリデーション（`validateScoreInputsForRound`）を追加
    4. `useRoundNavigation` - 次局への遷移処理（`handleNextRoundFromPanel`）
    5. `useRoundDialogs` - ダイアログ管理（アクション追加ダイアログ、局削除確認ダイアログなど）
    6. `useRoundExpansion` - ExpansionPanelの展開状態管理（`expandedPanels`）
    7. `useRoundManagement`の拡張 - 局の保存処理（`handleSaveRound`）を追加または統合
  - **ラッパー関数の削除**: 不要なラッパー関数（`getRoundLabelWithDealerAndSticks`, `getRiichiHonbaScoreChange`, `getTotalScoreChange`, `getRiichiPlayers`, `getRiichiSticksScoreChangeForTableWrapper`, `getHonbaScoreChangeForTableWrapper`）を削除し、直接Composablesの関数を使用する
  - **コメント整理**: Composablesへの切り出しと並行して実施
    - 不要なコメント（「Composablesから取得済み」など）を削除
    - デバッグ用のconsole.logを削除（782行目、1460-1502行目など）
    - TODOコメントの確認と対応
    - 重複した説明コメントの整理
    - コメントの形式と言語を統一
- **実装方針**:
  - 段階的に実施: まずComposablesへの切り出しを完了させ、その後コメント整理を実施
  - 既存の機能を壊さないように、テストを実行しながら進める
  - 各Composableは単一責任の原則に従い、適切な粒度で分割する
  - ラッパー関数は削除し、テンプレートや他の関数から直接Composablesの関数を呼び出す
- **反映先**: リファクタリングタスクのため設計ドキュメントは不要
- **反映日**: 2026-01-01
- **反映者**: AI
- **優先度**: 中
- **タスク**: `14-tasks.md` (TASK-20260101-011)

### 2026-01-01 RoundManageView.vueのコード整理

### [反映済み] RoundManageView.vueのコード整理

- **元のアイデア**: `12-ideas.md` (2026-01-01 RoundManageView.vueのコード整理)
- **議論内容**:
  - `RoundManageView.vue`が2352行と非常に長く、複数の責務を持っているため、保守性と可読性の向上のために整理が必要
  - 段階的にリファクタリングを進める方針で決定
  - まずComposablesの分離から行うことを決定
- **決定事項**:
  - 以下のComposablesを作成する（粒度を明確化）:
    1. `useRoundManagement` - 局のCRUD操作、編集データ管理、バリデーション
       - 責務: 局の読み込み、作成、更新、削除、次局作成、編集データ（`roundEditData`）とエラー（`roundEditErrors`）の管理、バリデーション関数
       - 状態: `rounds`, `roundEditData`, `roundEditErrors`, `isLoading`, `error`
       - 粒度: 局のライフサイクル管理に特化
    2. `useScoreCalculation` - 点数計算ロジック（純粋関数として実装）
       - 責務: 点数計算、積み棒・本場による点数変動計算、局収支計算、ツモ時の自動計算
       - 状態: なし（純粋関数として実装）
       - 粒度: 計算ロジックのみ、状態管理は含まない
    3. `useRoundActions` - アクション（鳴き・リーチ）の管理
       - 責務: アクションの追加、削除、取得、表示用テキスト生成、リーチ者の取得
       - 状態: `roundActions`（各局のアクション一覧）
       - 粒度: アクション関連の操作に特化
    4. `useResultInput` - 結果入力ダイアログの管理
       - 責務: 結果入力ダイアログの開閉、スコア入力の初期化・管理、バリデーション、確定処理
       - 状態: `showResultDialog`, `currentRoundIdForResultDialog`, `resultDialogData`, `roundScoreInputs`
       - 粒度: 結果入力UIの状態管理と操作に特化
    5. `useRoundDisplay` - 表示用の計算とフォーマット
       - 責務: 局のラベル表示、風の表示、ソート、打点記録の表示、順位の色取得
       - 状態: `sortedRounds`（computed）
       - 粒度: 表示用の計算のみ、状態変更は含まない
    6. `useHanchanData` - 半荘データの管理（新規追加）
       - 責務: 半荘情報の読み込み、統計情報の読み込み、参加者オプションの生成
       - 状態: `hanchan`, `hanchanStatistics`, `isLoadingStatistics`, `playerOptions`（computed）
       - 粒度: 半荘関連のデータ管理に特化
  - 各Composableの依存関係を明確にする:
    - `useRoundManagement` ← `useHanchanData`（参加者情報が必要）
    - `useResultInput` ← `useRoundManagement`, `useRoundActions`（局データとアクション情報が必要）
    - `useRoundDisplay` ← `useRoundManagement`（局データが必要）
    - `useScoreCalculation` ← 依存なし（純粋関数）
  - `frontend/src/composables/`ディレクトリを作成し、各Composableを実装する
  - 既存の機能を壊さないように、段階的にリファクタリングを進める
  - テストコードも必要に応じて更新する
- **実装方針**:
  - 各Composableは独立して実装し、`RoundManageView.vue`から段階的に移行する
  - 型定義（`RoundEditData`、`RoundEditErrors`、`ScoreInput`など）は`types/round.ts`に移動する
  - コンポーネントの分割はComposablesの分離後に実施する
  - 粒度の原則:
    - 1つのComposableは1つの責務に集中する
    - 状態管理とロジックを分離する（`useScoreCalculation`は純粋関数として実装）
    - 再利用可能な単位で分割する（他の画面でも使えるかどうかを考慮）
    - 依存関係を最小限にする（循環依存を避ける）
- **反映先**: 設計ドキュメントは不要（リファクタリングタスク）
- **反映日**: 2026-01-01
- **反映者**: AI
- **優先度**: 中
- **タスク**: `14-tasks.md` (TASK-20260101-010)
- **備考**: コンポーネントの分割、重複コードの削減、関数の整理は後続のタスクとして扱う

### 2026-01-01 局の結果を記録のUIを改善する

### [反映済み] 局の結果を記録のUIを改善する

- **元のアイデア**: `12-ideas.md` (2026-01-01 局の結果を記録のUIを改善する)
- **議論内容**:
  - 現在の実装では、結果入力ダイアログで和了者・放銃者をチェックボックスで選択しているが、テンパイ入力セクションと同様にチップ形式（v-chip-group）に統一することで、UIの一貫性と操作性を向上させる
  - ツモ時: 和了者をチップで選択（1人のみ）、和了者の点数・飜・符を入力すると他家の点数を自動計算
  - ロン時: 和了者をチップで選択（複数選択可、1〜3人：ダブロン・トリロン対応）、放銃者をチップで選択（1人のみ）、点数入力は手動
  - 点数入力はカード形式（v-card）をやめ、シンプルな入力欄に変更する
- **決定事項**:
  - 和了者選択をチップ形式（v-chip-group）に変更
    - ツモ: mandatory、single selection（1人のみ）
    - ロン: multiple selection（1〜3人、ダブロン・トリロン対応）
  - 放銃者選択をチップ形式（v-chip-group）に変更（ロン時のみ）
    - mandatory、single selection（1人のみ）
  - 点数入力セクションを改善
    - v-cardを削除し、シンプルな入力欄に変更
    - ツモ時: 和了者の点数・飜・符を入力すると他家の点数を自動計算（既存機能を維持）
    - ロン時: 各和了者の点数・飜・符を個別に入力
  - バリデーションは既存の実装を維持（ロン時は和了者1〜3人、放銃者1人を許容）
- **実装方針**:
  - フロントエンド
    - `frontend/src/views/RoundManageView.vue`の結果入力ダイアログ（254-382行目）を修正
    - 和了者選択セクションを追加
      - v-chip-groupを使用（テンパイ入力セクションと同様のUIパターン）
      - ツモ: mandatory、single selection（1人のみ）
      - ロン: multiple selection（1〜3人）
    - 放銃者選択セクションを追加（ロン時のみ）
      - v-chip-groupを使用
      - mandatory、single selection（1人のみ）
    - スコア入力セクションを改善
      - v-cardを削除
      - 和了者選択後に点数・飜・符の入力欄を表示
      - ツモ時: 和了者の点数・飜・符を入力すると他家の点数を自動計算（`handleScoreInputChange`関数を維持）
      - ロン時: 各和了者の点数・飜・符を個別に入力
    - 既存のチェックボックス（v-checkbox）による和了者・放銃者選択を削除
    - 既存のv-cardによる点数入力表示を削除
- **反映先**: 
  - `design/screen/round-manage-screen.md` (結果入力ダイアログのUI改善)
- **反映日**: 2026-01-01
- **反映者**: AI
- **優先度**: 中
- **タスク**: `14-tasks.md` (TASK-20260101-009)
- **備考**: 既存のアイデア「スコア入力のユーザー選択をチップにする / ロンの時の複数和了者対応」（2026-01-01）と関連があるが、より広範囲なUI改善として議論・決定した。テンパイ入力セクション（384-414行目）と同様のUIパターンを適用することで、UIの一貫性が向上する。ツモ時の自動計算機能（`handleScoreInputChange`関数、1570-1638行目）は既存の実装を維持する。バリデーション（`validateScoreInputsForRound`関数、1758-1807行目）は既存の実装を維持する。

### 2026-01-01 リーチ記録と本場の点数算出を「局を終了」時に行うように統一したい

### [反映済み] リーチ記録と本場の点数算出を「局を終了」時に行うように統一したい

- **元のアイデア**: `12-ideas.md` (2026-01-01 リーチ記録と本場の点数算出を「局を終了」時に行うように統一したい)
- **議論内容**:
  - 既存の議事録（2026-01-01 リーチ記録と点数変動の記録が連動していない）では、リーチ記録追加時にScoreを作成するリアルタイム更新の方針で決定されているが、リアルタイム更新は不要であることを確認
  - 局終了時にリーチ記録と本場の点数算出を一括で行う方針に統一することで、処理のタイミングを明確にし、ロジックを簡素化できる
  - 本場による点数移動をScoreに明示的に記録するか、`scoreChange`に統合するかについて検討
  - 積み棒による点数移動をScoreに明示的に記録するか、`scoreChange`に統合するかについて検討
- **決定事項**:
  - リアルタイム更新は不要である
  - 局終了時に、リーチ記録と本場の点数算出を一括で行う方針に統一する
  - リーチ記録追加時: Scoreを作成しない（`riichiSticks`の更新のみ）
  - 局終了時: 以下を一括で計算し、`scoreChange`に統合してScoreに記録する
    - リーチ記録による点数変動（-1000点 × リーチ者数）
    - 本場による点数変動（親子の判定と結果タイプに応じて計算）
    - 和了・流局による点数変動
    - 積み棒による点数変動（和了者が獲得）
  - 本場による点数移動は`scoreChange`に統合する
  - 積み棒による点数移動は`scoreChange`に統合する
- **実装方針**:
  - バックエンド
    - `backend/src/services/roundService.ts`の`createRoundAction`関数を修正
      - リーチ記録追加時（`type === RoundActionType.RIICHI`）に、Scoreを作成しない（既存の実装を削除または無効化）
      - `riichiSticks`の更新のみ行う（既存の実装を維持）
    - `backend/src/services/roundService.ts`の`deleteRoundAction`関数を修正
      - リーチ記録削除時に、Scoreを削除しない（既存の実装を削除または無効化）
      - `riichiSticks`の更新のみ行う（既存の実装を維持）
    - `backend/src/services/roundService.ts`の`endRound`関数を修正
      - 局終了時に、リーチ記録による点数変動を計算する
        - `round.riichis`からリーチ者を取得し、各リーチ者に対して-1000点を計算
      - 局終了時に、本場による点数変動を計算する
        - 親子の判定と結果タイプ（ツモ・ロン）に応じて本場による点数変動を計算
        - 親がツモ: 子1人あたり`-round.honba × 300`点
        - 子がツモ: 親から`-round.honba × 300`点、子から`-round.honba × 100`点
        - 親がロン: 放銃者から`-round.honba × 300`点
        - 子がロン（親から）: 放銃者（親）から`-round.honba × 300`点
        - 子がロン（子から）: 放銃者（子）から`-round.honba × 100`点
      - 局終了時に、積み棒による点数変動を計算する
        - 和了時（ツモ・ロン）: 和了者が`round.riichiSticks × 1000`点を獲得
        - 流し満貫時: 流し満貫を達成した参加者が`round.riichiSticks × 1000`点を獲得
        - 流局時: 積み棒による点数変動は0（次局に持ち越される）
      - リーチ記録による点数変動、本場による点数変動、積み棒による点数変動を、和了・流局による点数変動（`data.scores`の`scoreChange`）に加算して統合する
      - 統合された`scoreChange`でScoreを作成する
      - 既存のリーチ記録によるScoreを取得して統合する処理（851-890行目）を削除または修正
  - フロントエンド
    - `frontend/src/views/RoundManageView.vue`の算出ロジックを削除
      - `calculateRiichiSticksScoreChange`関数を削除
      - `calculateScoreChangeWithRiichi`関数を削除
      - `calculateHonbaScoreChange`関数を削除
    - テーブルの表示を修正
      - Scoreから直接値を取得して表示する形に変更
      - `getDisplayScores`関数を修正（リーチ記録があるがScoreが存在しない参加者について仮想的なScoreを作成する処理を削除）
      - 局終了前は打点記録テーブルを表示しない、または空の状態で表示する
- **反映先**: 
  - `design/api/rounds-actions-create.md`, `design/api/rounds-actions-delete.md`, `design/api/rounds-end.md`, `design/screen/round-manage-screen.md`
- **反映日**: 2026-01-01
- **反映者**: AI
- **優先度**: 中
- **タスク**: `14-tasks.md` (TASK-20260101-008)
- **優先度**: 中
- **備考**: 既存の議事録（2026-01-01 リーチ記録と点数変動の記録が連動していない）の実装方針（リーチ記録追加時にScoreを作成）を変更し、局終了時に一括で計算する方針に統一する。これにより、処理のタイミングが明確になり、ロジックが簡素化される。本場と積み棒による点数移動も`scoreChange`に統合するため、Scoreモデルに追加のフィールドは不要である。局終了前は打点記録テーブルを表示しない、または空の状態で表示する。

### 2026-01-01 打点記録としてリーチ者の-1000が記録されるようにしたい

### [反映済み] 打点記録としてリーチ者の-1000が記録されるようにしたい

- **元のアイデア**: `12-ideas.md` (2026-01-01 打点記録としてリーチ者の-1000が記録されるようにしたい)
- **議論内容**:
  - 打点記録として、リーチ者の-1000点が記録されるようにしたいという要望について議論
  - 既存の議事録（2026-01-01 リーチ記録と点数変動の記録が連動していない）で決定された実装方針（リーチ記録追加時にScoreを作成）で問題ないか確認
  - フロントエンドの`calculateRiichiSticksScoreChange`などの算出ロジックを残すか、Scoreから直接取得する形に変更するか検討
  - リーチに関する打点記録のロジックを整理する方法について検討
  - フロントエンドでの算出ロジック全般をなくしたいという要望について検討
- **決定事項**:
  - 既存の議事録の実装方針（リーチ記録追加時にScoreを作成）で問題ない
  - フロントエンドの算出ロジック（`calculateRiichiSticksScoreChange`、`calculateScoreChangeWithRiichi`、`calculateHonbaScoreChange`）を削除し、Scoreから直接取得する形に変更
  - フロントエンドでの算出ロジック全般をなくし、バックエンドで計算してScoreに記録する形にする
  - リーチ記録追加時: リーチ者のScoreを作成（`scoreChange: -1000`）
  - リーチ記録削除時: リーチ者のScoreを削除
  - 局終了時: リーチ記録によるScoreと局終了時のScoreを統合（既存の議事録の方針に従う）
- **実装方針**:
  - バックエンド
    - `backend/src/services/roundService.ts`の`createRoundAction`関数を修正
      - リーチ記録追加時（`type === RoundActionType.RIICHI`）に、リーチ者のScoreを作成する（既存の議事録の方針に従う）
      - `scoreChange: -1000`を記録
    - `backend/src/services/roundService.ts`の`deleteRoundAction`関数を修正
      - リーチ記録削除時に、リーチ者のScoreを削除する（既存の議事録の方針に従う）
    - `backend/src/services/roundService.ts`の`endRound`関数を修正
      - 局終了時に、リーチ記録によるScoreと局終了時のScoreを統合する（既存の議事録の方針に従う）
  - フロントエンド
    - `frontend/src/views/RoundManageView.vue`の算出ロジックを削除
      - `calculateRiichiSticksScoreChange`関数を削除
      - `calculateScoreChangeWithRiichi`関数を削除
      - `calculateHonbaScoreChange`関数を削除
    - テーブルの表示を修正
      - Scoreから直接値を取得して表示する形に変更
      - `getDisplayScores`関数を修正（リーチ記録があるがScoreが存在しない参加者について仮想的なScoreを作成する処理を削除）
    - テーブルのカラム表示を確認
      - 「点数変動」「積み棒」「本場」のカラムについて、Scoreから直接取得する形に変更
      - Scoreモデルに積み棒や本場の点数移動を記録するフィールドが必要な場合は、スキーマを変更する
- **反映先**: 
  - `design/api/rounds-actions-create.md`, `design/api/rounds-actions-delete.md`, `design/api/rounds-end.md`, `design/screen/round-manage-screen.md`
- **反映日**: 2026-01-01
- **反映者**: AI
- **優先度**: 中
- **タスク**: `14-tasks.md` (TASK-20260101-007)
- **備考**: 既存の議事録（2026-01-01 リーチ記録と点数変動の記録が連動していない）の実装方針に従い、リーチ記録追加時にScoreを作成する。フロントエンドでの算出ロジックを削除し、バックエンドで計算してScoreに記録する形にする。テーブルで「積み棒」「本場」を別々に表示するには、Scoreモデルにこれらのフィールドを追加するか、または`scoreChange`に統合してテーブルの表示を変更する必要がある。Scoreモデルの拡張については、実装時に検討する。実装方針はTASK-20260101-008の方針（局終了時に一括で計算）に変更された。

### 2026-01-01 リーチ記録と点数変動の記録が連動していない

### [反映済み] リーチ記録と点数変動の記録が連動していない

- **元のアイデア**: `12-ideas.md` (2026-01-01 リーチ記録と点数変動の記録が連動していない)
- **議論内容**:
  - リーチ記録を追加/削除したときに、点数変動の表示（打点記録テーブル）と点数変動の記録（データベースへの保存）がリアルタイムで更新されていない問題について議論
  - 現在の実装では、リーチ記録を追加/削除すると`riichiSticks`は更新されるが、点数変動の計算（`calculateRiichiSticksScoreChange`関数）で使用されるリーチ記録（`round.riichis`）と点数変動の表示（`roundScores`）が連動していない
  - 特に、局が終了していない状態でリーチ記録を追加/削除した場合、点数変動の表示が更新されない
  - リーチ宣言時は-1000点の支払いが発生するため、リーチ記録の追加/削除に応じて点数変動の表示と記録の両方を自動的に更新されるべきである
  - 実装方法について検討: 選択肢A（リーチ記録追加/削除API内でScoreを作成/更新）を採用
  - 局終了時の処理について検討: 局終了時にリーチ記録によるScoreと局終了時のScoreを統合する必要がある（打点記録にリーチの点数が出ないことを問題視している）
  - リーチ記録削除時の処理について検討: Scoreを削除する方針で決定
- **決定事項**:
  - 実装方法: 選択肢A（リーチ記録追加/削除API内でScoreを作成/更新）を採用
    - バックエンドの`createRoundAction`関数（`roundService.ts`）内で、リーチ記録追加時にScoreを作成する
    - バックエンドの`deleteRoundAction`関数（`roundService.ts`）内で、リーチ記録削除時にScoreを削除する
  - リーチ記録追加時: リーチ者のScoreを作成（`scoreChange: -1000`）
    - 局が終了していない状態でもScoreを作成する
    - Scoreの`isDealer`、`isWinner`、`isRonTarget`、`isTenpai`、`han`、`fu`、`yaku`は`null`または適切なデフォルト値を設定
  - リーチ記録削除時: リーチ者のScoreを削除
    - リーチ記録追加時に作成したScoreを削除する
  - 局終了時の処理: リーチ記録によるScoreと局終了時のScoreを統合する
    - 局終了時（`endRound`）に、既存のリーチ記録によるScoreを取得し、局終了時のScoreと統合する
    - リーチ記録によるScoreの`scoreChange`（-1000点）を局終了時のScoreの`scoreChange`に加算する
    - リーチ記録によるScoreを削除し、統合されたScoreを保存する
  - 点数変動の表示の更新: Vueのリアクティビティを活用し、`round.riichis`の変更に応じて`calculateRiichiSticksScoreChange`を再計算する
    - `roundScores`をリアクティブに更新する
- **実装方針**:
  - バックエンド
    - `backend/src/services/roundService.ts`の`createRoundAction`関数を修正
      - リーチ記録追加時（`type === RoundActionType.RIICHI`）に、リーチ者のScoreを作成する
        - `roundId`: 局ID
        - `playerId`: リーチ者のID
        - `scoreChange`: -1000
        - `isDealer`: リーチ者が親かどうか（`round.dealerPlayerId`と比較）
        - `isWinner`: `false`（局終了時に更新される）
        - `isRonTarget`: `null`
        - `isTenpai`: `null`（局終了時に更新される）
        - `han`: `null`
        - `fu`: `null`
        - `yaku`: `[]`
      - トランザクション内でリーチ記録とScoreを作成する
    - `backend/src/services/roundService.ts`の`deleteRoundAction`関数を修正
      - リーチ記録削除時（`type === RoundActionType.RIICHI`）に、リーチ者のScoreを削除する
        - リーチ記録追加時に作成したScoreを削除する（`roundId`と`playerId`で特定）
      - トランザクション内でリーチ記録とScoreを削除する
    - `backend/src/services/roundService.ts`の`endRound`関数を修正
      - 局終了時に、既存のリーチ記録によるScoreを取得する
      - リーチ記録によるScoreの`scoreChange`（-1000点）を局終了時のScoreの`scoreChange`に加算する
      - リーチ記録によるScoreを削除し、統合されたScoreを保存する
      - トランザクション内で処理する
  - フロントエンド
    - `frontend/src/views/RoundManageView.vue`の`calculateRiichiSticksScoreChange`関数を確認
      - Vueのリアクティビティを活用し、`round.riichis`の変更に応じて自動的に再計算されることを確認
    - `frontend/src/views/RoundManageView.vue`の`roundScores`をリアクティブに更新する
      - リーチ記録追加/削除時に`loadRoundData`を呼び出して、Scoreを再読み込みする
  - テスト
    - `backend/tests/integration/rounds.test.ts`にテストケースを追加
      - リーチ記録追加時にScoreが作成されることを確認
      - リーチ記録削除時にScoreが削除されることを確認
      - 局終了時にリーチ記録によるScoreと局終了時のScoreが統合されることを確認
- **反映先**: 
  - `design/api/rounds-riichi-score-linkage.md`
- **反映日**: 2026-01-01
- **反映者**: AI
- **優先度**: 中
- **タスク**: `14-tasks.md` (TASK-20260101-006)
- **備考**: リーチ記録を追加/削除したときに、点数変動の表示と記録の両方を自動的に更新することで、ユーザーがリアルタイムで点数変動を確認できるようになる。また、局終了時にリーチ記録によるScoreと局終了時のScoreを統合することで、打点記録にリーチの点数が正しく反映されるようになる。実装方針はTASK-20260101-008の方針（局終了時に一括で計算）に変更された。

### 2026-01-01 本場の計算ロジックを見直す

### [反映済み] 本場の計算ロジックを見直す

- **元のアイデア**: `12-ideas.md` (2026-01-01 本場の計算ロジックを見直す)
- **議論内容**:
  - 親が上がった場合と親がテンパイしたまま流局した場合の次の局の本場と局のロジックが共通になるべきという問題について議論
  - 現在の実装では、`calculateNextHonba`関数と`calculateIsRenchan`関数で、親が和了した場合と流局で親がテンパイした場合で同じ処理（本場+1、連荘判定）を別々のif文で記述している
  - 特殊流局で親がテンパイした場合の扱いについて確認
    - 現在の実装では、`calculateIsRenchan`では特殊流局で親がテンパイした場合に連荘になるが、`calculateNextHonba`では特殊流局の場合に本場を変更しない不整合がある
- **決定事項**:
  - 親が連荘する条件を判定する共通関数を作成する（他のサービスでも使用可能にする）
  - 関数名: `isDealerRenchan`（exportして他のサービスからも使用可能にする）
  - 特殊流局で親がテンパイした場合も連荘になり、本場も増える（現在の不整合を修正）
  - `calculateNextHonba`関数を修正
    - 特殊流局で親がテンパイした場合も本場を+1する
    - 共通関数を使用してロジックを簡潔化
  - `calculateIsRenchan`関数を修正
    - 共通関数を使用してロジックを簡潔化
- **実装方針**:
  - バックエンド
    - `backend/src/services/riichiHonbaCalculationService.ts`を修正
      - 共通関数`isDealerRenchan`を作成（export）
        - 親が和了した場合、または流局（通常の流局・特殊流局）で親がテンパイした場合に`true`を返す
      - `calculateNextHonba`関数を修正
        - 共通関数`isDealerRenchan`を使用して連荘判定を行う
        - 連荘の場合: `currentHonba + 1`
        - 子が和了した場合、または流し満貫の場合: `0`
        - 流局で親がノーテンの場合: `currentHonba`（変更なし）
        - 特殊流局で親がテンパイした場合も本場を+1する（不整合を修正）
      - `calculateIsRenchan`関数を修正
        - 共通関数`isDealerRenchan`を使用してロジックを簡潔化
    - 既存のテストを確認・修正
      - `backend/tests/unit/riichiHonbaCalculationService.test.ts`を確認
      - 特殊流局で親がテンパイした場合のテストケースを追加・修正
  - 他のサービスでも共通関数を使用可能にする
    - `isDealerRenchan`関数をexportすることで、他のサービス（`roundService.ts`、`roundController.ts`など）からも使用可能にする
- **反映先**: 
  - `design/riichi-honba-calculation-logic.md`
- **反映日**: 2026-01-01
- **反映者**: AI
- **優先度**: 中
- **タスク**: `14-tasks.md` (TASK-20260101-005)
- **備考**: 親が和了した場合と流局で親がテンパイした場合（通常の流局・特殊流局）は、どちらも連荘となり本場が+1される。この2つのケースで同じロジックを使用することで、コードの重複を減らし、保守性を向上させる。また、特殊流局で親がテンパイした場合の不整合も修正する。

### 2026-01-01 局開始時に連荘する（本場が加算される）ロジックを整理する

### [反映済み] 局開始時に連荘する（本場が加算される）ロジックを整理する

- **元のアイデア**: `12-ideas.md` (2026-01-01 局開始時に連荘する（本場が加算される）ロジックを整理する)
- **議論内容**:
  - 局開始時の連荘判定と本場設定のロジックが複数の場所に散らばっている問題について議論
  - 現在の実装では、局作成時に`honba`と`isRenchan`をフロントエンドから受け取ってそのまま設定している
  - 局終了時（`endRound`）で連荘を計算して`isRenchan`を更新しているが、次局作成時に前局の結果から判定していない
  - `isRenchan`フィールドが不要かどうかを検討
- **決定事項**:
  - 局開始時の連荘判定と本場設定をバックエンド（局作成時）で自動計算する
  - 局作成時に前局を取得して、前局の結果から連荘を判定する
  - `isRenchan`フィールドを削除する（不要なロジックを削除）
    - データベーススキーマから`isRenchan`フィールドを削除
    - 型定義から`isRenchan`を削除
    - APIレスポンスから`isRenchan`を削除
    - フロントエンドでの`isRenchan`の送信を削除
  - 局更新の概念は存在しない想定（考慮不要）
  - 前局の取得方法:
    - 同じ`hanchanId`で、`roundNumber`が1つ前の局を取得
    - 連荘の場合は、同じ`roundNumber`で`honba`が1つ前の局を取得
  - 連荘判定ロジック:
    - 前局の`resultType`、`scores`から連荘を判定
    - `calculateIsRenchan`関数を使用（ただし、局作成時に前局から判定する形に変更）
  - 本場設定ロジック:
    - 前局の結果から連荘を判定
    - 連荘の場合: 前局の本場+1
    - 連荘でない場合: 前局の結果に応じて0または維持（`calculateNextHonba`関数を使用）
- **実装方針**:
  - バックエンド
    - `roundService.create`関数を修正
      - 局作成時に前局を取得（同じ`hanchanId`で、`roundNumber`が1つ前、または連荘の場合は同じ`roundNumber`で`honba`が1つ前）
      - 前局が存在する場合、前局の結果から連荘を判定
        - 前局の`scores`から`isDealerWinner`を取得
        - 前局の`scores`から`isDealerTenpai`を取得
        - `calculateIsRenchan`関数を使用して連荘を判定
      - 連荘に応じて本場を設定
        - `calculateNextHonba`関数を使用して次局の本場を計算
      - 前局が存在しない場合（1局目など）は、デフォルト値（本場0）を使用
    - `roundService.endRound`関数を修正
      - `isRenchan`の更新処理を削除
    - `roundController.calculateNextSettings`関数を修正
      - レスポンスから`isRenchan`を削除（ただし、次局の設定計算自体は必要）
    - データベースマイグレーション
      - `Round`モデルから`isRenchan`フィールドを削除
    - 型定義の修正
      - `backend/src/types/round.ts`から`isRenchan`を削除
      - `backend/src/types/hanchan.ts`から`isRenchan`を削除
  - フロントエンド
    - `RoundManageView.vue`を修正
      - 局作成時の`isRenchan`の送信を削除
      - `isRenchan`の参照を削除
    - 型定義の修正
      - `frontend/src/types/round.ts`から`isRenchan`を削除
      - `frontend/src/types/hanchan.ts`から`isRenchan`を削除
  - 削除すべきロジック
    - `roundService.endRound`での`isRenchan`の更新処理
    - `calculateNextRoundSettings`から`isRenchan`を返す処理（ただし、次局の設定計算自体は必要）
    - フロントエンドでの`isRenchan`の送信
    - データベーススキーマの`isRenchan`フィールド
- **反映先**: 
  - `backend/src/services/roundService.ts` (局作成時の連荘判定と本場設定)
  - `backend/src/services/riichiHonbaCalculationService.ts` (必要に応じて修正)
  - `backend/src/controllers/roundController.ts` (APIレスポンスから`isRenchan`を削除)
  - `backend/prisma/schema.prisma` (データベーススキーマから`isRenchan`を削除)
  - `backend/src/types/round.ts` (型定義から`isRenchan`を削除)
  - `backend/src/types/hanchan.ts` (型定義から`isRenchan`を削除)
  - `frontend/src/views/RoundManageView.vue` (フロントエンドでの`isRenchan`の送信を削除)
  - `frontend/src/types/round.ts` (型定義から`isRenchan`を削除)
  - `frontend/src/types/hanchan.ts` (型定義から`isRenchan`を削除)
  - `design/riichi-honba-calculation-logic.md` (設計ドキュメントを更新)
- **反映日**: 2026-01-01
- **反映者**: AI
- **優先度**: 中
- **タスク**: `14-tasks.md` (TASK-20260101-004)

---

### 2026-01-01 打点記録の表にハンとフを出すのをやめ、積み棒と本場の点数移動を載せる

### [反映済み] 打点記録の表にハンとフを出すのをやめ、積み棒と本場の点数移動を載せる

- **元のアイデア**: `12-ideas.md` (2026-01-01 打点記録の表にハンとフを出すのをやめ、積み棒と本場の点数移動を載せる)
- **議論内容**:
  - 打点記録の表の表示内容変更について議論
  - 現在の実装では「飜」「符」のカラムが表示されているが、これを「積み棒」「本場」の点数移動に変更
  - ダブロン時のルールを確認: ダブロン時は「放銃者から見て最も近い上家」だけが積み棒と本場の点数を受け取る
  - 上家の計算方法: `seatPosition`を使用（0=東、1=南、2=西、3=北）、上家の`seatPosition = (放銃者のseatPosition + 3) % 4`
  - 現在の実装では`calculateScore`関数が`winnerPlayerId`を1人として扱っているため、ダブロン対応は別タスクとして扱う
- **決定事項**:
  - 表示内容の変更
    - 「飜」「符」のカラムを削除
    - 「積み棒」「本場」の点数移動カラムを追加
  - 計算方法
    - 表示時に計算（`round`オブジェクトから`honba`と`riichiSticks`を取得）
    - 各参加者の情報（`isWinner`、`isDealer`、`isRonTarget`など）を使用
  - 積み棒の点数移動
    - 通常: 和了者が獲得（`isWinner === true`の場合、`round.riichiSticks × 1000`点）
    - ダブロン: 放銃者から見て最も近い上家のみが獲得（実装は別タスク）
  - 本場の点数移動
    - 親がツモ: 子は`-round.honba × 300`点
    - 子がツモ: 親は`-round.honba × 300`点、子は`-round.honba × 100`点
    - 親がロン: 放銃者は`-round.honba × 300`点
    - 子がロン（親から）: 放銃者（親）は`-round.honba × 300`点
    - 子がロン（子から）: 放銃者（子）は`-round.honba × 100`点
    - ダブロン: 放銃者から見て最も近い上家のみが本場の点数を受け取る（実装は別タスク）
  - 流局時の表示: 流局時は積み棒・本場の点数移動が0、表示は「-」または「0」
  - 流し満貫時の表示: 流し満貫時も積み棒・本場の点数移動を表示（流し満貫時は積み棒を獲得する可能性があるため）
- **実装方針**:
  - フロントエンド
    - `RoundManageView.vue`の`scoreHeaders`（641-647行目）から「飜」「符」を削除
    - 「積み棒」「本場」のカラムを追加
    - 計算用の関数を作成（積み棒・本場の点数移動を計算）
      - `calculateRiichiSticksScoreChange`: 積み棒の点数移動を計算
      - `calculateHonbaScoreChange`: 本場の点数移動を計算
    - ダブロン対応は別タスクとして扱う（現時点では通常のロンのみ対応）
  - 計算ロジック
    - `round`オブジェクトから`honba`と`riichiSticks`を取得
    - 各参加者の`isWinner`、`isDealer`、`isRonTarget`などの情報を使用
    - 結果タイプ（`resultType`）に応じて計算方法を分岐
- **反映先**: 
  - `design/screen/round-manage-screen.md` (打点記録の表の表示内容)
  - `frontend/src/views/RoundManageView.vue` (実装)
- **反映日**: 2026-01-01
- **反映者**: AI
- **優先度**: 中

---

## 記録例

### [反映済み] 週次レポートの自動生成機能

- **元のアイデア**: `12-ideas.md` (2024-01-20 学習レポート機能)
- **議論内容**:
  - 週次レポートの自動生成機能について議論
  - メール送信機能の実装方法を検討
  - 優先度を「中」と決定
- **決定事項**:
  - バックエンド API でレポート生成機能を実装
  - メール送信は将来的な拡張として検討
- **実装方針**:
  - RESTful API エンドポイント `/api/reports/weekly` を追加
  - レポートデータは JSON 形式で返却
- **反映先**: `01-project-overview.md` (将来の拡張要件セクション)
- **反映日**: 2024-01-26
- **反映者**: AI
- **優先度**: 中

---

## 議事録一覧

### [反映済み] 半荘情報にダッシュボード機能を設けたい

- **元のアイデア**: `12-ideas.md` (2026-01-01 半荘情報にダッシュボード機能を設けたい)
- **議論内容**:
  - 半荘情報にダッシュボード機能を設け、半荘の進行状況や各参加者のパフォーマンスを一目で把握できるようにする
  - 既存の統計情報API（`GET /api/hanchans/:id/statistics`）を活用する
  - 表示する情報を整理し、以下の6項目に決定:
    1. 現在の持ち点（今回追加）
    2. 順位（現在の持ち点順）
    3. 和了回数（ツモ/ロン別）
    4. 放銃回数
    5. 流局回数
  - 現在の持ち点の計算方法: `初期得点(initialScore) + これまでの局での得点変動の合計(SUM(scoreChange))`
- **決定事項**:
  - ダッシュボード機能を`RoundManageView.vue`に追加する
  - `statisticsService.ts`の`getHanchanStatistics`関数を拡張して、現在の持ち点と順位を計算する
  - 表示する情報は以下の6項目:
    1. 現在の持ち点（各参加者の初期得点 + これまでの得点変動の合計）
    2. 順位（現在の持ち点順）
    3. 和了回数（ツモ/ロン別）
    4. 放銃回数
    5. 流局回数
  - 既存の統計情報（和了回数、放銃回数、流局回数）は既に取得可能
- **実装方針**:
  - バックエンド:
    - `statisticsService.ts`の`getHanchanStatistics`関数を拡張
    - 各参加者について、その半荘の全局で`scoreChange`を合計して現在の持ち点を計算
    - 現在の持ち点順に順位を計算（半荘が完了していない場合でも）
    - レスポンスに`currentScore`と`currentRank`フィールドを追加
  - フロントエンド:
    - `RoundManageView.vue`にダッシュボードセクションを追加
    - 統計情報APIを呼び出してデータを取得
    - 参加者ごとの情報をカード形式またはテーブル形式で表示
    - 現在の持ち点、順位、和了回数（ツモ/ロン別）、放銃回数、流局回数を表示
- **反映先**: 
  - `design/api/hanchans-statistics.md` (半荘統計取得API)
  - `design/screen/round-manage-screen.md` (局管理画面)
  - `14-tasks.md` (TASK-20260101-002)
- **反映日**: 2026-01-01
- **反映者**: AI
- **優先度**: 中

### [反映済み] 東4局の次が南5局になってしまう不具合に対応したい

- **元のアイデア**: `12-ideas.md` (2026-01-01 東4局の次が南5局になってしまう不具合に対応したい)
- **議論内容**:
  - 麻雀のルールに基づいて正しい表示方法を確認
  - 局番号と風の関係を整理（局番号1-4: 東、5-8: 南、9-12: 西、13-16: 北）
  - 問題の原因を特定: `getRoundLabel`関数が局番号をそのまま表示している
  - 局番号5で風が「南」の場合、「南5局」と表示されてしまうが、正しくは「南1局」であるべき
- **決定事項**:
  - 局番号から風内での局番号を計算する必要がある
  - 計算式: 風内局番号 = ((局番号 - 1) % 4) + 1
  - `getRoundLabel`関数を修正して、風内局番号を表示するようにする
- **実装方針**:
  - `getRoundLabel`関数内で局番号から風内局番号を計算する関数を追加
  - 計算式: `((roundNumber - 1) % 4) + 1` を使用
  - 例: 局番号5 → 風内局番号1 → 「南1局」、局番号6 → 風内局番号2 → 「南2局」
  - `getRoundLabel`関数を使用しているすべての箇所で正しく表示されることを確認
- **反映先**: 
  - `design/screen/round-manage-screen.md` (実装メモセクション: 局のラベル表示の修正)
  - `frontend/src/views/RoundManageView.vue` (実装)
  - `14-tasks.md` (TASK-20260101-001)
- **反映日**: 2026-01-01
- **反映者**: AI
- **優先度**: 高

### [反映済み] 連荘のチェックボックスの削除

- **元のアイデア**: `12-ideas.md` (2025-12-31 連荘のチェックボックスの削除)
- **議論内容**:
  - `RoundManageView.vue`の90-94行目にある連荘のチェックボックスが不要かどうかについて議論
  - 連荘の判定ロジックは`riichiHonbaCalculationService.ts`の`calculateIsRenchan`関数で実装されており、局終了時の結果から自動的に判定できることを確認
  - 連荘の判定条件:
    - 親が和了した場合 → 連荘
    - テンパイ流局時に親がテンパイしていた場合 → 連荘
  - `calculateNextSettings` APIで連荘が自動計算されていることを確認
  - 局開始時に連荘を手動で変更する必要があるか確認 → 不要
  - 前局の結果から自動計算された連荘を、局開始時に上書きする必要があるか確認 → 不要
- **決定事項**:
  - 連荘のチェックボックスを削除する
  - 連荘は`calculateNextSettings` APIの結果から自動計算された値を使用する
  - 局開始時に連荘を手動で設定する必要はない
  - 連荘の値は表示のみ（編集不可）とする
- **実装方針**:
  - フロントエンド:
    - `RoundManageView.vue`の90-94行目の連荘チェックボックス（`v-checkbox`）を削除
    - `roundEditData`の型定義から`isRenchan`を削除（または読み取り専用として保持）
    - 局作成・更新時に`isRenchan`を送信する処理を確認し、必要に応じて修正
    - `calculateNextSettings` APIの結果から連荘を取得し、表示のみとする
- **反映先**: 
  - `design/screen/round-manage-screen.md` (局編集画面セクション)
  - `14-tasks.md` (TASK-20251231-016)
- **反映日**: 2025-12-31
- **反映者**: AI
- **優先度**: 中

### [反映済み] 局の結果記録の入力欄をよりコンパクトにしたい

- **元のアイデア**: `12-ideas.md` (2025-12-31 局の結果記録の入力欄をよりコンパクトにしたい)
- **議論内容**:
  - 局の結果記録の入力欄をよりコンパクトにする方法について議論
  - 現在の実装では、各参加者ごとに`v-card`を作成し、`v-row/v-col`で2列表示（`md="6"`）しており、カードが大きく画面を占有している
  - 点数のデフォルト値が`null`で初期化されており、初期状態が不明確
  - 自摸上がりの場合、上がった人の点数を入力しても、他の3人の点数が自動計算されていない
  - `scoreCalculationService.ts`の`calculateScore`関数を使用して自動計算できることを確認
- **決定事項**:
  - 入力欄のコンパクト化: カード形式を維持しつつ、サイズを縮小する（`v-card`の`variant="outlined"`、パディング削減など）
  - 点数のデフォルト値を0にする: `scoreChange: null` → `scoreChange: 0`に変更
  - 自摸上がりの自動入力: 和了者の点数入力時と飜・符入力時の両方で計算する
  - 自動計算した点数は、ユーザーが手動で変更可能にする
- **実装方針**:
  - フロントエンド:
    - `RoundManageView.vue`の結果入力ダイアログ（257-445行目）を修正
    - スコア入力セクション（318-383行目）の`v-card`をコンパクト化（`variant="outlined"`、パディング削減）
    - `openResultDialog`関数（1282-1321行目）で`scoreChange: null` → `scoreChange: 0`に変更
    - `initializeScoreInputsForRound`関数（875-896行目）で`scoreChange: null` → `scoreChange: 0`に変更
    - 自摸上がりの自動計算機能を追加:
      - `handleDialogWinnerChange`関数（1335-1347行目）を拡張
      - 和了者の点数入力時（`v-text-field`の`@input`イベント）に自動計算
      - 飜・符入力時（`v-text-field`の`@input`イベント）に自動計算
      - `calculateScore`関数を使用して点数を計算（`scoreCalculationService.ts`をフロントエンドで使用可能にするか、バックエンドAPIを呼び出す）
      - 計算条件: 和了者の点数、飜、符、親子判定、本場、積み棒
      - 計算結果を他の3人の`scoreChange`に自動入力（手動変更可能）
- **反映先**: 
  - `design/screen/round-manage-screen.md` (局終了処理セクション)
  - `14-tasks.md` (TASK-20251231-015)
- **反映日**: 2025-12-31
- **反映者**: AI
- **優先度**: 中

### [反映済み] 次局へボタンを押したときに局が追加されない不具合を修正したい

- **元のアイデア**: `12-ideas.md` (2025-12-31 次局へボタンを押したときに局が追加されない不具合を修正したい)
- **議論内容**:
  - 「次局へ」ボタンを押したときに局が追加されない不具合について議論
  - 現在の実装では、`handleNextRoundFromPanel`関数で次局オブジェクトをローカルで作成して`rounds.value.push(nextRound)`で追加しているが、`createRound` APIを呼び出していない
  - そのため、次局がフロントエンド側のローカル状態にのみ存在し、データベースには保存されていない
  - ページをリロードすると次局が消えてしまう問題が発生している
  - `handleAddAction`関数内で局を作成している処理（1196-1217行目）を参考に修正する方針で合意
- **決定事項**:
  - `handleNextRoundFromPanel`関数で、次局オブジェクトをローカルで作成する代わりに、`createRound` APIを呼び出すように修正する
  - `calculateNextSettings` APIで計算した次局の設定（局番号、風、本場、積み棒、連荘）と次局の親情報を使用して`CreateRoundRequest`を作成する
  - APIの結果を受け取って、`rounds.value`に追加する
  - エラーハンドリングを追加する
- **実装方針**:
  - フロントエンド:
    - `RoundManageView.vue`の`handleNextRoundFromPanel`関数（1558-1589行目）を修正
    - 次局オブジェクトをローカルで作成する処理（1559-1581行目）を削除
    - `CreateRoundRequest`を作成し、`createRound` APIを呼び出す処理を追加
    - `handleAddAction`関数（1196-1217行目）のパターンを参考に実装
    - APIの結果を受け取って、`rounds.value.push(createResult.data)`で追加
    - エラーハンドリングを追加（`"error" in createResult`の場合にエラーメッセージを表示）
- **反映先**: 
  - `design/api/rounds-create.md` (局作成API仕様)
  - `frontend/src/views/RoundManageView.vue` (次局作成処理)
- **優先度**: 高

### [反映済み] ラウンドの開始という概念とIN_PROGRESSのバリデーション両方がいらない

- **元のアイデア**: `12-ideas.md` (2025-12-31 ラウンドの開始という概念とIN_PROGRESSのバリデーション両方がいらない)
- **議論内容**:
  - ラウンドの開始という概念とIN_PROGRESSのバリデーションの必要性について議論
  - 現在の実装では、ラウンドにアクション（鳴き、リーチなど）を追加する際に、ラウンドが開始されている（`startedAt`が設定されている）必要がある
  - ラウンド作成後すぐにアクションを追加できるようにすべきとの意見
  - `startedAt`フィールドは記録用として残すことを決定
  - `endedAt`のチェックも不要であることを確認
- **決定事項**:
  - ラウンドの開始という概念を削除する
  - IN_PROGRESSのバリデーション（`!round.startedAt || round.endedAt`）を削除する
  - `startedAt`フィールドは記録用として残す（削除しない）
  - `endedAt`のチェックも削除する（バリデーションから削除）
  - ラウンドが作成された時点で、すぐにアクションを追加できるようにする
- **実装方針**:
  - バックエンド:
    - `roundService.ts`の`createRoundAction`関数から`!round.startedAt || round.endedAt`のチェックを削除
    - `roundController.ts`のエラーハンドリングから「Round must be IN_PROGRESS to add action」のメッセージを削除
  - フロントエンド:
    - `RoundManageView.vue`の`handleAddNaki`、`handleAddAction`、`handleAddRiichi`関数から、アクション追加前のラウンド開始処理を削除
  - データモデル:
    - `startedAt`フィールドは残す（記録用）
- **反映先**: 
  - `design/mahjong-data-model.md` (Roundモデルセクション)
  - `design/api/rounds-actions-create.md` (バリデーション要件)
  - `design/api/rounds-nakis-create.md` (バリデーション要件)
  - `design/api/rounds-riichis-create.md` (バリデーション要件)
  - `14-tasks.md` (TASK-20251231-013)
- **反映日**: 2025-12-31
- **反映者**: AI
- **優先度**: 中

### [反映済み] 鳴きの記録とリーチ記録を分ける必要があるか

- **元のアイデア**: `12-ideas.md` (2025-12-31 鳴きの記録とリーチ記録を分ける必要があるか)
- **議論内容**:
  - 現在、鳴きの記録とリーチ記録を別々に管理しているが、これらを分ける必要があるか検討
  - 麻雀のルール上、鳴きとリーチは互いに排他的であることを確認（鳴いた状態でリーチすること、リーチしてから鳴くことは不可能）
  - データの側面より麻雀の特性上、同じにすべきであるとの意見
  - ダブルリーチと一発の記録は不要であることを確認
- **決定事項**:
  - 鳴きとリーチを統合する方向で決定
  - データモデル、API、UIを統合する
  - 新しいテーブル（例: `RoundAction`）に統合し、`type`フィールドで「鳴き」か「リーチ」かを区別
  - リーチ関連のフィールドから`isDoubleRiichi`と`isIppatsu`を削除（不要なため）
- **実装方針**:
  - データモデル統合:
    - `Naki`と`Riichi`を1つのテーブル（例: `RoundAction`）に統合
    - `type`フィールドで`NAKI`か`RIICHI`かを区別
    - 鳴き関連フィールド（`nakiType`, `targetPlayerId`, `tiles`）とリーチ関連フィールド（`declaredAt`）をnullableで持つ
    - バリデーションで、同じ参加者が同じ局で鳴きとリーチを同時に持たないことを保証
  - API統合:
    - エンドポイントを統合（例: `POST /api/rounds/:id/actions`）
    - リクエストボディで`type`を指定して、鳴きかリーチかを区別
  - UI統合:
    - 1つのカードで「鳴き・リーチ記録」として表示
    - 追加ダイアログも統合（`type`で切り替え）
  - マイグレーション:
    - 既存の`Naki`と`Riichi`データを新しいテーブルに移行
    - 既存のAPIを段階的に非推奨化
- **反映先**: 
  - `design/mahjong-data-model.md` (データモデル設計)
  - `design/api/rounds-actions-create.md` (API仕様、新規作成)
  - `design/screen/round-manage-screen.md` (UI設計)
  - `14-tasks.md` (TASK-20251231-012)
- **反映日**: 2025-12-31
- **反映者**: AI
- **優先度**: 中

### [反映済み] 鳴きを追加で鳴きの種類や参加者などをボタンで選択できるようにします

- **元のアイデア**: `12-ideas.md` (2025-12-31 鳴きを追加で鳴きの種類や参加者などをボタンで選択できるようにします)
- **議論内容**:
  - 鳴き追加ダイアログで、鳴きの種類や参加者などをボタン形式で選択できるようにする方針について議論
  - 参加者選択のコンポーネントを切り出す方針に決定
  - ボタン形式のコンポーネントを作成し、それを各箇所に適用する方針で合意
  - ボタンのスタイルは`v-chip`を使用することに決定
  - レイアウトはグリッド形式で問題ないことを確認
  - マルチセレクトのプロパティも追加することに決定
- **決定事項**:
  - `PlayerSelectButton.vue`コンポーネントを作成する
  - `v-chip`を使用したボタン形式の選択UIを実装する
  - グリッドレイアウトで表示する
  - 単一選択と複数選択の両方に対応する（`multiple`プロパティを追加）
  - 参加者選択だけでなく、鳴きタイプ選択にも適用する
- **実装方針**:
  - `frontend/src/components/PlayerSelectButton.vue`を作成
  - プロップス: `items`（選択肢リスト）、`modelValue`、`label`、`disabled`、`required`、`multiple`（複数選択対応）
  - イベント: `update:modelValue`
  - `v-chip-group`を使用してグリッドレイアウトで表示
  - 選択状態の視覚的フィードバック（色変更など）を実装
  - 適用箇所:
    - 鳴き追加ダイアログ: 参加者選択、対象参加者選択、鳴きタイプ選択
    - リーチ追加ダイアログ: 参加者選択
    - 親選択: 参加者選択
    - 半荘作成画面: 参加者選択（4人分）
- **反映先**: 
  - `design/components/player-select-button.md` (コンポーネント設計)
  - `design/screen/round-manage-screen.md` (画面設計)
  - `design/screen/hanchan-form-screen.md` (画面設計)
  - `14-tasks.md` (TASK-20251231-011)
- **反映日**: 2025-12-31
- **反映者**: AI
- **優先度**: 中

### [反映済み] 半荘作成時に東1局0本場の局を作成するようにします

- **元のアイデア**: `12-ideas.md` (2025-12-31 半荘作成時に東1局0本場の局を作成するようにします)
- **議論内容**:
  - 半荘作成時に自動的に東1局0本場の局を作成する機能について議論
  - 現在の実装では、半荘作成後に手動で局を作成する必要があることを確認
  - 半荘作成と局作成を同一トランザクションで実行する方針で決定
  - 親の設定は`seatPosition = 0`の参加者を自動設定する方針で決定
  - フロントエンドの画面遷移は現状（局一覧画面）のままで問題ないことを確認
- **決定事項**:
  - 半荘作成API（`POST /api/hanchans`）で半荘を作成する際に、自動的に東1局0本場の局を作成する処理を追加
  - 半荘作成と局作成を同一トランザクションで実行する（Prismaのトランザクション機能を使用）
  - 局の初期値:
    - 局番号: 1
    - 風: 東（`EAST`）
    - 本場: 0
    - 積み棒: 0
    - 親: `seatPosition = 0`の参加者の`playerId`を自動設定
    - 連荘: `false`
  - エラーハンドリング:
    - `seatPosition = 0`の参加者が見つからない場合、エラーを返す
    - 局作成失敗時は、半荘作成もロールバックする
- **実装方針**:
  - バックエンド:
    - `backend/src/services/hanchanService.ts`の`create`メソッドを修正
    - Prismaのトランザクション機能（`prisma.$transaction`）を使用して、半荘作成と局作成を同一トランザクションで実行
    - 半荘作成後、`hanchanPlayers`から`seatPosition = 0`の参加者を取得
    - 取得した参加者の`playerId`を`dealerPlayerId`として、局を作成
    - 局作成には`roundService.create`のロジックを参考にするが、トランザクション内で直接`prisma.round.create`を実行する
  - フロントエンド:
    - 変更不要（半荘作成後の画面遷移は現状のままで問題ない）
- **反映先**: 
  - `backend/src/services/hanchanService.ts` (半荘作成処理)
  - `design/api/hanchans-create.md` (API仕様の更新)
- **反映日**: 2025-12-31
- **反映者**: AI
- **優先度**: 中

### [反映済み] 半荘開始時に親が誰から始まるか記録できるようにしたい

- **元のアイデア**: `12-ideas.md` (2025-12-31 半荘開始時に親が誰から始まるか記録できるようにしたい)
- **議論内容**:
  - 半荘開始時に親が誰から始まるかを記録できるようにする機能について議論
  - 現在の実装では、局開始時に親を手動で選択する必要があることを確認
  - 席順（`seatPosition`）と最初の親の関係について検討
  - 各局の親を自動計算する方法について検討
  - 参加者入力方法の改善案（「東南西北の順で入力」）について議論
- **決定事項**:
  - 半荘作成時の参加者入力方法を「東」「南」「西」「北」の順で選択するUIに変更
  - 東の席（`seatPosition = 0`）の参加者が最初の親になる
  - 席順（`seatPosition`）: 0=東、1=南、2=西、3=北
  - 最初の親: 東の席（`seatPosition = 0`）の参加者
  - 各局の親の自動計算:
    - 1局目: 東の席（`seatPosition = 0`）の参加者
    - 連荘時: 同じ人が親を継続
    - 連荘でない場合: 次の席順の人が親（東→南→西→北→東の順）
- **実装方針**:
  - フロントエンド:
    - `HanchanFormView.vue`の参加者選択UIを「東」「南」「西」「北」の順で選択できる形式に変更
    - ラベルを「参加者1」「参加者2」から「東」「南」「西」「北」に変更
    - `seatPositions`を自動設定（選択順に0, 1, 2, 3）
  - バックエンド:
    - 既存の`seatPositions`処理を活用（変更不要）
    - 局開始時に最初の親を自動設定（`seatPosition = 0`の参加者）
- **反映先**: 
  - `design/screen/hanchan-form-screen.md` (参加者選択UIの変更)
  - `design/screen/round-manage-screen.md` (最初の親の自動設定)
- **反映日**: 2025-12-31
- **反映者**: AI
- **優先度**: 中

### [反映済み] 局管理画面で初期状態だと鳴きの記録とリーチの記録ができない

- **元のアイデア**: `12-ideas.md` (2025-12-31 局管理画面で初期状態だと鳴きの記録とリーチの記録ができない)
- **議論内容**:
  - 局管理画面（`RoundManageView.vue`）で初期状態（局開始時）だと鳴きの記録とリーチの記録ができない問題について議論
  - `round.createdAt`が存在する場合のみ鳴き・リーチ記録セクションが表示される実装を確認
  - 実際の使用シーンでは局開始と同時に鳴きやリーチの記録が必要になる場合があることを確認
  - 解決方針の選択肢（局未作成でも記録可能にする、局開始処理を改善する、条件を変更する）を検討
- **決定事項**:
  - `round.createdAt`の判定を削除し、鳴き・リーチ記録セクションを常に表示する
  - 記録時に局が未作成（`!round.createdAt`）の場合は、先に局を作成してから記録する
  - 局作成には親（`dealerPlayerId`）が必要なため、親が未設定の場合はエラーメッセージを表示する
- **実装方針**:
  - フロントエンド:
    - `RoundManageView.vue`の104行目の`v-if="round.createdAt"`を削除
    - `handleAddNaki`関数で、局が未作成の場合は先に局を作成してから鳴きを記録
    - `handleAddRiichi`関数で、局が未作成の場合は先に局を作成してからリーチを記録
    - 局作成処理は既存の`handleSaveRound`関数の局作成部分を参考にする
    - 親が未設定の場合は適切なエラーメッセージを表示
    - 局作成後、作成された局IDで記録を実行
- **反映先**: 
  - `design/screen/round-manage-screen.md` (鳴き・リーチ記録の表示条件の変更)
- **反映日**: 2025-12-31
- **反映者**: AI
- **優先度**: 中

### [反映済み] 複数人一括で登録する機能が欲しい

- **元のアイデア**: `12-ideas.md` (2025-12-31 複数人一括で登録する機能が欲しい)
- **議論内容**:
  - 参加者（プレイヤー）を複数人一度に登録できる機能の追加について議論
  - 実装方法の選択肢（バックエンド一括登録エンドポイント vs フロントエンドループ処理）を検討
  - エラーハンドリングの方針（全部成功/全部失敗 vs 部分成功）を検討
  - UI設計（テキストエリア vs 動的入力フィールド）を検討
- **決定事項**:
  - バックエンドに一括登録用のエンドポイント（`POST /api/players/bulk`）を追加
  - エラーハンドリングは全部成功/全部失敗（トランザクション）の方針を採用
  - UIはテキストエリア（改行区切り）で実装し、改行で入力することが分かりやすい状態にする
  - リクエスト形式: `{ "names": ["参加者1", "参加者2", "参加者3"] }`
  - バリデーション: 既存の`validateName`を使用、重複チェック、リクエスト内での重複チェックも実施
- **実装方針**:
  - バックエンド:
    - `playerController.ts`に`bulkCreate`メソッドを追加
    - `playerService.ts`に`bulkCreate`メソッドを追加（Prismaのトランザクションを使用）
    - `playerRoutes.ts`に`POST /api/players/bulk`ルートを追加
    - リクエストボディのバリデーション: `names`配列の検証、各名前の`validateName`による検証、リクエスト内での重複チェック、既存プレイヤーとの重複チェック
    - トランザクション内で全てのプレイヤーを作成（1つでも失敗したら全てロールバック）
    - 成功時は作成された全プレイヤーのデータを返す
  - フロントエンド:
    - `PlayerListView.vue`または`PlayerFormView.vue`に一括登録機能を追加
    - テキストエリアで複数行入力（改行区切りで名前を入力）
    - プレースホルダーやヘルプテキストで「改行区切りで複数人の名前を入力してください」と明示
    - 入力されたテキストを改行で分割して`names`配列に変換
    - `playerApi.ts`に`bulkCreatePlayer`関数を追加
    - 一括登録成功後は参加者一覧を再読み込み
- **反映先**: 
  - `design/api/players-bulk-create.md` (新規作成)
  - `design/screen/player-list-screen.md` または `design/screen/player-form-screen.md` (一括登録UIの追加)
- **反映日**: 2025-12-31
- **反映者**: AI
- **優先度**: 中

### [反映済み] 局入力画面での結果入力方法の改善

- **元のアイデア**: `12-ideas.md` (2025-12-31 局入力画面での結果入力方法の改善)
- **議論内容**:
  - 現在の結果入力方法（v-select + v-data-table）と鳴き・リーチ記録（ダイアログ形式）のUI/UXの不一致を確認
  - ダイアログ形式への統一によるUI/UXの一貫性向上について議論
  - ダイアログのトリガー方法、結果タイプの選択方法、スコア入力の方法について検討
  - 既存機能との整合性について確認
- **決定事項**:
  - ダイアログ形式で結果入力を統一（鳴き・リーチ記録と同様のUI/UX）
  - 「局を終了」ボタンを押したときにダイアログを開く
  - 結果タイプはボタン形式（v-btn-toggleまたはv-btnのグループ）で選択（視認性と操作性の向上）
  - スコア入力はカード形式（各参加者をv-cardで表示）で入力（テーブルよりコンパクトでモバイル対応）
  - 1つのダイアログ内で条件分岐表示（結果タイプに応じてスコア入力セクションまたは特殊流局タイプ選択を表示）
  - 既存の打点記録表示は維持（読み取り専用として表示）
- **実装方針**:
  - フロントエンド:
    - `RoundManageView.vue`に結果入力用のダイアログ（v-dialog）を追加
    - 「局を終了」ボタンのクリックイベントでダイアログを開く
    - ダイアログ内で結果タイプをボタン形式で選択（v-btn-toggleまたはv-btnのグループ）
    - 結果タイプに応じて条件分岐表示:
      - ツモ・ロン選択時: スコア入力セクション（各参加者をv-cardで表示、和了者・放銃者のチェックボックス、点数・飜・符の入力フィールド）
      - 特殊流局選択時: 特殊流局タイプ選択（ボタン形式またはv-select）
    - ダイアログのアクション: [キャンセル] [確定]ボタン
    - 確定ボタンで既存の`handleSaveRound`関数を呼び出す
    - 既存の結果入力フォーム（v-select + v-data-table）は削除
    - 既存の打点記録表示（読み取り専用）は維持
- **反映先**: 
  - `design/screen/round-manage-screen.md` (局終了時の結果入力方法をダイアログ形式に変更)
- **反映日**: 2025-12-31
- **反映者**: AI
- **優先度**: 中

### [反映済み] 鳴き記録とリーチ記録のUIをシンプルにする

- **元のアイデア**: `12-ideas.md` (2025-12-31 鳴き記録とリーチ記録のUIをシンプルにする)
- **議論内容**:
  - 現在のv-data-table表示の問題点を確認（画面を多く占有する、記録数が少ない場合でもヘッダー行が常に表示される）
  - 画面エリアを効率的に使用できる表示方法について検討（v-chip、v-list、カード形式を比較）
  - 各方法の画面エリア効率を比較検討
- **決定事項**:
  - v-listを使用する（画面エリアを最も効率的に使用できるため）
  - `density="compact"`を使用してコンパクトに表示
  - 削除ボタンはアイコンで配置（`v-list-item`の`append`スロットを使用）
  - 既存の「鳴きを追加」「リーチを追加」ボタンや削除機能は維持
- **実装方針**:
  - フロントエンド:
    - `RoundManageView.vue`の鳴き記録とリーチ記録のセクションを修正
    - `v-data-table`を`v-list`に変更
    - `v-list-item`を使用して各記録を表示
      - 鳴き記録: 参加者名、鳴きタイプ、対象参加者名（あれば）を表示
      - リーチ記録: 参加者名、ダブルリーチ（あれば）、一発（あれば）を表示
    - 削除ボタンは`v-list-item`の`append`スロットに配置
    - `density="compact"`を使用してコンパクトに表示
- **反映先**: 
  - `design/screen/round-manage-screen.md` (鳴き・リーチ記録の表示方法をv-listに変更)
- **反映日**: 2025-12-31
- **反映者**: AI
- **優先度**: 中

### [反映済み] アイデア記録時の日付確認方法の改善

- **元のアイデア**: `12-ideas.md` (2025-12-31 アイデア記録時の日付確認方法の改善)
- **議論内容**:
  - アイデア記録時に日付を記録する方法について議論
  - 最新のアイデアの日付を参照する方法の問題点を確認（日付が変更された場合や複数のアイデアを同じ日に記録する場合に誤った日付が記録される可能性がある）
  - dateコマンドで必ず現在の日付を取得してから記録する方法を採用
  - 既存の`/idea`コマンドの実装も修正する必要があることを確認
- **決定事項**:
  - `/idea`コマンド実行時、アイデア記録前に必ず`date +%Y-%m-%d`コマンドを実行して現在の日付を取得する
  - 取得した日付を使用してアイデアを記録する
  - 最新のアイデアの日付を参照する方法は使用しない
  - 既存の実装（`.cursor/commands/idea.md`と`prompts/00-ai-workflow.md`）も修正する
- **実装方針**:
  - `.cursor/commands/idea.md`の「実行内容」セクションに、dateコマンドで現在の日付を取得する手順を追加
  - `.cursor/commands/idea.md`の「アイデア記録時の注意事項」セクションに、日付は必ずdateコマンドで確認することを明記
  - `prompts/00-ai-workflow.md`の「ステップ1: アイデア記録」セクションの「AIの役割」に、dateコマンドで現在の日付を取得することを追加
- **反映先**: 
  - `.cursor/commands/idea.md` (実行内容と注意事項を更新)
  - `prompts/00-ai-workflow.md` (ステップ1: アイデア記録のAIの役割を更新)
- **反映日**: 2025-12-31
- **反映者**: AI
- **優先度**: 中

### [反映済み] 鳴きとリーチの記録をflex表示にする

- **元のアイデア**: `12-ideas.md` (2025-01-02 鳴きとリーチの記録をflex表示にする)
- **議論内容**:
  - 鳴き記録とリーチ記録の表示をflexレイアウトに変更する方針について議論
  - レイアウト構造の選択肢（案1: flexコンテナ、案2: Vuetifyグリッド）について検討
  - ブレークポイントの設定について検討（600pxを境界とする方針で決定）
  - 既存のv-data-tableの表示は維持する方針で決定
- **決定事項**:
  - 案1（flexコンテナで2つのv-cardを配置）を採用
  - モバイル（600px以下）は縦並び（flex-direction: column）
  - デスクトップ（600px以上）は横並び（flex-direction: row）
  - `@media`クエリを使用してレスポンシブ対応を実装
  - 既存のv-data-tableの表示は維持
- **実装方針**:
  - `RoundManageView.vue`の鳴き記録とリーチ記録のセクションを修正
  - 2つのv-cardをflexコンテナ（`<div class="records-container">`）で囲む
  - CSSでflexレイアウトを実装:
    - デフォルト（モバイル）: `flex-direction: column`
    - `@media (min-width: 600px)`: `flex-direction: row`
  - gapプロパティで適切な間隔を設定
- **反映先**: 
  - `design/screen/round-manage-screen.md` (鳴き・リーチ記録のflexレイアウト設計を追加)
- **反映日**: 2025-01-02
- **反映者**: AI
- **優先度**: 中

### [反映済み] 直前の作業を再開する continue コマンドの作成

- **元のアイデア**: `12-ideas.md` (2025-01-01 直前の作業を再開する continue コマンドの作成)
- **議論内容**:
  - 実行中の作業が止まってしまうケースに対応するためのコマンドについて議論
  - 直前の作業を特定する方法について検討（同じコンテキスト上の会話のみから特定する方針で決定）
  - `/status`コマンドとの違いを明確化（`/status`は進捗確認、`/continue`は作業再開）
- **決定事項**:
  - コマンド名: `/continue`
  - 直前の作業は同じコンテキスト上の会話のみから特定する（ファイルやタスクステータスは参照しない）
  - 対象作業: 設計、実装、テスト、AIレビューなど、会話中に開始された作業
  - 会話履歴から最後に実行していた作業を特定し、その続きから再開する
- **実装方針**:
  - コマンドファイル: `.cursor/commands/continue.md`を作成
  - 実行内容:
    1. 会話履歴を解析し、直前の作業を特定
    2. 作業の種類（設計、実装、テスト、AIレビューなど）と内容を表示
    3. 作業の続きから再開
  - エラーハンドリング:
    - 会話履歴から作業を特定できない場合、エラーメッセージを表示
    - 複数の作業が途中で止まっている場合、最新の作業を優先
  - ワークフロードキュメント: `prompts/00-ai-workflow.md`にコマンドの説明を追加
- **反映先**: 
  - `.cursor/commands/continue.md` (新規作成)
  - `prompts/00-ai-workflow.md` (コマンド一覧セクションに追加)
- **反映日**: 2025-01-01
- **反映者**: AI
- **優先度**: 中

### [反映済み] タブで局の管理をする

- **元のアイデア**: `12-ideas.md` (2025-12-31 タブで局の管理をする)
- **議論内容**:
  - 現在の「局開始」「局進行中」「局終了」の3つのタブ管理をやめて、各局ごとに管理する方式について議論
  - UI/UXの方式について検討（タブ方式、ExpansionPanel方式、ハイブリッド方式）
  - 局の状態管理の必要性について議論
  - ラベル表示形式について議論
- **決定事項**:
  - ExpansionPanel方式で実装する
  - 「局開始」「局進行中」「局終了」のタブは削除する
  - 局の状態管理は不要（UI上は状態を表示しない）
  - ラベル表示は「東1局0本場」形式（例: `東1局0本場`）
  - `RoundListView.vue`（局一覧画面）は削除し、`RoundManageView.vue`に統合する
  - 画面遷移は`/hanchans/:hanchanId/rounds`に統合する
- **実装方針**:
  - フロントエンド:
    - `RoundManageView.vue`をExpansionPanel方式に変更
      - 全局をExpansionPanelで表示
      - 各ExpansionPanel内に局開始フォーム、鳴き記録一覧、リーチ記録一覧、局終了フォームを配置
      - ラベルは「東1局0本場」形式で表示
      - 「次局へ」ボタンで次の局のExpansionPanelを自動展開
    - `RoundListView.vue`を削除
    - ルーティングを`/hanchans/:hanchanId/rounds`に統合
- **反映先**: 
  - `design/screen/round-manage-screen.md` (画面構成をExpansionPanel方式に変更)
  - `design/screen/round-list-screen.md` (削除予定のため、削除を記録)
- **優先度**: 中

### [反映済み] 局新規開始ボタンで局編集画面に入ると親が取得できない

- **元のアイデア**: `12-ideas.md` (2025-01-01 局新規開始ボタンで局編集画面に入ると親が取得できない)
- **議論内容**:
  - 局新規開始ボタンで局編集画面に入ると親が取得できない問題について議論
  - 問題は常に発生していることを確認
  - `RoundManageView.vue`の`setDefaultValues`関数で親を設定する処理を確認
  - `players.value`が空の状態で親を設定しようとしている可能性を確認
- **決定事項**:
  - `setDefaultValues`内で`players.value`を使用する前に、`players.value.length > 0`を確認する
  - `loadHanchan()`がエラーを返した場合、`setDefaultValues`を実行しない
  - `players.value`が空の場合、エラーメッセージを表示する
- **実装方針**:
  - フロントエンド:
    - `RoundManageView.vue`の`setDefaultValues`関数を修正
      - `players.value`を使用する前に、`players.value.length > 0`を確認
      - `loadHanchan()`がエラーを返した場合、`setDefaultValues`を実行しない
      - `players.value`が空の場合、エラーメッセージを表示
- **反映先**: 
  - `design/screen/round-manage-screen.md` (デフォルト値の自動設定ロジックを更新)
- **反映日**: 2025-01-01
- **反映者**: AI
- **優先度**: 中

### [反映済み] 次の局へボタンを押したときに局開始タブに遷移しない / 連荘判定による次の局の自動計算

- **元のアイデア**: `12-ideas.md` (2025-01-01 次の局へボタンを押したときに局開始タブに遷移しない)
- **議論内容**:
  - 「次の局へ」ボタンを押したときに、次の局の入力画面に遷移するが、局開始タブに自動的に遷移しない問題について議論
  - 連荘か連荘でないかで次の局の番号、風、本場が自動計算できるようにする要望を確認
  - 連荘の判定ロジックについて議論
    - 現在の実装では、親が和了した場合のみ連荘と判定している
    - テンパイ流局時に親がテンパイしていた場合も連荘とする必要があることを確認
- **決定事項**:
  - 連荘の判定ロジックを修正する
    - 親が和了した場合（`isDealerWinner === true`）→ 連荘
    - テンパイ流局時に親がテンパイしていた場合（`resultType === DRAW && isDealerTenpai === true`）→ 連荘
  - 次の局の番号、風、本場を自動計算する
    - 連荘の場合: 局番号は変わらない、風は変わらない、本場は`calculateNextSettings`で計算済み
    - 連荘でない場合: 局番号は+1（最大16局まで）、風は次の風（東→南→西→北）、本場は`calculateNextSettings`で計算済み
  - `calculateNextSettings` APIのレスポンスに`nextRoundNumber`と`nextWind`を追加する
  - 次の局の入力画面に遷移した際に、自動的に「局開始」タブが選択され、計算された値が自動入力されるようにする
- **実装方針**:
  - バックエンド:
    - `riichiHonbaCalculationService.ts`の`calculateIsRenchan`関数を修正
      - パラメータに`resultType`と`isDealerTenpai`を追加
      - 親が和了した場合、またはテンパイ流局時に親がテンパイしていた場合に連荘とする
    - `calculateNextRoundSettings`関数を修正
      - `calculateIsRenchan`の呼び出しに必要なパラメータを渡す
      - 次の局の番号と風を計算するロジックを追加
        - 連荘の場合: 現在の局番号と風を維持
        - 連荘でない場合: 局番号+1、風は次の風（1-4: 東、5-8: 南、9-12: 西、13-16: 北）
    - `roundController.ts`の`calculateNextSettings`を修正
      - レスポンスに`nextRoundNumber`と`nextWind`を追加
      - 現在の局の情報から次の局の番号と風を計算
  - フロントエンド:
    - `roundApi.ts`の`CalculateNextSettingsResponse`型に`nextRoundNumber`と`nextWind`を追加
    - `RoundManageView.vue`の`handleNextRound`関数を修正
      - `calculateNextSettings`のレスポンスから`nextRoundNumber`と`nextWind`を取得
      - 次の局の入力画面に遷移する際に、これらの値をクエリパラメータとして渡す
    - 新規局作成時のデフォルト値設定を修正
      - クエリパラメータから`roundNumber`、`wind`、`honba`、`riichiSticks`、`isRenchan`を取得して自動設定
      - 遷移後に自動的に「局開始」タブ（`activeTab = "start"`）が選択されるようにする
- **反映先**: 
  - `design/api/rounds-calculate-next-settings.md` (レスポンスに`nextRoundNumber`と`nextWind`を追加)
  - `design/screen/round-manage-screen.md` (次の局への遷移時の動作を更新)
- **優先度**: 中

### [反映済み] 局終了時の記録方法の改善

- **元のアイデア**: `12-ideas.md` (2025-01-01 局終了時の記録方法の改善)
- **議論内容**:
  - 局終了時の記録方法について議論
  - 現在の実装では、ツモ・ロン選択時にスコア入力欄が表示されない問題を確認
  - ダブロン（2人同時ロン）とトリロン（3人同時ロン）を許容する必要があることを確認
  - 点数（scoreChange）のみ必須で、飜（han）と符（fu）は任意であることを確認
  - 現在の実装では、ロン時に和了者が1人であることをバリデーションしているが、ダブロン・トリロンを許容する必要がある
- **決定事項**:
  - スコア入力フォームを追加する
    - ツモ・ロン選択時に、参加者ごとの入力欄を表示
    - 和了者・放銃者のチェックボックス、点数（必須）、飜・符（任意）の入力欄を配置
  - ダブロン・トリロンを許容する
    - ロンの場合、和了者が1人、2人（ダブロン）、または3人（トリロン）を許容
    - ダブロン・トリロンの場合、放銃者は1人（同じ人から複数人がロン）
    - ツモの場合は和了者が1人のまま
  - バリデーションを修正する
    - ツモ: 和了者が1人、点数必須、飜・符は任意
    - ロン: 和了者が1〜3人、放銃者が1人、点数必須、飜・符は任意
  - UIの改善
    - 入力方法はテーブル形式で、参加者ごとの行に以下を配置
      - 和了者チェックボックス（ロンの場合、複数選択可）
      - 放銃者チェックボックス（ロンの場合、1人のみ選択可）
      - 点数入力欄（必須）
      - 飜入力欄（任意）
      - 符入力欄（任意）
- **実装方針**:
  - フロントエンド:
    - `RoundManageView.vue`の局終了タブにスコア入力フォームを追加
    - ツモ・ロン選択時に、参加者ごとの入力欄を表示
    - 和了者・放銃者のチェックボックス、点数（必須）、飜・符（任意）の入力欄を配置
    - バリデーション: ツモは和了者1人、ロンは和了者1〜3人、放銃者1人
  - バックエンド:
    - `roundService.endRound()`のバリデーションを修正
      - ツモ: 和了者が1人であることを確認
      - ロン: 和了者が1〜3人であることを確認、放銃者が1人であることを確認
    - 型定義は既に`han`と`fu`がオプショナルになっているため、変更不要
  - API設計書:
    - `design/api/rounds-end.md`を更新
      - バリデーションルールを更新（和了者1〜3人、放銃者1人）
      - 飜・符が任意であることを明記
- **反映先**: 
  - `design/api/rounds-end.md` (バリデーションルールの更新)
  - `design/screen/round-manage-screen.md` (局終了タブのスコア入力フォームの追加)
- **反映日**: 2025-12-31
- **反映者**: AI
- **優先度**: 中

### [反映済み] 局にステータス必要ない

- **元のアイデア**: `12-ideas.md` (2025-12-30 局にステータス必要ない)
- **議論内容**:
  - RoundモデルのRoundStatus enum (NOT_STARTED, IN_PROGRESS, COMPLETED)の必要性について議論
  - 局の状態は他のフィールド(startedAt, endedAt, resultType)から判断可能であることを確認
  - ビジネスロジックでの進行中チェックが不要であることを確認
  - ステータス削除によるデータモデルの簡素化のメリットを確認
- **決定事項**:
  - RoundStatus enumとstatusフィールドを削除する
  - 状態判定はstartedAt/endedAtから計算する
    - NOT_STARTED: `startedAt === null && endedAt === null`
    - IN_PROGRESS: `startedAt !== null && endedAt === null`
    - COMPLETED: `endedAt !== null`
  - ビジネスロジックでの進行中チェックは削除する
  - UIでの状態表示は計算ロジックで対応する
  - フィルタリング機能はstartedAt/endedAtベースに変更する
- **実装方針**:
  - PrismaスキーマからstatusフィールドとRoundStatus enumを削除
  - マイグレーションファイルを作成してデータベーススキーマを更新
  - バックエンドの型定義からRoundStatus enumを削除
  - roundService.findAll()のstatusフィルタリングを削除またはstartedAt/endedAtベースに変更
  - roundService.update()のstatus更新ロジックを削除
  - roundService.createNaki(), createRiichi(), endRound()のstatusチェックを削除
  - roundControllerのvalidateStatus()関数を削除
  - APIエンドポイントのstatusクエリパラメータを削除
  - フロントエンドの型定義からRoundStatus enumを削除
  - RoundListView.vueのstatusフィルタリングをstartedAt/endedAtベースに変更
  - RoundManageView.vueのstatusチェックをstartedAt/endedAtベースに変更
  - 状態判定用のユーティリティ関数を作成
- **反映先**: `design/mahjong-data-model.md` (Roundモデルセクション)
- **反映日**: 2025-12-30
- **反映者**: AI
- **優先度**: 中
- **タスク**: `14-tasks.md` (TASK-20251230-013: 局にステータス必要ない)

### [反映済み] 半荘と局登録のUIを実用に寄せる

- **元のアイデア**: `12-ideas.md` (2025-12-30 半荘と局登録のUIを実用に寄せる)
- **議論内容**:
  - 半荘新規作成後にそのまま局の情報をリアルタイムで入力していくフローについて議論
  - 現在のフロー（半荘作成 → 半荘一覧 → 局一覧 → 局作成）が煩雑であることを確認
  - 実用的なUI改善の方向性について検討
- **決定事項**:
  - **画面構成**: 1画面で完結（タブ/セクション切り替え）
    - 局開始情報、局進行中（鳴き・リーチ）、局終了（打点）を1画面で管理
  - **リアルタイム入力の範囲**: 局開始情報のみ、局進行中（鳴き・リーチ）も含む、局終了（打点）も含む
  - **次の局への遷移**: 
    - 自動で次の局番号の入力画面へ遷移
    - 確認ダイアログを表示
    - 局一覧に戻る選択肢も提供
  - **半荘作成時のオプション**: 半荘作成後、すぐ局入力画面へ遷移
  - **デフォルト値の自動設定**:
    - 局番号: 前の局+1（または自動計算）
    - 風: 局番号に応じて自動設定（1-4局: 東、5-8局: 南、など）
    - 親: 前の局の親を継続（流局時）または次の人へ
    - 本場・積み棒: 前の局から継承
- **実装方針**:
  - `HanchanFormView.vue`の保存成功後、`/hanchans/:hanchanId/rounds/new?roundNumber=1`に遷移
  - `RoundManageView.vue`を1画面で完結する構成に改善
    - タブまたはセクションで「局開始」「局進行中」「局終了」を切り替え
    - 局開始情報、鳴き・リーチ記録、打点記録を1画面で管理
  - 局保存成功後、「次の局」ボタンで次の局番号の入力画面へ自動遷移
  - 確認ダイアログで「次の局へ」「局一覧に戻る」を選択可能
  - デフォルト値の自動設定ロジックを実装
- **反映先**: 
  - `design/screen/hanchan-form-screen.md` (半荘作成後の遷移を追記)
  - `design/screen/round-manage-screen.md` (1画面完結型の設計に更新)
  - `02-architecture.md` (UI/UXセクションにフロー改善を追記)
- **反映日**: 2025-12-30
- **反映者**: AI
- **優先度**: 中
- **タスク**: `14-tasks.md` (TASK-20251230-012: 半荘と局登録のUIを実用に寄せる)

### [反映済み] デフォルトのデザインやcomponentを削除する

- **元のアイデア**: `12-ideas.md` (2025-12-30 デフォルトのデザインやcomponentを削除する)
- **議論内容**:
  - Vueプロジェクトの初期セットアップ時に生成されたデフォルトのデザインやコンポーネントを削除することについて議論
  - 削除対象のファイルと使用箇所を確認
  - `HomeView.vue`と`AboutView.vue`は削除ではなく、麻雀記録アプリ用の画面に置き換えることを決定
  - `App.vue`のレイアウトについて議論し、VuetifyのAppBar + Navigation Drawer（案1）を採用
- **決定事項**:
  - 削除対象のファイル:
    - `frontend/src/components/HelloWorld.vue`
    - `frontend/src/components/TheWelcome.vue`
    - `frontend/src/components/WelcomeItem.vue`
    - `frontend/src/components/icons/`ディレクトリ内のアイコンファイル
    - `frontend/src/components/__tests__/HelloWorld.spec.ts`
  - 修正対象のファイル:
    - `frontend/src/App.vue`: `HelloWorld`のimportと使用、デフォルトデザイン（ロゴ、ナビゲーション）を削除し、VuetifyのAppBar + Navigation Drawerに置き換え
    - `frontend/src/views/HomeView.vue`: `TheWelcome`の使用を削除し、麻雀記録アプリ用のホーム画面（ダッシュボード的な画面）に置き換え
    - `frontend/src/views/AboutView.vue`: デフォルトコンテンツを削除し、麻雀記録アプリ用のAbout画面（アプリの説明、使い方、バージョン情報）に置き換え
    - `frontend/src/router/index.ts`: `/about`ルートは維持（新しいAbout画面に置き換え）
  - `App.vue`のレイアウト: VuetifyのAppBar + Navigation Drawerを採用
    - 上部に固定のAppBar（アプリタイトル、メニューボタン）
    - 左側にNavigation Drawer（サイドメニュー）
    - メインコンテンツエリアに`<RouterView />`
    - ナビゲーション項目: ホーム、参加者一覧、半荘一覧、統計・履歴（将来の機能）
- **実装方針**:
  - `App.vue`をVuetifyの`v-app`、`v-app-bar`、`v-navigation-drawer`を使用したレイアウトに変更
  - デフォルトコンポーネント（`HelloWorld.vue`、`TheWelcome.vue`、`WelcomeItem.vue`、`icons/`ディレクトリ）を削除
  - `HomeView.vue`を麻雀記録アプリ用のダッシュボード画面に置き換え（最近の半荘、統計情報、クイックアクションなど）
  - `AboutView.vue`を麻雀記録アプリ用のAbout画面に置き換え（アプリの説明、使い方、バージョン情報など）
  - 関連するテストファイル（`HelloWorld.spec.ts`）を削除
  - 削除前に、これらのコンポーネントが他の場所で使用されていないか確認
- **反映先**: 
  - `design/screen/home-screen.md` (新規作成、ホーム画面の設計)
  - `design/screen/about-screen.md` (新規作成、About画面の設計)
  - `02-architecture.md` (UI/UXセクションにレイアウト設計を追記)
- **反映日**: 2025-12-30
- **反映者**: AI
- **優先度**: 中
- **タスク**: `14-tasks.md` (TASK-20251230-011: デフォルトのデザインやcomponentを削除する)

### [反映済み] Vueのslot記法の統一

- **元のアイデア**: `12-ideas.md` (2025-12-30 Vueのslot記法の統一)
- **議論内容**:
  - Vueのslot記法について、現在のコードベースで混在していることを確認
  - `RoundListView.vue`では動的記法`#[`item.status`]`と静的記法`#item.resultType`が混在
  - lintエラーを回避するための記法統一の必要性について議論
  - 可読性と一貫性のバランスについて検討
- **決定事項**:
  - 動的slot名が必要な場合のみ`#[`item.xxx`]`を使用
  - 静的slot名は`#item.xxx`のまま（可読性のため）
  - コーディング規約（`prompts/03-coding-standards.md`）に明記
  - 既存コードは必要に応じて修正（新規コードは統一された記法を使用）
- **実装方針**:
  - `prompts/03-coding-standards.md`にVueのslot記法に関するセクションを追加
  - 動的slot名と静的slot名の使い分けを明確化
  - 既存コードの修正は必要に応じて実施（優先度: 低）
- **反映先**: 
  - `prompts/03-coding-standards.md` (Vueのslot記法セクション)
- **反映日**: 2025-12-30
- **反映者**: AI
- **優先度**: 中
- **タスク**: `14-tasks.md` (TASK-20251230-010: Vueのslot記法の統一)

### [反映済み] PostgreSQLへの移行

- **元のアイデア**: `12-ideas.md` (2025-12-30 PostgreSQLへの移行)
- **議論内容**:
  - 現在使用しているSQLiteからPostgreSQLへの移行について議論
  - 本番環境の想定について確認（クラウド環境を想定）
  - 開発環境でのPostgreSQLの用意方法について確認（Dockerを想定）
  - 移行のメリット・デメリットについて検討
  - 移行タイミングについて検討（現在データがないため移行コストが低い）
- **決定事項**:
  - PostgreSQLへの移行を採用
  - 本番環境: クラウド環境（AWS RDS、Google Cloud SQL、Azure Database等のマネージドサービスを想定）
  - 開発環境: Docker Composeを使用してPostgreSQLコンテナを用意
  - 移行タイミング: 現在データがないため、早期に移行を実施
- **実装方針**:
  - Prismaスキーマの変更: `backend/prisma/schema.prisma`の`provider`を`sqlite`から`postgresql`に変更
  - Docker Composeの追加: 開発環境用のPostgreSQLコンテナを追加（`docker-compose.yml`の作成）
  - 環境変数の設定: `DATABASE_URL`をPostgreSQL用の接続URLに更新
  - マイグレーション: Prismaマイグレーションを実行してデータベーススキーマを適用
- **反映先**: 
  - `design/postgresql-migration.md` (PostgreSQLへの移行設計)
  - `02-architecture.md` (データベース選定を更新)
- **反映日**: 2025-12-30
- **反映者**: AI
- **優先度**: 中
- **タスク**: `14-tasks.md` (TASK-20251230-009: PostgreSQLへの移行)

### [反映済み] 麻雀記録アプリの作成

- **元のアイデア**: `12-ideas.md` (2025-12-30 麻雀記録アプリの作成)
- **議論内容**:
  - 麻雀の記録を行うためのアプリの作成について議論
  - プロジェクトの方向性について確認（新規プロジェクトとして開始）
  - データ管理方法について議論（データベース想定）
  - バックエンドの実装方針について議論（はじめから追加）
  - UI/UXの要件について議論（リアルタイム重視、編集可能性も必要）
  - 技術スタックについて確認（Vue 3 + TypeScript + Vuetify、バックエンドはTypeScript + Node.js）
- **決定事項**:
  - プロジェクトの方向性: 新規プロジェクトとして開始（既存のクイズアプリとは別プロジェクト）
  - データ管理: データベース想定（初期からデータベースを使用）
  - バックエンド: はじめから追加（フロントエンドとバックエンドを同時に開発）
  - UI/UX: リアルタイム重視、編集可能性も必要（局の進行中にリアルタイムで記録、後から編集可能）
  - 技術スタック:
    - フロントエンド: Vue 3 + TypeScript + Vuetify
    - バックエンド: TypeScript + Node.js
    - データベース: 未定（PostgreSQL、MySQL、SQLiteなどから選択）
  - 主要機能:
    - 参加者登録機能
    - 半荘管理機能（開始、終了、席順）
    - 局管理機能（開始、進行中、終了）
    - 打点計算機能（ツモ、ロン、流局）
    - 積み棒・本場の計算機能
    - 統計・履歴表示機能
- **実装方針**:
  - モノレポ構成を採用（`frontend/`、`backend/`、`prompts/`）
  - データモデル設計:
    - 参加者（Player）
    - 半荘（Hanchan）
    - 局（Round）
    - 打点記録（Score）
    - 積み棒（Tsumi）
    - 本場（Honba）
  - 実装フェーズ:
    - Phase 1: 参加者登録、半荘・局の基本記録
    - Phase 2: 打点計算、積み棒・本場の計算
    - Phase 3: 統計・履歴表示
  - API設計: RESTful APIを採用
  - リアルタイム更新: 局の進行中にリアルタイムで記録、後から編集可能
- **反映先**: 
  - `01-project-overview.md` (プロジェクト概要を更新)
  - `02-architecture.md` (アーキテクチャを更新)
  - データモデル設計書（新規作成）
  - API仕様書（新規作成）
  - 画面設計書（新規作成）
- **反映日**: 2025-12-30
- **反映者**: AI
- **優先度**: 高
- **タスク**: 
  - `14-tasks.md` (TASK-20251230-001: プロジェクト初期設定)
  - `14-tasks.md` (TASK-20251230-002: データモデル設計・実装)
  - `14-tasks.md` (TASK-20251230-003: 参加者登録機能)
  - `14-tasks.md` (TASK-20251230-004: 半荘管理機能)
  - `14-tasks.md` (TASK-20251230-005: 局管理機能)
  - `14-tasks.md` (TASK-20251230-006: 打点計算機能)
  - `14-tasks.md` (TASK-20251230-007: 積み棒・本場の計算機能)
  - `14-tasks.md` (TASK-20251230-008: 統計・履歴表示機能)

### [反映済み] プロジェクトの運用方針を確認するコマンドの作成

- **元のアイデア**: `12-ideas.md` (2025-12-26 プロジェクトの運用方針を確認するコマンドの作成)
- **議論内容**:
  - プロジェクトの運用方針を確認できるコマンドの必要性について議論
  - 既存の`/status`コマンドはフローの進捗状況を確認するコマンドであり、運用方針を確認するコマンドとは異なることを確認
  - コマンド名について議論し、`/policy`と決定
  - 表示形式について議論し、カテゴリ選択式で表示する方針で決定
  - 表示内容について議論し、開発フロー、コーディング規約、ディレクトリ構造、テスト戦略、制約事項を表示することに決定
- **決定事項**:
  - コマンド名: `/policy`
  - 表示形式: カテゴリ選択式
  - 表示内容:
    - 開発フロー: `00-ai-workflow.md`の内容
    - コーディング規約: `03-coding-standards.md`の内容
    - ディレクトリ構造: `04-directory-structure.md`の内容
    - テスト戦略: `07-testing-strategy.md`の内容
    - 制約事項: `10-constraints.md`の内容
  - 実装方法:
    - `.cursor/commands/policy.md`を作成
    - 既存の`/status`コマンドと同様の形式で実装
    - 実行時にカテゴリ一覧を表示し、ユーザーが選択
    - 選択されたカテゴリに対応するドキュメントを読み込み、内容を表示
- **実装方針**:
  - `.cursor/commands/policy.md`を作成し、コマンドの説明を記載
  - 実行時に`prompts/`ディレクトリ内の該当ドキュメントを読み込み
  - カテゴリ一覧を表示し、ユーザーが選択できるようにする
  - 選択されたカテゴリに対応するドキュメントの内容を表示
- **反映先**: `.cursor/commands/policy.md` (新規作成)
- **優先度**: 中
- **タスク**: `14-tasks.md` (TASK-20251226-004)

### [反映済み] AI レビューフェーズを開始するコマンドの作成

- **元のアイデア**: `12-ideas.md` (2025-12-26 AI レビューフェーズを開始するコマンドの作成)
- **議論内容**:
  - AI レビューフェーズを開始するコマンドの必要性について議論
  - `/test`コマンドと同様の構造でレビューコマンドを作成することに決定
  - コマンド名は`/review`と決定
  - レビュー内容について議論し、具体的なチェック項目を定義することに決定
  - 既存のドキュメント（`03-coding-standards.md`, `05-code-patterns.md`, `07-testing-strategy.md`など）を参照してレビュー内容を明確化
  - レビュー内容をドキュメント化することに決定
- **決定事項**:
  - コマンド名: `/review`
  - 実行内容:
    - `14-tasks.md`でテストフェーズが`[完了]`で AI レビューフェーズが`[未着手]`のタスクを確認
    - レビュー対象のタスクを特定（`/task`コマンドで選択したタスク、または手動で指定）
    - タスクの AI レビューフェーズを`[進行中]`に更新
    - 実装コード、テストコードをレビュー
    - コーディング規約の遵守を確認
    - 設計ドキュメントとの整合性を確認
    - 改善点があれば指摘
    - レビュー完了後、タスクの AI レビューフェーズを`[完了]`に更新
  - レビュー内容:
    - 実装コードのレビュー（コーディング規約、コードパターン、制約事項、開発フロー）
    - テストコードのレビュー（カバレッジ、品質）
    - 設計ドキュメントとの整合性確認
    - 改善点の指摘（パフォーマンス、可読性、保守性、セキュリティ）
  - レビュー内容をドキュメント化: `15-review-guidelines.md`を作成
- **実装方針**:
  - `.cursor/commands/review.md`を作成
  - `/test`コマンドと同様の構造でレビューフローを定義
  - タスクの AI レビューフェーズを管理
  - `15-review-guidelines.md`にレビュー内容のチェック項目を定義
  - 既存のドキュメント（`00-ai-workflow.md`, `03-coding-standards.md`, `05-code-patterns.md`, `07-testing-strategy.md`など）を参照
- **反映先**:
  - `.cursor/commands/review.md` (新規作成)
  - `15-review-guidelines.md` (新規作成、レビュー内容のチェック項目を定義)
  - `00-ai-workflow.md` (AI レビューフェーズの説明を更新、`/review`コマンドを追加)
- **反映日**: 2025-12-26
- **反映者**: AI
- **優先度**: 中
- **タスク**: `14-tasks.md` (TASK-20251226-003)

### [反映済み] テストフェーズを開始するコマンドの作成

- **元のアイデア**: `12-ideas.md` (2025-12-26 テストフェーズを開始するコマンドの作成)
- **議論内容**:
  - テストフェーズを開始するコマンドの必要性について議論
  - `/implement`コマンドと同様の構造でテストコマンドを作成することに決定
  - コマンド名は`/test`と決定
  - テストコードの実装方針と実装タイミングについて議論
  - 既存のドキュメント間でテストコードの実装タイミングが不統一であることを確認
  - TDD（テスト駆動開発）を推奨する方針で統一することに決定
- **決定事項**:
  - コマンド名: `/test`
  - 実行内容:
    - `14-tasks.md`で実装フェーズが`[完了]`でテストフェーズが`[未着手]`のタスクを確認
    - テスト対象のタスクを特定（`/task`コマンドで選択したタスク、または手動で指定）
    - タスクのテストフェーズを`[進行中]`に更新
    - テストを実行し、カバレッジを確認
    - 不足しているテストを特定し、作成支援
    - テスト完了後、タスクのテストフェーズを`[完了]`に更新
  - テストコードの実装タイミング: TDD を推奨（実装フェーズでテストコードを先に作成）
  - 実装フェーズとテストフェーズの関係:
    - 実装フェーズ: 実装コード + テストコード作成（TDD）
    - テストフェーズ: テスト実行、カバレッジ確認、不足テストの補完
  - テストコマンドの役割:
    - テストフェーズの開始を明確化
    - テスト実行とカバレッジ確認
    - 不足しているテストの特定と作成支援
- **実装方針**:
  - `.cursor/commands/test.md`を作成
  - `/implement`コマンドと同様の構造でテストフローを定義
  - タスクのテストフェーズを管理
  - テスト実行とカバレッジ確認を実施
  - 不足しているテストの特定と作成支援
  - 既存のドキュメント（`07-testing-strategy.md`, `08-development-workflow.md`, `00-ai-workflow.md`）の整合性を保つ
- **反映先**:
  - `.cursor/commands/test.md` (新規作成)
  - `00-ai-workflow.md` (テストフローの説明を更新、TDD の方針を明確化)
  - `08-development-workflow.md` (テストコードの実装タイミングを TDD に統一)
  - `07-testing-strategy.md` (実装タイミングの説明を明確化)
- **反映日**: 2025-12-26
- **反映者**: AI
- **優先度**: 中

### [反映済み] 議論から直接設計に入るフローをなくす

- **元のアイデア**: `12-ideas.md` (2025-12-26 議論から直接設計に入るフローをなくす)
- **議論内容**:
  - 現在の`/design`コマンドには議事録ベースの設計反映モード（モード 1）があり、タスク切り出しをスキップして直接設計に入れる問題について議論
  - AI ドリブンな開発を目的としているため、AI の動作に一貫性を持たせることが非常に重要であることを確認
  - 正しいフローは「議論 → 議事録記録 → タスク切り出し → 設計」であり、このフローを統一する必要があることを確認
- **決定事項**:
  - `/design`コマンドのモード 1（議事録ベースの設計反映）を削除
  - モード 2（タスクベースの設計開始）のみを残す
  - すべての設計は必ずタスク切り出しを経てから開始する
  - フローを「議論 → 議事録記録 → タスク切り出し → 設計」に統一
- **実装方針**:
  - `.cursor/commands/design.md`からモード 1（議事録ベースの設計反映）を削除
  - `00-ai-workflow.md`の設計フェーズから議事録ベースの記述を削除
  - `/design`コマンドはタスクベースの設計開始のみをサポートするように変更
  - 議事録から直接設計に入るフローを完全に排除
- **反映先**:
  - `.cursor/commands/design.md` (モード 1 を削除、モード 2 のみ残す)
  - `00-ai-workflow.md` (設計フェーズの説明を更新、議事録ベースの記述を削除)
- **反映日**: 2025-12-26
- **反映者**: AI
- **優先度**: 中

### [反映済み] 実装コマンドの作成

- **元のアイデア**: `12-ideas.md` (実装コマンドの作成)
- **議論内容**:
  - 実装フローを開始するコマンドの必要性について議論
  - `/design`コマンドと同様の構造で実装コマンドを作成することに決定
  - コマンド名は`/implement`と決定
  - API 実装時はフロントエンドとバックエンドの両方を同時に実装することを確認
- **決定事項**:
  - コマンド名: `/implement`
  - 実行内容:
    - `14-tasks.md`で設計フェーズが`[完了]`で実装フェーズが`[未着手]`のタスクを確認
    - 実装対象のタスクを特定（`/task`コマンドで選択したタスク、または手動で指定）
    - タスクの実装フェーズを`[進行中]`に更新
    - 設計ドキュメントを確認し、実装を開始
  - API 実装時の要件: フロントエンドとバックエンドの両方を同時に必ず実装する
- **実装方針**:
  - `.cursor/commands/implement.md`を作成
  - `/design`コマンドと同様の構造で実装フローを定義
  - タスクの実装フェーズを管理
  - 設計ドキュメントに基づいて実装を開始
  - API 実装時は必ずフロントエンドとバックエンドの両方を実装
- **反映先**:
  - `.cursor/commands/implement.md` (新規作成)
  - `00-ai-workflow.md` (実装フローの説明を更新、API 実装時の要件を追記)
- **反映日**: 2025-12-25
- **反映者**: AI
- **優先度**: 中

### [反映済み] 設計開始コマンドの改善・明確化

- **元のアイデア**: `12-ideas.md` (設計開始コマンドの改善・明確化)
- **議論内容**:
  - 実装設計書の配置場所について議論
  - 設計書はタスクごとではなく、各 API、画面、モデルごとに作成すべきことを確認
  - 既存の`design/`ディレクトリ構造を活用することに決定
  - 設計書の命名規則を明確化
  - タスクと設計書の関連付け方法を決定
- **決定事項**:
  - 実装設計書の配置場所: `design/`ディレクトリ（既存の構造を活用）
  - 設計書の種類: 画面項目定義書、API 仕様書、データモデル（DB 設計書）
  - 設計書の命名規則:
    - API: `[リソース名]-[アクション].md` (例: `users-list.md`, `users-create.md`)
    - 画面: `[画面名]-screen.md` (例: `user-list-screen.md`)
    - モデル: `[モデル名]-model.md` (例: `user-model.md`)
  - タスクと設計書の関連付け: `14-tasks.md`の設計フェーズに設計書へのリンクを記載
  - 設計フローの明確化: タスクの設計フェーズで必要な設計書（API、画面、モデル）を作成・更新
- **実装方針**:
  - `/design`コマンドを改善し、タスクベースの設計開始フローを明確化
  - タスクの設計フェーズで、必要な設計書を`design/`ディレクトリに作成・更新
  - 既存のテンプレート（`design/api/template.md`, `design/model/template.md`）を活用
  - 画面項目定義書のテンプレートも作成（`design/screen/template.md`）
- **反映先**:
  - `04-directory-structure.md` (設計書の配置場所を追記)
  - `.cursor/commands/design.md` (タスクベースの設計フローを追加)
  - `00-ai-workflow.md` (設計フローの説明を更新)
- **反映日**: 2025-12-25
- **反映者**: AI
- **優先度**: 中
