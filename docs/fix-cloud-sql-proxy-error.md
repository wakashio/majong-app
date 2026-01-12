# Cloud SQL Proxy接続エラーの解決方法

## エラーメッセージの分析

```
dial error: failed to dial (connection name = "majong-app-staging:us-west1:majong-app-db-staging"): 
connection to Cloud SQL instance at 10.103.0.3:3307 failed: timed out after 10s
```

### 問題点

1. **`10.103.0.3:3307`への接続を試みている**
   - `10.103.0.3`はプライベートIPアドレス
   - `3307`はMySQLのポート番号（PostgreSQLは5432）
   - Cloud SQL Proxyを使用する場合、Unixソケット経由で接続するため、IPアドレスやポート番号は使用しません

2. **Cloud SQL Proxyが正しく動作していない**
   - このエラーは、Cloud SQL Proxyが有効化されていない、または正しく設定されていないことを示しています
   - Cloud SQL Proxyが正しく動作していれば、Unixソケット経由で接続するため、このようなエラーは発生しません

## 解決方法

### ステップ1: Cloud SQL Proxy設定を確認

```powershell
# Cloud SQL Proxy設定を確認
gcloud run services describe majong-app-backend-staging --region us-west1 --project=majong-app-staging --format="yaml(spec.template.spec.containers[0].cloudSqlInstances)"
```

**期待結果:**
- `null`ではなく、`majong-app-staging:us-west1:majong-app-db-staging`が表示されること

### ステップ2: Cloud SQL Proxy設定が`null`の場合

GUIでCloud SQL Proxy設定を追加してください：

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. プロジェクトを`majong-app-staging`に切り替え
3. 「Cloud Run」→「majong-app-backend-staging」を開く
4. 「編集と新しいリビジョンをデプロイ」をクリック
5. 「接続」タブを開く
6. 「Cloud SQL接続」セクションで「Cloud SQLインスタンスを追加」をクリック
7. `majong-app-db-staging`を選択（または接続名`majong-app-staging:us-west1:majong-app-db-staging`を入力）
8. 「デプロイ」をクリック

### ステップ3: DATABASE_URLを確認

```powershell
# DATABASE_URLを確認
gcloud run services describe majong-app-backend-staging --region us-west1 --project=majong-app-staging --format="value(spec.template.spec.containers[0].env)" | Select-String "DATABASE_URL"
```

**確認事項:**
- ポート番号（`:5432`や`:3307`）が含まれていないか
- IPアドレス（`10.103.0.3`など）が含まれていないか
- 接続文字列が`postgresql://user:password@/database?host=/cloudsql/CONNECTION_NAME`形式になっているか

### ステップ4: DATABASE_URLが正しくない場合の修正

```powershell
# 接続名を取得
$CONNECTION_NAME = gcloud sql instances describe majong-app-db-staging --project=majong-app-staging --format='value(connectionName)'

# DATABASE_URLを更新（正しい形式）
gcloud run services update majong-app-backend-staging `
  --region us-west1 `
  --project=majong-app-staging `
  --update-env-vars "DATABASE_URL=postgresql://majong_user:パスワード@/majong_db?host=/cloudsql/$CONNECTION_NAME"
```

## 重要なポイント

### Cloud SQL Proxyが正しく動作している場合

- Unixソケット経由で接続するため、IPアドレスやポート番号は使用しません
- 接続文字列は`postgresql://user:password@/database?host=/cloudsql/CONNECTION_NAME`形式になります
- エラーログには`10.103.0.3:3307`のようなIPアドレスやポート番号は表示されません

### Cloud SQL Proxyが動作していない場合

- プライベートIPアドレスへの接続を試みます
- エラーログに`10.103.0.3:3307`のようなIPアドレスとポート番号が表示されます
- 接続がタイムアウトします

## 確認手順

### 1. Cloud SQL Proxy設定を確認

```powershell
gcloud run services describe majong-app-backend-staging --region us-west1 --project=majong-app-staging --format="yaml(spec.template.spec.containers[0].cloudSqlInstances)"
```

### 2. DATABASE_URLを確認

```powershell
gcloud run services describe majong-app-backend-staging --region us-west1 --project=majong-app-staging --format="value(spec.template.spec.containers[0].env)" | Select-String "DATABASE_URL"
```

### 3. サービスアカウントの権限を確認

```powershell
$PROJECT_NUMBER = gcloud projects describe majong-app-staging --format='value(projectNumber)'
$SERVICE_ACCOUNT_EMAIL = "$PROJECT_NUMBER-compute@developer.gserviceaccount.com"
gcloud projects get-iam-policy majong-app-staging --flatten="bindings[].members" --filter="bindings.members:$SERVICE_ACCOUNT_EMAIL" --format="table(bindings.role)"
```

## 解決の優先順位

1. **最優先**: Cloud SQL Proxy設定を追加（GUIで設定）
2. **次**: DATABASE_URLが正しい形式になっているか確認
3. **最後**: サービスアカウントの権限を確認（既に確認済みで問題なし）

## 参考資料

- [Cloud SQL Proxy ドキュメント](https://cloud.google.com/sql/docs/postgres/sql-proxy)
- [Cloud Run から Cloud SQL への接続](https://cloud.google.com/sql/docs/postgres/connect-run)
- [Unix ソケット接続](https://cloud.google.com/sql/docs/postgres/connect-run#unix-sockets)


