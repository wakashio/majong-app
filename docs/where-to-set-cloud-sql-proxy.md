# Cloud SQL Proxy設定の場所と方法

## 設定場所

Cloud SQL Proxy設定は、**Cloud Runサービス**の設定で行います。

## 設定方法

### 方法1: Google Cloud Console（GUI）- 推奨

#### 手順

1. **Cloud Runサービスのページを開く**
   - [Google Cloud Console](https://console.cloud.google.com/)にアクセス
   - プロジェクトを`majong-app-staging`に切り替え
   - 左側のメニューから「**Cloud Run**」を選択
   - サービス一覧から「**majong-app-backend-staging**」をクリック

2. **サービスを編集**
   - ページ上部の「**編集と新しいリビジョンをデプロイ**」ボタンをクリック

3. **Cloud SQL接続を設定**
   - 「**接続**」タブをクリック
   - 「**Cloud SQL接続**」セクションを展開
   - 「**Cloud SQLインスタンスを追加**」をクリック
   - ドロップダウンから「**majong-app-db-staging**」を選択
     - または、接続名「**majong-app-staging:us-west1:majong-app-db-staging**」を直接入力
   - 「**完了**」をクリック

4. **デプロイ**
   - ページ下部の「**デプロイ**」ボタンをクリック
   - デプロイが完了するまで待機（通常1-2分）

#### 確認方法

デプロイ後、サービス詳細ページの「**接続**」タブで「**Cloud SQL接続**」セクションを確認：
- `majong-app-staging:us-west1:majong-app-db-staging`が表示されていることを確認

### 方法2: gcloud CLI（コマンドライン）

#### PowerShellでの実行

```powershell
# ステップ1: 接続名を取得
$CONNECTION_NAME = gcloud sql instances describe majong-app-db-staging --project=majong-app-staging --format='value(connectionName)'

# ステップ2: Cloud SQL Proxy設定を追加
gcloud run services update majong-app-backend-staging --region us-west1 --project=majong-app-staging --set-cloudsql-instances $CONNECTION_NAME
```

**重要:** `--set-cloudsql-instances`を使用してください（`--add-cloudsql-instances`ではなく）

#### 確認方法

```powershell
# 設定を確認
gcloud run services describe majong-app-backend-staging --region us-west1 --project=majong-app-staging --format="yaml(spec.template.spec.containers[0].cloudSqlInstances)"
```

期待結果: `null`ではなく、`majong-app-staging:us-west1:majong-app-db-staging`が表示されること

### 方法3: デプロイワークフロー（GitHub Actions）

#### 設定場所

`.github/workflows/deploy.yml`の`gcloud run deploy`コマンドに`--add-cloudsql-instances`フラグを追加：

```yaml
- name: Deploy Backend to Cloud Run
  run: |
    gcloud run deploy majong-app-backend-staging \
      --image gcr.io/${{ secrets.GCP_PROJECT_ID }}/majong-app-backend:${{ github.sha }} \
      --region ${{ env.GCP_REGION }} \
      --platform managed \
      --allow-unauthenticated \
      --add-cloudsql-instances ${{ steps.cloud_sql_connection.outputs.connection_name }} \
      --set-env-vars "NODE_ENV=staging,DATABASE_URL=postgresql://${{ secrets.DB_USER }}:${{ secrets.DB_PASSWORD }}@/majong_db?host=/cloudsql/${{ steps.cloud_sql_connection.outputs.connection_name }}" \
      --cpu 1 \
      --memory 512Mi \
      --min-instances 0 \
      --max-instances 1
```

#### 現在の設定

デプロイワークフローには既に`--add-cloudsql-instances`フラグが追加されていますが、設定が反映されていない可能性があります。

## 推奨される設定方法

### 1. GUIで設定（最も確実）

Google Cloud Consoleで設定を追加することを推奨します：
- 視覚的に確認できる
- 設定が確実に反映される
- エラーが発生しにくい

### 2. デプロイワークフローで設定（自動化）

最新のデプロイワークフローで再デプロイ：
- 自動化できる
- 設定がコードとして管理される

### 3. CLIで設定（手動）

緊急時や一時的な設定変更に使用：
- 迅速に設定できる
- ただし、設定が反映されない問題が発生している

## 現在の問題

- CLIで`--set-cloudsql-instances`を実行しても、設定が`null`のまま
- デプロイワークフローの`--add-cloudsql-instances`も反映されていない可能性

## 解決策

### 最優先: GUIで設定

Google Cloud Consoleで設定を追加することを強く推奨します。これが最も確実な方法です。

### 次: デプロイワークフローを確認

デプロイワークフローで`--add-cloudsql-instances`が正しく実行されているか確認し、必要に応じて`--set-cloudsql-instances`に変更することを検討してください。

## 参考資料

- [Cloud SQL Proxy ドキュメント](https://cloud.google.com/sql/docs/postgres/sql-proxy)
- [Cloud Run から Cloud SQL への接続](https://cloud.google.com/sql/docs/postgres/connect-run)
- [GUIでの設定手順: `docs/fix-cloudsql-instances-gui.md`](./fix-cloudsql-instances-gui.md)


