# DATABASE_URLのポート番号を確認する方法（PowerShell）

## 問題

エラーログに`10.103.0.3:3307`が表示されている場合、接続文字列にポート番号が含まれているか、Cloud SQL Proxyが正しく動作していない可能性があります。

## 確認手順

### 1. 現在のDATABASE_URLを確認

```powershell
# 環境変数を確認（DATABASE_URLの部分のみ）
gcloud run services describe majong-app-backend-staging --region us-west1 --project=majong-app-staging --format="value(spec.template.spec.containers[0].env)" | Select-String "DATABASE_URL"
```

**確認事項:**
- ポート番号（`:5432`や`:3307`）が含まれていないか
- 接続文字列が`postgresql://user:password@/database?host=/cloudsql/CONNECTION_NAME`形式になっているか

### 2. 正しい接続文字列の形式

**正しい形式（Cloud SQL Proxy使用）:**
```
postgresql://majong_user:password@/majong_db?host=/cloudsql/majong-app-staging:us-west1:majong-app-db-staging
```

**間違った形式（ポート番号付き）:**
```
postgresql://majong_user:password@host:5432/majong_db
postgresql://majong_user:password@/majong_db?host=/cloudsql/CONNECTION_NAME&port=5432
```

### 3. ポート番号が含まれている場合の修正方法

#### 方法1: GUIで修正

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. Cloud Run → `majong-app-backend-staging`を開く
3. 「編集と新しいリビジョンをデプロイ」をクリック
4. 「変数とシークレット」タブを開く
5. `DATABASE_URL`環境変数を編集
6. ポート番号を削除し、正しい形式に変更：
   ```
   postgresql://majong_user:パスワード@/majong_db?host=/cloudsql/majong-app-staging:us-west1:majong-app-db-staging
   ```
7. 「デプロイ」をクリック

#### 方法2: CLIで修正

```powershell
# 接続名を取得
$CONNECTION_NAME = gcloud sql instances describe majong-app-db-staging --project=majong-app-staging --format='value(connectionName)'

# DATABASE_URLを更新（ポート番号なし）
gcloud run services update majong-app-backend-staging `
  --region us-west1 `
  --project=majong-app-staging `
  --update-env-vars "DATABASE_URL=postgresql://majong_user:パスワード@/majong_db?host=/cloudsql/$CONNECTION_NAME"
```

## 重要なポイント

1. **Cloud SQL Proxyを使用する場合、ポート番号は不要**
   - Unixソケット経由で接続するため、ポート番号を指定する必要はありません
   - ポート番号を指定すると、TCP接続を試みてしまい、エラーが発生します

2. **接続文字列の形式**
   - ホスト名を省略: `@/`の形式で、ホスト名を指定しない
   - ポート番号を省略: ポート番号を指定しない
   - Unixソケットパス: `host=/cloudsql/CONNECTION_NAME`でUnixソケットパスを指定

3. **Cloud SQL Proxy設定も必要**
   - 接続文字列が正しくても、Cloud SQL Proxy設定（`cloudSqlInstances`）が`null`の場合は動作しません
   - GUIでCloud SQL接続を追加してください

## 確認方法

修正後、以下のコマンドで確認してください：

```powershell
# DATABASE_URLを確認（ポート番号が含まれていないことを確認）
gcloud run services describe majong-app-backend-staging --region us-west1 --project=majong-app-staging --format="value(spec.template.spec.containers[0].env)" | Select-String "DATABASE_URL"
```

期待結果:
- ポート番号（`:5432`や`:3307`）が含まれていないこと
- `host=/cloudsql/CONNECTION_NAME`形式になっていること

