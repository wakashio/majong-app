# Cloud SQL Proxy設定を修正する方法（PowerShell）

## 問題

Cloud Runサービスの`cloudSqlInstances`設定が空で、Cloud SQL Proxyが有効化されていません。

## 解決方法

### 方法1: 手動でCloud Runサービスを更新（即座に修正）

```powershell
# 接続名を取得
$CONNECTION_NAME = gcloud sql instances describe majong-app-db-staging --project=majong-app-staging --format='value(connectionName)'

# Cloud Runサービスを更新してCloud SQL Proxyを有効化
gcloud run services update majong-app-backend-staging `
  --region us-west1 `
  --project=majong-app-staging `
  --add-cloudsql-instances $CONNECTION_NAME
```

### 方法2: 最新のデプロイワークフローで再デプロイ

デプロイワークフローに`--add-cloudsql-instances`フラグが追加されているので、最新のコードで再デプロイしてください。

```bash
# stagingブランチにプッシュして再デプロイ
git add .
git commit -m "Fix: Add Cloud SQL Proxy configuration"
git push origin staging
```

## 確認方法

### Cloud SQL Proxy設定の確認

```powershell
# Cloud SQL Proxy設定を確認
gcloud run services describe majong-app-backend-staging --region us-west1 --project=majong-app-staging --format="value(spec.template.spec.containers[0].cloudSqlInstances)"
```

**期待結果:**
- `majong-app-staging:us-west1:majong-app-db-staging`が表示されること

### サービスアカウントの権限確認

```powershell
# サービスアカウントのメールアドレスを取得
$PROJECT_NUMBER = gcloud projects describe majong-app-staging --format='value(projectNumber)'
$SERVICE_ACCOUNT_EMAIL = "$PROJECT_NUMBER-compute@developer.gserviceaccount.com"

# 権限を確認
gcloud projects get-iam-policy majong-app-staging --flatten="bindings[].members" --filter="bindings.members:$SERVICE_ACCOUNT_EMAIL" --format="table(bindings.role)"
```

**確認事項:**
- `roles/cloudsql.client`が表示されること

## 修正後の確認

修正後、以下のコマンドでAPIが正常に動作するか確認してください：

```powershell
# APIエンドポイントをテスト
curl -X GET "https://majong-app-backend-staging-xnzmyhq26q-uw.a.run.app/api/players" -H "accept: application/json"
```

**期待結果:**
- ステータスコード200が返ること
- プレイヤー一覧のJSONが返ること


