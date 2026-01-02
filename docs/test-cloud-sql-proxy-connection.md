# Cloud SQL Proxy接続のテスト手順

## テスト概要

Cloud SQL Proxyを使用した接続設定のテスト手順です。

## テスト対象

- TASK-20260102-005: ステージング環境の500エラー問題: Cloud RunからCloud SQLへの接続エラーを解決する

## テスト環境

- **ステージング環境**: `majong-app-backend-staging`
- **Cloud SQLインスタンス**: `majong-app-db-staging`
- **リージョン**: `us-west1`

## テスト手順

### 1. デプロイワークフローの構文チェック

#### 1.1 YAML構文チェック

```bash
# deploy.ymlの構文チェック（GitHub Actionsの構文チェックツールを使用）
# または、GitHub上でプルリクエストを作成して自動チェックを確認
```

**確認事項:**
- [ ] YAML構文エラーがないこと
- [ ] GitHub Actionsのワークフロー構文が正しいこと
- [ ] 環境変数の参照が正しいこと

### 2. デプロイの実行

#### 2.1 ステージング環境へのデプロイ

```bash
# stagingブランチにプッシュしてデプロイを実行
git push origin staging
```

**確認事項:**
- [ ] デプロイが正常に完了すること
- [ ] Cloud SQLインスタンスの接続名が正しく取得されていること
- [ ] `--add-cloudsql-instances`フラグが正しく設定されていること
- [ ] DATABASE_URLの接続文字列が`/cloudsql/CONNECTION_NAME`形式になっていること

### 3. デプロイ後の動作確認

#### 3.1 Cloud Runサービスの状態確認

```bash
# サービスが正常に起動しているか確認
gcloud run services describe majong-app-backend-staging \
  --region us-west1 \
  --project=majong-app-staging \
  --format="value(status.conditions[0].status)"
```

**期待結果:** `True`

#### 3.2 環境変数の確認

```bash
# DATABASE_URLが正しく設定されているか確認
gcloud run services describe majong-app-backend-staging \
  --region us-west1 \
  --project=majong-app-staging \
  --format="value(spec.template.spec.containers[0].env)"
```

**確認事項:**
- [ ] DATABASE_URLが`postgresql://user:password@/database?host=/cloudsql/CONNECTION_NAME`形式になっていること
- [ ] `NODE_ENV`が`staging`に設定されていること
- [ ] `API_BASE_URL`が正しく設定されていること

#### 3.3 Cloud SQL Proxy接続の確認

```bash
# Cloud RunサービスのCloud SQL接続設定を確認
gcloud run services describe majong-app-backend-staging \
  --region us-west1 \
  --project=majong-app-staging \
  --format="value(spec.template.spec.containers[0].cloudSqlInstances)"
```

**確認事項:**
- [ ] Cloud SQLインスタンスの接続名が正しく設定されていること
- [ ] 接続名の形式が`PROJECT_ID:REGION:INSTANCE_NAME`になっていること

### 4. ログの確認

#### 4.1 エラーログの確認

```bash
# エラーログを確認
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=majong-app-backend-staging AND severity>=ERROR" \
  --limit 50 \
  --format json \
  --project=majong-app-staging
```

**確認事項:**
- [ ] データベース接続エラーが発生していないこと
- [ ] `ECONNREFUSED`や`Can't reach database server`などのエラーが表示されていないこと
- [ ] Prismaクライアントの初期化エラーが発生していないこと

#### 4.2 正常ログの確認

```bash
# 正常ログを確認（Prismaクライアントの初期化ログなど）
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=majong-app-backend-staging" \
  --limit 50 \
  --format "table(timestamp,severity,textPayload,jsonPayload.message)" \
  --project=majong-app-staging
```

**確認事項:**
- [ ] `Prisma Client initialized successfully`のログが表示されていること
- [ ] `Prisma Client connected to database successfully`のログが表示されていること

### 5. APIエンドポイントの動作確認

#### 5.1 ヘルスチェックエンドポイント

```bash
# バックエンドURLを取得
BACKEND_URL=$(gcloud run services describe majong-app-backend-staging \
  --region us-west1 \
  --project=majong-app-staging \
  --format='value(status.url)')

# ヘルスチェック
curl $BACKEND_URL/health
```

**期待結果:**
```json
{
  "status": "ok",
  "message": "麻雀記録アプリ API"
}
```

#### 5.2 プレイヤー一覧取得API

```bash
# プレイヤー一覧を取得
curl $BACKEND_URL/api/players
```

**確認事項:**
- [ ] ステータスコードが200であること
- [ ] レスポンスが正常に返ってくること
- [ ] データベースからデータが取得できていること

