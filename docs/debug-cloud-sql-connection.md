# Cloud SQL接続のデバッグ手順

## 問題の症状

エラーログに以下のメッセージが表示される：
```
Cloud SQL connection failed. Please see https://cloud.google.com/sql/docs/mysql/connect-run, https://cloud.google.com/sql/docs/postgres/connect-run, or https://cloud.google.com/sql/docs/sqlserver/connect-run for additional details: dial error: failed to dial (connection name = "majong-app-staging:us-west1:majong-app-db-staging"): connection to Cloud SQL instance at 10.103.0.3:3307 failed: timed out after 10s
```

## 確認手順

### 1. Cloud Runサービスの環境変数を確認

#### Bash/Git Bashの場合

```bash
# ステージング環境
gcloud run services describe majong-app-backend-staging \
  --region us-west1 \
  --project=majong-app-staging \
  --format="value(spec.template.spec.containers[0].env)"
```

#### PowerShellの場合

```powershell
# ステージング環境
gcloud run services describe majong-app-backend-staging --region us-west1 --project=majong-app-staging --format="value(spec.template.spec.containers[0].env)"
```

**確認事項:**
- DATABASE_URLが`postgresql://user:password@/database?host=/cloudsql/CONNECTION_NAME`形式になっているか
- ポート番号（`:5432`など）が含まれていないか

### 2. Cloud SQL Proxy設定を確認

#### Bash/Git Bashの場合

```bash
# Cloud RunサービスのCloud SQL接続設定を確認
gcloud run services describe majong-app-backend-staging \
  --region us-west1 \
  --project=majong-app-staging \
  --format="value(spec.template.spec.containers[0].cloudSqlInstances)"
```

#### PowerShellの場合

```powershell
# Cloud RunサービスのCloud SQL接続設定を確認
gcloud run services describe majong-app-backend-staging --region us-west1 --project=majong-app-staging --format="value(spec.template.spec.containers[0].cloudSqlInstances)"
```

**期待結果:**
- `majong-app-staging:us-west1:majong-app-db-staging`が表示されること

### 3. Cloud Runサービスアカウントの権限を確認

#### Bash/Git Bashの場合

```bash
# サービスアカウントのメールアドレスを取得
PROJECT_NUMBER=$(gcloud projects describe majong-app-staging --format='value(projectNumber)')
SERVICE_ACCOUNT_EMAIL="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# 権限を確認
gcloud projects get-iam-policy majong-app-staging \
  --flatten="bindings[].members" \
  --filter="bindings.members:${SERVICE_ACCOUNT_EMAIL}" \
  --format="table(bindings.role)"
```

#### PowerShellの場合

```powershell
# サービスアカウントのメールアドレスを取得
$PROJECT_NUMBER = gcloud projects describe majong-app-staging --format='value(projectNumber)'
$SERVICE_ACCOUNT_EMAIL = "$PROJECT_NUMBER-compute@developer.gserviceaccount.com"

# 権限を確認
gcloud projects get-iam-policy majong-app-staging --flatten="bindings[].members" --filter="bindings.members:$SERVICE_ACCOUNT_EMAIL" --format="table(bindings.role)"
```

**確認事項:**
- `roles/cloudsql.client`が表示されること

### 4. Cloud SQLインスタンスの設定を確認

#### Bash/Git Bashの場合

```bash
# Cloud SQLインスタンスの詳細を確認
gcloud sql instances describe majong-app-db-staging \
  --project=majong-app-staging \
  --format="yaml(settings.ipConfiguration)"
```

#### PowerShellの場合

```powershell
# Cloud SQLインスタンスの詳細を確認
gcloud sql instances describe majong-app-db-staging --project=majong-app-staging --format="yaml(settings.ipConfiguration)"
```

**確認事項:**
- `ipv4Enabled: false`になっていること（プライベートIPのみ）
- `privateNetwork`が設定されていること

## よくある問題と解決方法

### 問題1: DATABASE_URLにポート番号が含まれている

**症状:**
- 接続文字列が`postgresql://user:password@host:5432/database?host=/cloudsql/...`のようになっている

**解決方法:**
- ポート番号を削除し、`postgresql://user:password@/database?host=/cloudsql/CONNECTION_NAME`形式にする

### 問題2: Cloud SQL Proxy設定が正しくない

**症状:**
- `--add-cloudsql-instances`フラグが設定されていない、または接続名が間違っている

