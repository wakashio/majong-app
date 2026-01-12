# Cloud SQL Proxy設定がnullのままのトラブルシューティング（PowerShell）

## 問題

`--set-cloudsql-instances`コマンドを実行しても、設定が`null`のままです。

## 確認手順

### 1. サービス全体の設定を確認

```powershell
# サービス全体の設定を確認（Cloud SQL Proxy設定を含む）
gcloud run services describe majong-app-backend-staging --region us-west1 --project=majong-app-staging --format="yaml" | Select-String -Pattern "cloudSqlInstances" -Context 3,3
```

### 2. JSON形式で確認

```powershell
# JSON形式でCloud SQL Proxy設定を確認
gcloud run services describe majong-app-backend-staging --region us-west1 --project=majong-app-staging --format="json" | ConvertFrom-Json | Select-Object -ExpandProperty spec | Select-Object -ExpandProperty template | Select-Object -ExpandProperty spec | Select-Object -ExpandProperty containers | Select-Object -First 1 | Select-Object -ExpandProperty cloudSqlInstances
```

### 3. 最新のリビジョンの設定を確認

```powershell
# 最新のリビジョン名を取得
$LATEST_REVISION = gcloud run services describe majong-app-backend-staging --region us-west1 --project=majong-app-staging --format="value(status.latestReadyRevisionName)"
echo "Latest Revision: $LATEST_REVISION"

# リビジョンの設定を確認
gcloud run revisions describe $LATEST_REVISION --region us-west1 --project=majong-app-staging --format="yaml(spec.containers[0].cloudSqlInstances)"
```

## 解決方法

### 方法1: コマンドを1行ずつ実行

PowerShellで複数行のコマンドが正しく実行されない場合があります。1行ずつ実行してください：

```powershell
# ステップ1: 接続名を取得
$CONNECTION_NAME = gcloud sql instances describe majong-app-db-staging --project=majong-app-staging --format='value(connectionName)'

# ステップ2: 接続名を確認
echo "Connection Name: $CONNECTION_NAME"

# ステップ3: Cloud SQL Proxy設定を設定（1行で実行）
gcloud run services update majong-app-backend-staging --region us-west1 --project=majong-app-staging --set-cloudsql-instances $CONNECTION_NAME
```

### 方法2: 環境変数と同時に更新

環境変数とCloud SQL Proxy設定を同時に更新します：

```powershell
# 接続名を取得
$CONNECTION_NAME = gcloud sql instances describe majong-app-db-staging --project=majong-app-staging --format='value(connectionName)'

# 現在の環境変数を取得
$CURRENT_ENV = gcloud run services describe majong-app-backend-staging --region us-west1 --project=majong-app-staging --format="value(spec.template.spec.containers[0].env)"

# Cloud SQL Proxy設定と環境変数を同時に更新
gcloud run services update majong-app-backend-staging --region us-west1 --project=majong-app-staging --set-cloudsql-instances $CONNECTION_NAME --update-env-vars "NODE_ENV=staging,DATABASE_URL=postgresql://majong_user:パスワード@/majong_db?host=/cloudsql/$CONNECTION_NAME"
```

### 方法3: サービスを完全に再デプロイ

最新のデプロイワークフローで再デプロイします：

```bash
# stagingブランチにプッシュして再デプロイ
git add .
git commit -m "Fix: Update Cloud SQL Proxy configuration"
git push origin staging
```

## 考えられる原因

### 原因1: コマンドの実行方法

PowerShellで複数行のコマンドが正しく実行されていない可能性があります。

**解決方法:**
- コマンドを1行ずつ実行する
- バッククォート（`）の代わりに、1行で実行する

### 原因2: サービス設定の更新タイミング

設定が反映されるまで時間がかかる可能性があります。

**解決方法:**
- 数分待ってから再度確認する
- 新しいリビジョンがデプロイされているか確認する

### 原因3: 権限の問題

サービスアカウントに必要な権限がない可能性があります。

**確認方法:**
```powershell
# 現在のプロジェクトを確認
gcloud config get-value project

# サービスアカウントの権限を確認
$PROJECT_NUMBER = gcloud projects describe majong-app-staging --format='value(projectNumber)'
$SERVICE_ACCOUNT_EMAIL = "$PROJECT_NUMBER-compute@developer.gserviceaccount.com"
gcloud projects get-iam-policy majong-app-staging --flatten="bindings[].members" --filter="bindings.members:$SERVICE_ACCOUNT_EMAIL" --format="table(bindings.role)"
```

## 確認コマンド

設定を追加した後、以下のコマンドで確認してください：

```powershell
# 最新のリビジョンの設定を確認
$LATEST_REVISION = gcloud run services describe majong-app-backend-staging --region us-west1 --project=majong-app-staging --format="value(status.latestReadyRevisionName)"
gcloud run revisions describe $LATEST_REVISION --region us-west1 --project=majong-app-staging --format="yaml(spec.containers[0].cloudSqlInstances)"
```

期待結果:
- `null`ではなく、`majong-app-staging:us-west1:majong-app-db-staging`が表示されること