#### 5.3 セッション一覧取得API

```bash
# セッション一覧を取得
curl $BACKEND_URL/api/sessions
```

**確認事項:**
- [ ] ステータスコードが200であること
- [ ] レスポンスが正常に返ってくること
- [ ] データベースからデータが取得できていること

#### 5.4 半荘一覧取得API

```bash
# 半荘一覧を取得
curl $BACKEND_URL/api/hanchans
```

**確認事項:**
- [ ] ステータスコードが200であること
- [ ] レスポンスが正常に返ってくること
- [ ] データベースからデータが取得できていること

### 6. フロントエンドからの動作確認

#### 6.1 フロントエンドURLの確認

```bash
# フロントエンドURLを取得
FRONTEND_URL=$(gcloud run services describe majong-app-frontend-staging \
  --region us-west1 \
  --project=majong-app-staging \
  --format='value(status.url)')

echo "Frontend URL: $FRONTEND_URL"
```

#### 6.2 ブラウザでの動作確認

1. フロントエンドURLにアクセス
2. プレイヤー一覧が表示されることを確認
3. セッション一覧が表示されることを確認
4. 半荘一覧が表示されることを確認
5. 500エラーが発生していないことを確認

**確認事項:**
- [ ] フロントエンドが正常に表示されること
- [ ] API呼び出しが正常に動作すること
- [ ] 500エラーが発生していないこと

## テスト結果の記録

### テスト結果テンプレート

```markdown
## テスト実行日: YYYY-MM-DD

### 1. デプロイワークフローの構文チェック
- [ ] YAML構文エラーなし
- [ ] GitHub Actionsのワークフロー構文が正しい
- [ ] 環境変数の参照が正しい

### 2. デプロイの実行
- [ ] デプロイが正常に完了
- [ ] Cloud SQLインスタンスの接続名が正しく取得されている
- [ ] `--add-cloudsql-instances`フラグが正しく設定されている
- [ ] DATABASE_URLの接続文字列が正しい形式になっている

### 3. デプロイ後の動作確認
- [ ] Cloud Runサービスが正常に起動
- [ ] 環境変数が正しく設定されている
- [ ] Cloud SQL Proxy接続が正しく設定されている

### 4. ログの確認
- [ ] データベース接続エラーが発生していない
- [ ] Prismaクライアントの初期化が成功している

### 5. APIエンドポイントの動作確認
- [ ] ヘルスチェックエンドポイントが正常に動作
- [ ] プレイヤー一覧取得APIが正常に動作
- [ ] セッション一覧取得APIが正常に動作
- [ ] 半荘一覧取得APIが正常に動作

### 6. フロントエンドからの動作確認
- [ ] フロントエンドが正常に表示される
- [ ] API呼び出しが正常に動作する
- [ ] 500エラーが発生していない

### テスト結果
- **ステータス**: ✅ 成功 / ❌ 失敗
- **備考**: （問題があれば記載）
```

## トラブルシューティング

### 問題1: 接続名が取得できない

**症状:**
- デプロイ時に`gcloud sql instances describe`コマンドが失敗する

**確認事項:**
- Cloud SQLインスタンスが存在するか確認
- サービスアカウントに`roles/cloudsql.viewer`権限があるか確認

**解決方法:**
```bash
# 権限を付与
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
  --role="roles/cloudsql.viewer"
```

### 問題2: Cloud SQL Proxy接続エラー

**症状:**
- データベース接続エラーが発生する
- `ECONNREFUSED`エラーが表示される

**確認事項:**
- `--add-cloudsql-instances`フラグが正しく設定されているか確認
- DATABASE_URLの接続文字列が`/cloudsql/CONNECTION_NAME`形式になっているか確認

**解決方法:**
- デプロイワークフローの`--add-cloudsql-instances`フラグを確認
- DATABASE_URLの接続文字列を確認

### 問題3: 権限エラー

**症状:**
- Cloud RunサービスアカウントにCloud SQL接続権限がない

**確認事項:**
- Cloud Runサービスアカウントに`roles/cloudsql.client`権限があるか確認

**解決方法:**
```bash
# 権限を付与
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
  --role="roles/cloudsql.client"
```

## 参考資料

- [Cloud SQL Proxy ドキュメント](https://cloud.google.com/sql/docs/postgres/sql-proxy)
- [Cloud Run から Cloud SQL への接続](https://cloud.google.com/sql/docs/postgres/connect-run)
- [設計書: `design/infrastructure/cloud-sql-proxy-connection.md`](../../design/infrastructure/cloud-sql-proxy-connection.md)

