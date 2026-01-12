# Cloud SQL Proxyタイムアウトエラーの解決方法

## エラーメッセージ

```
Cloud SQL connection failed. Please see https://cloud.google.com/sql/docs/mysql/connect-run, https://cloud.google.com/sql/docs/postgres/connect-run, or https://cloud.google.com/sql/docs/sqlserver/connect-run for additional details: dial error: failed to dial (connection name = "majong-app-staging:us-west1:majong-app-db-staging"): connection to Cloud SQL instance at 10.103.0.3:3307 failed: timed out after 10s
```

## 問題の原因

このエラーは、Cloud SQL Proxy設定が正しく反映されていないことを示しています。エラーメッセージに`10.103.0.3:3307`が表示されているということは、アプリケーションがプライベートIP接続を試みており、Cloud SQL Proxy経由のUnixソケット接続を使用していないことを意味します。

## 解決方法

### 方法1: 即座に修正（CLIで設定を更新）

PowerShellで以下のコマンドを実行して、Cloud SQL Proxy設定を強制的に更新します：

```powershell
# ステップ1: 接続名を取得
$CONNECTION_NAME = gcloud sql instances describe majong-app-db-staging --project=majong-app-staging --format='value(connectionName)'
echo "Connection Name: $CONNECTION_NAME"

# ステップ2: Cloud SQL Proxy設定を強制的に設定
gcloud run services update majong-app-backend-staging `
  --region us-west1 `
  --project=majong-app-staging `
  --set-cloudsql-instances $CONNECTION_NAME

# ステップ3: 設定を確認（数秒待ってから実行）
Start-Sleep -Seconds 5
gcloud run services describe majong-app-backend-staging --region us-west1 --project=majong-app-staging --format="yaml(spec.template.spec.containers[0].cloudSqlInstances)"
```

**重要:** `--set-cloudsql-instances`を使用してください（`--add-cloudsql-instances`ではなく）。`--set-cloudsql-instances`は設定を上書きするため、`null`の状態からでも確実に設定できます。

### 方法2: GUIで設定（最も確実）

Google Cloud Consoleで設定を追加することを推奨します：

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. プロジェクトを`majong-app-staging`に切り替え
3. 左側のメニューから「**Cloud Run**」を選択
4. サービス一覧から「**majong-app-backend-staging**」をクリック
5. ページ上部の「**編集と新しいリビジョンをデプロイ**」ボタンをクリック
6. 「**接続**」タブをクリック
7. 「**Cloud SQL接続**」セクションを展開
8. 「**Cloud SQLインスタンスを追加**」をクリック
9. ドロップダウンから「**majong-app-db-staging**」を選択
10. 「**完了**」をクリック
11. ページ下部の「**デプロイ**」ボタンをクリック

詳細は`docs/fix-cloudsql-instances-gui.md`を参照してください。

### 方法3: デプロイワークフローで再デプロイ

デプロイワークフロー（`.github/workflows/deploy.yml`）を修正して、`--add-cloudsql-instances`を`--set-cloudsql-instances`に変更しました。最新のコードで再デプロイしてください：

```bash
# stagingブランチにプッシュして再デプロイ
git add .github/workflows/deploy.yml
git commit -m "Fix: Use --set-cloudsql-instances instead of --add-cloudsql-instances"
git push origin staging
```

## 確認手順

### 1. Cloud SQL Proxy設定の確認

```powershell
gcloud run services describe majong-app-backend-staging --region us-west1 --project=majong-app-staging --format="yaml(spec.template.spec.containers[0].cloudSqlInstances)"
```

**期待結果:**
- `majong-app-staging:us-west1:majong-app-db-staging`が表示されること
- `null`ではないこと

### 2. DATABASE_URL環境変数の確認

```powershell
gcloud run services describe majong-app-backend-staging --region us-west1 --project=majong-app-staging --format="value(spec.template.spec.containers[0].env)" | Select-String "DATABASE_URL"
```

**期待結果:**
- `postgresql://majong_user:...@/majong_db?host=/cloudsql/majong-app-staging:us-west1:majong-app-db-staging`形式になっていること
- ポート番号（`:5432`など）が含まれていないこと
- IPアドレス（`10.103.0.3`など）が含まれていないこと

### 3. サービスアカウントの権限確認

```powershell
$PROJECT_NUMBER = gcloud projects describe majong-app-staging --format='value(projectNumber)'
$SERVICE_ACCOUNT_EMAIL = "$PROJECT_NUMBER-compute@developer.gserviceaccount.com"
gcloud projects get-iam-policy majong-app-staging --flatten="bindings[].members" --filter="bindings.members:$SERVICE_ACCOUNT_EMAIL" --format="table(bindings.role)"
```

**期待結果:**
- `roles/cloudsql.client`が表示されること

### 4. APIのテスト

設定を更新した後、数秒待ってからAPIをテストしてください：

```powershell
curl -X GET "https://majong-app-backend-staging-323648023154.us-west1.run.app/api/players" -H "accept: application/json"
```

**期待結果:**
- ステータスコード200が返ること
- エラーメッセージが表示されないこと

## よくある問題

### 問題1: `--add-cloudsql-instances`が動作しない

**原因:**
- `--add-cloudsql-instances`は既存の設定に追加するため、`null`の状態からは設定できない場合があります

**解決方法:**
- `--set-cloudsql-instances`を使用して設定を上書きする

### 問題2: DATABASE_URLが正しくない形式

**症状:**
- DATABASE_URLにポート番号やIPアドレスが含まれている

**解決方法:**
- DATABASE_URLを`postgresql://USER:PASSWORD@/DATABASE?host=/cloudsql/CONNECTION_NAME`形式に修正
- 詳細は`docs/expected-database-url-format.md`を参照

### 問題3: サービスアカウントに権限がない

**症状:**
- `roles/cloudsql.client`が表示されない

**解決方法:**
- 権限を付与：
```powershell
$PROJECT_NUMBER = gcloud projects describe majong-app-staging --format='value(projectNumber)'
$SERVICE_ACCOUNT_EMAIL = "$PROJECT_NUMBER-compute@developer.gserviceaccount.com"
gcloud projects add-iam-policy-binding majong-app-staging --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" --role="roles/cloudsql.client"
```

## 参考資料

- [Cloud SQL Proxy ドキュメント](https://cloud.google.com/sql/docs/postgres/sql-proxy)
- [Cloud Run から Cloud SQL への接続](https://cloud.google.com/sql/docs/postgres/connect-run)
- [Unix ソケット接続](https://cloud.google.com/sql/docs/postgres/connect-run#unix-sockets)
- `docs/check-current-cloudsql-config-powershell.md` - 現在の設定を確認する方法
- `docs/fix-cloudsql-instances-gui.md` - GUIで設定を追加する方法
- `docs/expected-database-url-format.md` - DATABASE_URLの正しい形式


