# Cloud SQL Proxy設定の現在の状態を確認する方法（PowerShell）

## 問題の症状

エラーログに以下のメッセージが表示される：
```
Cloud SQL connection failed. Please see https://cloud.google.com/sql/docs/mysql/connect-run, https://cloud.google.com/sql/docs/postgres/connect-run, or https://cloud.google.com/sql/docs/sqlserver/connect-run for additional details: dial error: failed to dial (connection name = "majong-app-staging:us-west1:majong-app-db-staging"): connection to Cloud SQL instance at 10.103.0.3:3307 failed: timed out after 10s
```

このエラーは、Cloud SQL Proxy設定が正しく反映されていない可能性を示しています。

## 確認手順

### ステップ1: Cloud SQL Proxy設定を確認

```powershell
# Cloud RunサービスのCloud SQL Proxy設定を確認
gcloud run services describe majong-app-backend-staging --region us-west1 --project=majong-app-staging --format="yaml(spec.template.spec.containers[0].cloudSqlInstances)"
```

**期待結果:**
- `majong-app-staging:us-west1:majong-app-db-staging`が表示されること
- `null`や空の場合は、設定が反映されていません

### ステップ2: DATABASE_URL環境変数を確認

```powershell
# DATABASE_URL環境変数を確認
gcloud run services describe majong-app-backend-staging --region us-west1 --project=majong-app-staging --format="value(spec.template.spec.containers[0].env)" | Select-String "DATABASE_URL"
```

**期待結果:**
- `postgresql://majong_user:...@/majong_db?host=/cloudsql/majong-app-staging:us-west1:majong-app-db-staging`形式になっていること
- ポート番号（`:5432`など）が含まれていないこと
- IPアドレス（`10.103.0.3`など）が含まれていないこと

### ステップ3: サービスアカウントの権限を確認

```powershell
# サービスアカウントのメールアドレスを取得
$PROJECT_NUMBER = gcloud projects describe majong-app-staging --format='value(projectNumber)'
$SERVICE_ACCOUNT_EMAIL = "$PROJECT_NUMBER-compute@developer.gserviceaccount.com"
echo "Service Account: $SERVICE_ACCOUNT_EMAIL"

# 権限を確認
gcloud projects get-iam-policy majong-app-staging --flatten="bindings[].members" --filter="bindings.members:$SERVICE_ACCOUNT_EMAIL" --format="table(bindings.role)"
```

**期待結果:**
- `roles/cloudsql.client`が表示されること

## 問題の診断

### 問題1: Cloud SQL Proxy設定が`null`の場合

**症状:**
- ステップ1の結果が`null`または空

**原因:**
- `--add-cloudsql-instances`が正しく動作していない
- デプロイ時に設定が反映されていない

**解決方法:**
- `--set-cloudsql-instances`を使用して設定を強制的に更新

### 問題2: DATABASE_URLが正しくない形式の場合

**症状:**
- ステップ2の結果にポート番号やIPアドレスが含まれている

**原因:**
- DATABASE_URLがプライベートIP接続形式になっている
- Cloud SQL Proxy用のUnixソケット形式になっていない

**解決方法:**
- DATABASE_URLを`postgresql://USER:PASSWORD@/DATABASE?host=/cloudsql/CONNECTION_NAME`形式に修正

### 問題3: サービスアカウントに権限がない場合

**症状:**
- ステップ3の結果に`roles/cloudsql.client`が表示されない

**原因:**
- Cloud RunサービスアカウントにCloud SQL接続権限が付与されていない

**解決方法:**
- `roles/cloudsql.client`権限を付与

## 次のステップ

確認結果に応じて、以下のドキュメントを参照してください：

1. **Cloud SQL Proxy設定が`null`の場合**: `docs/fix-cloudsql-instances-powershell.md`
2. **DATABASE_URLが正しくない場合**: `docs/expected-database-url-format.md`
3. **権限がない場合**: `docs/debug-cloud-sql-connection.md`