**解決方法:**
- デプロイワークフローで`--add-cloudsql-instances`フラグが正しく設定されているか確認
- 接続名が`PROJECT_ID:REGION:INSTANCE_NAME`形式になっているか確認

### 問題3: 接続文字列の形式が間違っている

**正しい形式:**
```
postgresql://USER:PASSWORD@/DATABASE?host=/cloudsql/CONNECTION_NAME
```

**間違った形式:**
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE
postgresql://USER:PASSWORD@/DATABASE?host=/cloudsql/CONNECTION_NAME&port=5432
```

**解決方法:**
- 接続文字列からホスト名、ポート番号を削除
- `host=/cloudsql/CONNECTION_NAME`のみを使用

### 問題4: Cloud SQLインスタンスがプライベートIPのみで設定されている

**確認方法:**
```bash
gcloud sql instances describe majong-app-db-staging \
  --project=majong-app-staging \
  --format="value(settings.ipConfiguration.ipv4Enabled)"
```

**期待結果:** `False`

**解決方法:**
- Cloud SQL Proxyを使用する場合、プライベートIPのみで問題ありません
- ただし、Cloud Runサービスアカウントに`roles/cloudsql.client`権限が必要です

## 修正手順

### ステップ1: 現在の設定を確認

#### Bash/Git Bashの場合

```bash
# 環境変数を確認
gcloud run services describe majong-app-backend-staging \
  --region us-west1 \
  --project=majong-app-staging \
  --format="value(spec.template.spec.containers[0].env)" | grep DATABASE_URL
```

#### PowerShellの場合

```powershell
# 環境変数を確認
gcloud run services describe majong-app-backend-staging --region us-west1 --project=majong-app-staging --format="value(spec.template.spec.containers[0].env)" | Select-String "DATABASE_URL"
```

### ステップ2: 接続文字列を修正（必要に応じて）

接続文字列が正しくない場合は、デプロイワークフローを修正して再デプロイします。

### ステップ3: 権限を確認・付与

#### Bash/Git Bashの場合

```bash
# 権限を付与（まだ付与されていない場合）
PROJECT_NUMBER=$(gcloud projects describe majong-app-staging --format='value(projectNumber)')
SERVICE_ACCOUNT_EMAIL="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

gcloud projects add-iam-policy-binding majong-app-staging \
  --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/cloudsql.client"
```

#### PowerShellの場合

```powershell
# 権限を付与（まだ付与されていない場合）
$PROJECT_NUMBER = gcloud projects describe majong-app-staging --format='value(projectNumber)'
$SERVICE_ACCOUNT_EMAIL = "$PROJECT_NUMBER-compute@developer.gserviceaccount.com"

gcloud projects add-iam-policy-binding majong-app-staging --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" --role="roles/cloudsql.client"
```

### ステップ4: Cloud Runサービスを再起動

#### Bash/Git Bashの場合

```bash
# サービスを更新（環境変数の変更を反映）
gcloud run services update majong-app-backend-staging \
  --region us-west1 \
  --project=majong-app-staging
```

#### PowerShellの場合

```powershell
# サービスを更新（環境変数の変更を反映）
gcloud run services update majong-app-backend-staging --region us-west1 --project=majong-app-staging
```

## 接続文字列の正しい形式

### Cloud SQL Proxyを使用する場合（推奨）

```
postgresql://USER:PASSWORD@/DATABASE?host=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME
```

**例:**
```
postgresql://majong_user:PASSWORD@/majong_db?host=/cloudsql/majong-app-staging:us-west1:majong-app-db-staging
```

### 重要なポイント

1. **ホスト名を省略**: `@/`の形式で、ホスト名を指定しない
2. **ポート番号を省略**: ポート番号を指定しない
3. **Unixソケットパス**: `host=/cloudsql/CONNECTION_NAME`でUnixソケットパスを指定
4. **接続名の形式**: `PROJECT_ID:REGION:INSTANCE_NAME`形式を使用

## 参考資料

- [Cloud SQL Proxy ドキュメント](https://cloud.google.com/sql/docs/postgres/sql-proxy)
- [Cloud Run から Cloud SQL への接続](https://cloud.google.com/sql/docs/postgres/connect-run)
- [Unix ソケット接続](https://cloud.google.com/sql/docs/postgres/connect-run#unix-sockets)

