# Cloud SQL Proxy設定を正しく適用する方法（PowerShell）

## 問題

`gcloud run services update`で`--add-cloudsql-instances`を使用しても、設定が`null`のままです。

## 解決方法

### 方法1: `--set-cloudsql-instances`を使用（推奨）

`--add-cloudsql-instances`ではなく、`--set-cloudsql-instances`を使用します：

```powershell
# 接続名を取得
$CONNECTION_NAME = gcloud sql instances describe majong-app-db-staging --project=majong-app-staging --format='value(connectionName)'

# Cloud Runサービスを更新してCloud SQL Proxyを有効化
gcloud run services update majong-app-backend-staging `
  --region us-west1 `
  --project=majong-app-staging `
  --set-cloudsql-instances $CONNECTION_NAME
```

### 方法2: 完全なサービス設定を更新

環境変数とCloud SQL Proxy設定を同時に更新します：

```powershell
# 接続名を取得
$CONNECTION_NAME = gcloud sql instances describe majong-app-db-staging --project=majong-app-staging --format='value(connectionName)'

# 現在の環境変数を取得（DATABASE_URLを更新するため）
$CURRENT_ENV = gcloud run services describe majong-app-backend-staging --region us-west1 --project=majong-app-staging --format="value(spec.template.spec.containers[0].env)"

# Cloud Runサービスを更新（環境変数とCloud SQL Proxy設定を同時に更新）
gcloud run services update majong-app-backend-staging `
  --region us-west1 `
  --project=majong-app-staging `
  --set-cloudsql-instances $CONNECTION_NAME `
  --update-env-vars "DATABASE_URL=postgresql://majong_user:F2BTec4PlZjKv9qsQkrISW3ybXViwYfh@/majong_db?host=/cloudsql/$CONNECTION_NAME"
```

### 方法3: 最新のデプロイワークフローで再デプロイ（推奨）

デプロイワークフローに`--add-cloudsql-instances`フラグが正しく設定されているので、最新のコードで再デプロイしてください：

```bash
# stagingブランチにプッシュして再デプロイ
git add .
git commit -m "Fix: Update Cloud SQL Proxy configuration"
git push origin staging
```

## 確認方法

更新後、以下のコマンドで確認してください：

```powershell
# Cloud SQL Proxy設定を確認
gcloud run services describe majong-app-backend-staging --region us-west1 --project=majong-app-staging --format="yaml(spec.template.spec.containers[0].cloudSqlInstances)"
```

**期待結果:**
- `null`ではなく、`majong-app-staging:us-west1:majong-app-db-staging`が表示されること

## 注意事項

- `--add-cloudsql-instances`は既存の設定に追加するフラグですが、設定が`null`の場合は適用されない可能性があります
- `--set-cloudsql-instances`は設定を上書きするフラグで、より確実に設定を適用できます


