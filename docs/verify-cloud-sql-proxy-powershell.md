# Cloud SQL Proxy設定の確認方法（PowerShell）

## 問題

`gcloud run services describe`で`cloudSqlInstances`が空と表示される場合でも、実際には設定されている可能性があります。

## 確認方法

### 方法1: YAML形式で確認

```powershell
# YAML形式でCloud SQL Proxy設定を確認
gcloud run services describe majong-app-backend-staging --region us-west1 --project=majong-app-staging --format="yaml(spec.template.spec.containers[0].cloudSqlInstances)"
```

### 方法2: JSON形式で確認

```powershell
# JSON形式でCloud SQL Proxy設定を確認
gcloud run services describe majong-app-backend-staging --region us-west1 --project=majong-app-staging --format="json(spec.template.spec.containers[0].cloudSqlInstances)"
```

### 方法3: サービス全体の設定を確認

```powershell
# サービス全体の設定を確認（Cloud SQL Proxy設定を含む）
gcloud run services describe majong-app-backend-staging --region us-west1 --project=majong-app-staging --format="yaml" | Select-String -Pattern "cloudSqlInstances" -Context 2,2
```

### 方法4: 実際の動作確認（推奨）

設定が正しく適用されているかは、実際にAPIが動作するかで確認できます：

```powershell
# APIエンドポイントをテスト
curl -X GET "https://majong-app-backend-staging-323648023154.us-west1.run.app/api/players" -H "accept: application/json"
```

**期待結果:**
- ステータスコード200が返ること
- プレイヤー一覧のJSONが返ること（空の配列`[]`でもOK）

## トラブルシューティング

### まだエラーが発生する場合

1. **サービスアカウントの権限を確認**
   ```powershell
   $PROJECT_NUMBER = gcloud projects describe majong-app-staging --format='value(projectNumber)'
   $SERVICE_ACCOUNT_EMAIL = "$PROJECT_NUMBER-compute@developer.gserviceaccount.com"
   gcloud projects get-iam-policy majong-app-staging --flatten="bindings[].members" --filter="bindings.members:$SERVICE_ACCOUNT_EMAIL" --format="table(bindings.role)"
   ```

2. **ログを確認**
   ```powershell
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=majong-app-backend-staging AND severity>=ERROR" --limit 10 --format json --project=majong-app-staging
   ```

3. **サービスを再起動**
   ```powershell
   gcloud run services update majong-app-backend-staging --region us-west1 --project=majong-app-staging
   ```


