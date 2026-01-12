# 手動でデータベースマイグレーションを実行する方法

## 方法1: Cloud Run Jobを使用（推奨）

### ステップ1: 接続名を取得

```powershell
$CONNECTION_NAME = gcloud sql instances describe majong-app-db-staging --project=majong-app-staging --format='value(connectionName)'
echo "Connection Name: $CONNECTION_NAME"
```

### ステップ2: 最新のバックエンドイメージを確認

```powershell
# 最新のイメージタグを確認
gcloud container images list-tags gcr.io/majong-app-staging/majong-app-backend --limit=1 --format="value(tags[0])"
```

### ステップ3: Cloud Run Jobでマイグレーションを実行

```powershell
# 最新のイメージを使用（例: latest または 特定のコミットSHA）
$IMAGE_TAG = "latest"  # または特定のタグ（例: "abc123"）

gcloud run jobs deploy majong-app-migrate-staging `
  --image gcr.io/majong-app-staging/majong-app-backend:$IMAGE_TAG `
  --region us-west1 `
  --set-cloudsql-instances $CONNECTION_NAME `
  --set-env-vars "NODE_ENV=staging,DATABASE_URL=postgresql://majong_user:YOUR_PASSWORD@/majong_db?host=/cloudsql/$CONNECTION_NAME" `
  --vpc-connector staging-connector `
  --vpc-egress all-traffic `
  --command "npx" `
  --args "prisma,migrate,deploy" `
  --execute-now `
  --wait
```

**注意:** `YOUR_PASSWORD`を実際のパスワードに置き換えてください。セキュリティのため、環境変数やシークレットマネージャーから取得することを推奨します。

### ステップ4: 実行結果を確認

```powershell
# ジョブの実行履歴を確認
gcloud run jobs executions list --job=majong-app-migrate-staging --region=us-west1 --project=majong-app-staging --limit=1

# ログを確認
gcloud logging read "resource.type=cloud_run_job AND resource.labels.job_name=majong-app-migrate-staging" --limit=50 --project=majong-app-staging --format="value(textPayload)"
```

## 方法2: ローカルでCloud SQL Proxyを使用

### ステップ1: Cloud SQL Proxyをダウンロード（初回のみ）

```powershell
# Windows用のCloud SQL Proxyをダウンロード
$PROXY_VERSION = "2.8.0"
Invoke-WebRequest -Uri "https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v$PROXY_VERSION/cloud-sql-proxy.x64.exe" -OutFile "cloud-sql-proxy.exe"
```

### ステップ2: Cloud SQL Proxyを起動

```powershell
# 接続名を取得
$CONNECTION_NAME = gcloud sql instances describe majong-app-db-staging --project=majong-app-staging --format='value(connectionName)'

# Cloud SQL Proxyを起動（別のPowerShellウィンドウで実行）
.\cloud-sql-proxy.exe $CONNECTION_NAME
```

### ステップ3: マイグレーションを実行

Cloud SQL Proxyが起動した状態で、別のPowerShellウィンドウで：

```powershell
cd backend

# DATABASE_URLを設定（ローカル接続用）
$env:DATABASE_URL = "postgresql://majong_user:YOUR_PASSWORD@localhost:5432/majong_db?schema=public"

# マイグレーションを実行
npx prisma migrate deploy
```

**注意:** 
- Cloud SQL Proxyは`localhost:5432`でPostgreSQLに接続を提供します
- `YOUR_PASSWORD`を実際のパスワードに置き換えてください

## 方法3: gcloud sql connectを使用（直接SQL実行）

Prismaマイグレーションではなく、直接SQLを実行する場合：

```powershell
# Cloud SQLに接続
gcloud sql connect majong-app-db-staging --user=majong_user --project=majong-app-staging

# 接続後、SQLを実行
# \c majong_db
# \dt  -- テーブル一覧を確認
```

ただし、この方法ではPrismaのマイグレーションファイルは実行されません。

## 推奨方法

**方法1（Cloud Run Job）**を推奨します：
- VPCコネクタ経由で安全に接続できる
- 本番環境と同じ環境で実行される
- ログがCloud Loggingに記録される
- 実行履歴が残る

## トラブルシューティング

### エラー: "The table public.Player does not exist"

マイグレーションが実行されていない可能性があります。上記の方法1または方法2でマイグレーションを実行してください。

### エラー: "connection refused" または "timeout"

- Cloud SQL Proxyが正しく起動しているか確認
- VPCコネクタが正しく設定されているか確認
- ファイアウォールルールが正しく設定されているか確認

### マイグレーションの状態を確認

```powershell
# Prismaマイグレーションの状態を確認（ローカルで実行）
cd backend
npx prisma migrate status
```

