# DATABASE_URLの想定形式

## Cloud SQL Proxyを使用する場合（推奨・現在の設定）

### 正しい形式

```
postgresql://USER:PASSWORD@/DATABASE?host=/cloudsql/CONNECTION_NAME
```

### 具体的な例（ステージング環境）

```
postgresql://majong_user:パスワード@/majong_db?host=/cloudsql/majong-app-staging:us-west1:majong-app-db-staging
```

### 構成要素

1. **プロトコル**: `postgresql://`
2. **ユーザー名**: `majong_user`（GitHub Secretsの`DB_USER`）
3. **パスワード**: 実際のパスワード（GitHub Secretsの`DB_PASSWORD`）
4. **ホスト名**: **省略**（`@/`の形式で、ホスト名を指定しない）
5. **データベース名**: `majong_db`
6. **Unixソケットパス**: `?host=/cloudsql/CONNECTION_NAME`
   - `CONNECTION_NAME`は`PROJECT_ID:REGION:INSTANCE_NAME`形式
   - 例: `majong-app-staging:us-west1:majong-app-db-staging`

### 重要なポイント

- **ホスト名を省略**: `@/`の形式で、ホスト名を指定しない
- **ポート番号を省略**: ポート番号を指定しない（`:5432`などは不要）
- **Unixソケットパス**: `host=/cloudsql/CONNECTION_NAME`でUnixソケットパスを指定
- **接続名の形式**: `PROJECT_ID:REGION:INSTANCE_NAME`形式を使用

## 現在のデプロイワークフローでの設定

`.github/workflows/deploy.yml`の87行目で以下のように設定されています：

```yaml
--set-env-vars "NODE_ENV=staging,DATABASE_URL=postgresql://${{ secrets.DB_USER }}:${{ secrets.DB_PASSWORD }}@/majong_db?host=/cloudsql/${{ steps.cloud_sql_connection.outputs.connection_name }}"
```

### 展開後の例

GitHub Secretsに以下の値が設定されている場合：
- `DB_USER`: `majong_user`
- `DB_PASSWORD`: `F2BTec4PlZjKv9qsQkrISW3ybXViwYfh`
- `cloud_sql_connection.outputs.connection_name`: `majong-app-staging:us-west1:majong-app-db-staging`

展開後のDATABASE_URL:
```
postgresql://majong_user:F2BTec4PlZjKv9qsQkrISW3ybXViwYfh@/majong_db?host=/cloudsql/majong-app-staging:us-west1:majong-app-db-staging
```

## 間違った形式（避けるべき）

### 1. ポート番号付き

```
postgresql://majong_user:password@host:5432/majong_db
postgresql://majong_user:password@/majong_db?host=/cloudsql/CONNECTION_NAME&port=5432
```

**問題点:**
- ポート番号を指定すると、TCP接続を試みてしまう
- Cloud SQL ProxyはUnixソケット経由で接続するため、ポート番号は不要

### 2. IPアドレス付き

```
postgresql://majong_user:password@10.103.0.3:5432/majong_db
postgresql://majong_user:password@10.103.0.3/majong_db
```

**問題点:**
- IPアドレスを指定すると、プライベートIP接続を試みてしまう
- Cloud SQL ProxyはUnixソケット経由で接続するため、IPアドレスは不要

### 3. ホスト名付き

```
postgresql://majong_user:password@localhost/majong_db?host=/cloudsql/CONNECTION_NAME
postgresql://majong_user:password@example.com/majong_db?host=/cloudsql/CONNECTION_NAME
```

**問題点:**
- ホスト名を指定すると、TCP接続を試みてしまう
- Cloud SQL ProxyはUnixソケット経由で接続するため、ホスト名は不要

## 環境別の設定

### ステージング環境

```
postgresql://majong_user:パスワード@/majong_db?host=/cloudsql/majong-app-staging:us-west1:majong-app-db-staging
```

### 本番環境

```
postgresql://majong_user:パスワード@/majong_db?host=/cloudsql/majong-app-production:us-west1:majong-app-db-production
```

## 開発環境（ローカル）

開発環境では、通常のTCP接続を使用します：

```
postgresql://majong_user:majong_password@localhost:5432/majong_db?schema=public
```

**違い:**
- ホスト名: `localhost`
- ポート番号: `:5432`
- Unixソケットパス: なし（`host=/cloudsql/...`は不要）

## 確認方法

### 現在のDATABASE_URLを確認

```powershell
# 環境変数を確認
gcloud run services describe majong-app-backend-staging --region us-west1 --project=majong-app-staging --format="value(spec.template.spec.containers[0].env)" | Select-String "DATABASE_URL"
```

**期待される出力:**
```
{'name': 'DATABASE_URL', 'value': 'postgresql://majong_user:****@/majong_db?host=/cloudsql/majong-app-staging:us-west1:majong-app-db-staging'}
```

## 参考資料

- [Cloud SQL Proxy ドキュメント](https://cloud.google.com/sql/docs/postgres/sql-proxy)
- [Cloud Run から Cloud SQL への接続](https://cloud.google.com/sql/docs/postgres/connect-run)
- [Unix ソケット接続](https://cloud.google.com/sql/docs/postgres/connect-run#unix-sockets)


