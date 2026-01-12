# Cloud SQL Proxy設定とログの確認（PowerShell）

## 確認済み
- ✅ サービスアカウントの権限: `roles/cloudsql.client`が付与されている
- ✅ DATABASE_URL: 正しい形式になっている

## 次に確認すべきこと

### 1. Cloud SQL Proxy設定をYAML形式で確認

```powershell
# YAML形式でCloud SQL Proxy設定を確認
gcloud run services describe majong-app-backend-staging --region us-west1 --project=majong-app-staging --format="yaml(spec.template.spec.containers[0].cloudSqlInstances)"
```

**期待結果:**
- `cloudSqlInstances:`の下に`majong-app-staging:us-west1:majong-app-db-staging`が表示されること

### 2. 最新のエラーログを確認

```powershell
# 最新のエラーログを確認（JSON形式）
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=majong-app-backend-staging AND severity>=ERROR" --limit 5 --format json --project=majong-app-staging
```

### 3. より詳細なログを確認（Prisma関連）

```powershell
# Prisma関連のログを確認
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=majong-app-backend-staging AND (textPayload=~'Prisma' OR jsonPayload.message=~'Prisma')" --limit 10 --format json --project=majong-app-staging
```

### 4. データベース接続エラーのログを確認

```powershell
# データベース接続エラーのログを確認
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=majong-app-backend-staging AND (textPayload=~'database' OR textPayload=~'connection' OR textPayload=~'Cloud SQL')" --limit 10 --format json --project=majong-app-staging
```

## 考えられる原因

### 原因1: Cloud SQL Proxy設定が正しく適用されていない

**確認方法:**
- 上記のYAML形式での確認コマンドを実行

**解決方法:**
- 再度`--add-cloudsql-instances`フラグで更新
- または、最新のデプロイワークフローで再デプロイ

### 原因2: 接続文字列の形式に問題がある

**確認方法:**
- DATABASE_URLを再度確認（既に確認済みで正しい形式）

### 原因3: Cloud SQLインスタンスが起動していない

**確認方法:**
```powershell
# Cloud SQLインスタンスの状態を確認
gcloud sql instances describe majong-app-db-staging --project=majong-app-staging --format="value(state)"
```

**期待結果:**
- `RUNNABLE`が表示されること

### 原因4: 接続名が間違っている

**確認方法:**
```powershell
# 接続名を確認
gcloud sql instances describe majong-app-db-staging --project=majong-app-staging --format='value(connectionName)'
```

**期待結果:**
- `majong-app-staging:us-west1:majong-app-db-staging`が表示されること


