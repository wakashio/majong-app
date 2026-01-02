# トラブルシューティングガイド

## Cloud Runのログ確認方法

### ステージング環境のログを確認

#### Bash/Git Bashの場合

```bash
# 最新の50件のログを取得（JSON形式）
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=majong-app-backend-staging" \
  --limit 50 \
  --format json \
  --project=majong-app-staging

# エラーログのみを取得
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=majong-app-backend-staging AND severity>=ERROR" \
  --limit 50 \
  --format json \
  --project=majong-app-staging

# 人間が読みやすい形式で表示
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=majong-app-backend-staging" \
  --limit 50 \
  --format "table(timestamp,severity,textPayload,jsonPayload.message)" \
  --project=majong-app-staging
```

#### PowerShellの場合

```powershell
# 最新の50件のログを取得（JSON形式）
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=majong-app-backend-staging" --limit 50 --format json --project=majong-app-staging

# エラーログのみを取得
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=majong-app-backend-staging AND severity>=ERROR" --limit 50 --format json --project=majong-app-staging

# 人間が読みやすい形式で表示
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=majong-app-backend-staging" --limit 50 --format "table(timestamp,severity,textPayload,jsonPayload.message)" --project=majong-app-staging
```

### 本番環境のログを確認

#### Bash/Git Bashの場合

```bash
# 最新の50件のログを取得
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=majong-app-backend-production" \
  --limit 50 \
  --format json \
  --project=majong-app-production
```

#### PowerShellの場合

```powershell
# 最新の50件のログを取得
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=majong-app-backend-production" --limit 50 --format json --project=majong-app-production
```

### 特定の時間範囲のログを確認

#### Bash/Git Bashの場合

```bash
# 過去1時間のログ
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=majong-app-backend-staging" \
  --limit 100 \
  --format json \
  --project=majong-app-staging \
  --freshness=1h
```

#### PowerShellの場合

```powershell
# 過去1時間のログ
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=majong-app-backend-staging" --limit 100 --format json --project=majong-app-staging --freshness=1h
```

## よくあるエラーと解決方法

### 1. データベース接続エラー

**エラーメッセージ例:**
- `Error: connect ECONNREFUSED`
- `Error: Can't reach database server`
- `Prisma Client initialization error`

**確認事項:**
1. DATABASE_URLが正しく設定されているか
2. Cloud SQLインスタンスが起動しているか
3. VPCコネクタまたはCloud SQL Proxyが設定されているか

**解決方法:**
- Cloud SQL Proxyを使用する場合: `--add-cloudsql-instances` フラグを追加
- VPCコネクタを使用する場合: VPCコネクタが正しく設定されているか確認

### 2. 500 Internal Server Error

**確認手順:**
1. Cloud Runのログを確認してエラー詳細を特定
2. エラーハンドリングミドルウェアのログを確認
3. Prismaクライアントの初期化ログを確認

**ログで確認すべき項目:**
- `=== Error Handler ===` で始まるエラーログ
- `=== Prisma Client Initialization ===` で始まるログ
- `=== Prisma Connection Error ===` で始まるログ

### 3. 環境変数の問題

**確認方法:**

#### Bash/Git Bashの場合

```bash
# Cloud Runサービスの環境変数を確認
gcloud run services describe majong-app-backend-staging \
  --region us-west1 \
  --project=majong-app-staging \
  --format="value(spec.template.spec.containers[0].env)"
```

#### PowerShellの場合

```powershell
# Cloud Runサービスの環境変数を確認
gcloud run services describe majong-app-backend-staging --region us-west1 --project=majong-app-staging --format="value(spec.template.spec.containers[0].env)"
```

## デバッグのヒント

1. **エラーハンドリングミドルウェア**: 詳細なエラーログが出力されます
2. **Prismaクライアント**: 初期化時のログで接続情報を確認できます
3. **Cloud Runのログ**: リアルタイムでログを確認できます

## ログの見方

### エラーハンドリングミドルウェアのログ形式

```
=== Error Handler ===
Request URL: /api/players
Request Method: GET
Request Body: {...}
Error: [エラー内容]
Error Name: [エラー名]
Error Message: [エラーメッセージ]
Error Stack: [スタックトレース]
```

### Prismaクライアントのログ形式

```
=== Prisma Client Initialization ===
NODE_ENV: staging
DATABASE_URL exists: true
DATABASE_URL (masked): postgresql://user:****@host:5432/db
Prisma Client initialized successfully
```

## 次のステップ

ログを確認したら、エラーの内容に基づいて適切な解決方法を選択してください。

