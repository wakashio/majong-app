# Cloud SQL Proxy接続設定

## 概要

Cloud RunからCloud SQLへの接続を、Cloud SQL Proxyを使用して確立する設計書です。

## 背景

### 問題

- Cloud SQLがプライベートIPのみで設定されている（`ipv4_enabled = false`）
- Cloud RunにVPCコネクタが設定されていない
- そのため、Cloud RunからCloud SQLへのプライベートIP接続ができない
- 結果として、500エラーが発生している

### 解決方法の選択

Cloud SQL Proxyを使用する方法を採用しました。

**理由:**
- 実装が簡単（`--add-cloudsql-instances`フラグを追加するだけ）
- VPCコネクタ不要
- セキュアな接続
- 接続管理が自動
- GCPの推奨方法

## 接続方法の詳細

### Cloud SQL Proxyとは

Cloud SQL Proxyは、Cloud SQLインスタンスへのセキュアな接続を提供するGCPのサービスです。Cloud Runでは、`--add-cloudsql-instances`フラグを使用してCloud SQL Proxyを有効化できます。

### 接続名の形式

Cloud SQLインスタンスの接続名は以下の形式です:

```
PROJECT_ID:REGION:INSTANCE_NAME
```

**例:**
- ステージング: `majong-app-staging:us-west1:majong-app-db-staging`
- 本番: `majong-app-production:us-west1:majong-app-db-production`

### 接続文字列の形式

Cloud SQL Proxyを使用する場合、DATABASE_URLは以下の形式に変更します:

```
postgresql://USER:PASSWORD@/DATABASE?host=/cloudsql/CONNECTION_NAME
```

**例:**
```
postgresql://majong_user:PASSWORD@/majong_db?host=/cloudsql/majong-app-staging:us-west1:majong-app-db-staging
```

### Unixソケット接続

Cloud SQL ProxyはUnixソケット経由で接続します。接続文字列の`host=/cloudsql/CONNECTION_NAME`部分がUnixソケットパスを指定します。

## 実装内容

### 1. デプロイワークフローの修正

#### 1.1 Cloud SQLインスタンスの接続名を取得

デプロイワークフローで、Cloud SQLインスタンスの接続名を取得するステップを追加します。

**ステージング環境:**
```yaml
- name: Get Cloud SQL Connection Name
  id: cloud_sql_connection
  run: |
    CONNECTION_NAME=$(gcloud sql instances describe majong-app-db-staging \
      --project=${{ secrets.GCP_PROJECT_ID }} \
      --format='value(connectionName)')
    echo "connection_name=$CONNECTION_NAME" >> $GITHUB_OUTPUT
    echo "Cloud SQL Connection Name: $CONNECTION_NAME"
```

**本番環境:**
```yaml
- name: Get Cloud SQL Connection Name
  id: cloud_sql_connection
  run: |
    CONNECTION_NAME=$(gcloud sql instances describe majong-app-db-production \
      --project=${{ secrets.GCP_PROJECT_ID }} \
      --format='value(connectionName)')
    echo "connection_name=$CONNECTION_NAME" >> $GITHUB_OUTPUT
    echo "Cloud SQL Connection Name: $CONNECTION_NAME"
```

#### 1.2 Cloud Runデプロイ時にCloud SQL Proxyを有効化

`gcloud run deploy`コマンドに`--add-cloudsql-instances`フラグを追加します。

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

### 2. DATABASE_URLの接続文字列の変更

#### 2.1 接続文字列の形式

**変更前（プライベートIP接続）:**
```
postgresql://majong_user:PASSWORD@10.103.0.3:5432/majong_db
```

**変更後（Cloud SQL Proxy接続）:**
```
postgresql://majong_user:PASSWORD@/majong_db?host=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME
```

#### 2.2 接続文字列の構築

デプロイワークフローで、接続名を使用して接続文字列を構築します。

```yaml
DATABASE_URL="postgresql://${{ secrets.DB_USER }}:${{ secrets.DB_PASSWORD }}@/majong_db?host=/cloudsql/${{ steps.cloud_sql_connection.outputs.connection_name }}"
```

### 3. Prismaクライアントの設定

Prismaクライアント（`backend/src/utils/prisma.ts`）の設定は変更不要です。接続文字列の変更のみで動作します。

## 必要な権限

### Cloud Runサービスアカウント

Cloud Runサービスアカウントには、Cloud SQLインスタンスへの接続権限が必要です。

**必要なIAMロール:**
- `roles/cloudsql.client`

**設定方法:**
```bash
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
  --role="roles/cloudsql.client"
```

## 環境別の設定

### ステージング環境

- **インスタンス名**: `majong-app-db-staging`
- **接続名**: `majong-app-staging:us-west1:majong-app-db-staging`
- **サービス名**: `majong-app-backend-staging`

### 本番環境

- **インスタンス名**: `majong-app-db-production`
- **接続名**: `majong-app-production:us-west1:majong-app-db-production`
- **サービス名**: `majong-app-backend-production`

## デプロイワークフローの変更点

### 変更ファイル

1. `.github/workflows/deploy.yml`（ステージング環境）
2. `.github/workflows/deploy-production.yml`（本番環境）

### 変更内容

1. Cloud SQLインスタンスの接続名を取得するステップを追加
2. `gcloud run deploy`コマンドに`--add-cloudsql-instances`フラグを追加
3. DATABASE_URLの接続文字列を`/cloudsql/CONNECTION_NAME`形式に変更
4. VPCコネクタ関連のステップを削除（不要になったため）

## 動作確認

### デプロイ後の確認事項

1. Cloud Runサービスのログを確認して、データベース接続エラーが解消されているか確認
2. APIエンドポイント（`/api/players`、`/api/sessions`など）が正常に動作するか確認
3. エラーログにデータベース接続エラーが表示されていないか確認

### 確認コマンド

```bash
# Cloud Runサービスのログを確認
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=majong-app-backend-staging AND severity>=ERROR" \
  --limit 50 \
  --format json \
  --project=majong-app-staging

# APIエンドポイントの動作確認
curl https://majong-app-backend-staging-xxx.run.app/api/players
```

## トラブルシューティング

### よくある問題

#### 1. 接続名が取得できない

**原因**: Cloud SQLインスタンスが存在しない、または権限が不足している

**解決方法**:
- Cloud SQLインスタンスが正しく作成されているか確認
- サービスアカウントに`roles/cloudsql.viewer`権限があるか確認

#### 2. Cloud SQL Proxy接続エラー

**原因**: `--add-cloudsql-instances`フラグが正しく設定されていない、または接続文字列が間違っている

**解決方法**:
- `--add-cloudsql-instances`フラグに接続名が正しく設定されているか確認
- DATABASE_URLの接続文字列が`/cloudsql/CONNECTION_NAME`形式になっているか確認

#### 3. 権限エラー

**原因**: Cloud RunサービスアカウントにCloud SQL接続権限がない

**解決方法**:
- Cloud Runサービスアカウントに`roles/cloudsql.client`権限を付与

## 参考資料

- [Cloud SQL Proxy ドキュメント](https://cloud.google.com/sql/docs/postgres/sql-proxy)
- [Cloud Run から Cloud SQL への接続](https://cloud.google.com/sql/docs/postgres/connect-run)
- [Unix ソケット接続](https://cloud.google.com/sql/docs/postgres/connect-run#unix-sockets)

