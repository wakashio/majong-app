# Cloud SQL Proxy設定を強制的に設定する方法（PowerShell）

## 現在の状況

Cloud SQL Proxy設定が`null`のままです。GUIで追加しても反映されない場合は、CLIで強制的に設定できます。

## 解決方法

### ステップ1: 接続名を取得

```powershell
$CONNECTION_NAME = gcloud sql instances describe majong-app-db-staging --project=majong-app-staging --format='value(connectionName)'
echo "Connection Name: $CONNECTION_NAME"
```

### ステップ2: Cloud SQL Proxy設定を強制的に設定

```powershell
gcloud run services update majong-app-backend-staging `
  --region us-west1 `
  --project=majong-app-staging `
  --set-cloudsql-instances $CONNECTION_NAME
```

**重要:** `--set-cloudsql-instances`を使用してください（`--add-cloudsql-instances`ではなく）。`--set-cloudsql-instances`は設定を上書きするため、`null`の状態からでも確実に設定できます。

### ステップ3: 設定を確認

```powershell
# 設定を確認（数秒待ってから実行）
Start-Sleep -Seconds 5
gcloud run services describe majong-app-backend-staging --region us-west1 --project=majong-app-staging --format="yaml(spec.template.spec.containers[0].cloudSqlInstances)"
```

**期待結果:**
- `null`ではなく、`majong-app-staging:us-west1:majong-app-db-staging`が表示されること

### ステップ4: サービスが更新されるまで待機

設定を追加した後、新しいリビジョンがデプロイされるまで数秒から1分程度かかります。

```powershell
# 最新のリビジョンを確認
gcloud run services describe majong-app-backend-staging --region us-west1 --project=majong-app-staging --format="value(status.latestReadyRevisionName)"
```

### ステップ5: APIをテスト

新しいリビジョンがデプロイされたら、APIをテストしてください：

```powershell
curl -X GET "https://majong-app-backend-staging-323648023154.us-west1.run.app/api/players" -H "accept: application/json"
```

## トラブルシューティング

### 問題1: 設定が`null`のまま

**原因:**
- コマンドが正しく実行されていない
- サービスが更新されていない

**解決方法:**
1. コマンドを再度実行
2. サービス詳細ページで「接続」タブを確認
3. 新しいリビジョンがデプロイされているか確認

### 問題2: エラーが続く

**確認事項:**
1. 接続名が正しいか確認
2. サービスアカウントの権限を確認（既に確認済みで問題なし）
3. DATABASE_URLが正しい形式になっているか確認

## 注意事項

- `--set-cloudsql-instances`は既存の設定を上書きします
- 複数のCloud SQLインスタンスに接続する場合は、カンマ区切りで指定できます
- 設定を削除する場合は、`--clear-cloudsql-instances`を使用します


