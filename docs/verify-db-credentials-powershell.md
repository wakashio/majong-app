# データベース認証情報の確認方法（PowerShell）

## 確認すべきこと

Cloud SQL Proxy設定が正しくても、データベースの認証情報（ユーザー名とパスワード）が間違っていると接続できません。

## 確認手順

### 1. Cloud SQLインスタンスのユーザー一覧を確認

```powershell
# Cloud SQLインスタンスのユーザー一覧を確認
gcloud sql users list --instance=majong-app-db-staging --project=majong-app-staging
```

**確認事項:**
- `majong_user`が存在するか
- ユーザー名のスペルが正しいか

### 2. 現在のDATABASE_URLのユーザー名を確認

```powershell
# 現在の環境変数を確認
gcloud run services describe majong-app-backend-staging --region us-west1 --project=majong-app-staging --format="value(spec.template.spec.containers[0].env)" | Select-String "DATABASE_URL"
```

**確認事項:**
- DATABASE_URLのユーザー名が`majong_user`になっているか
- パスワードが正しいか（パスワードはマスクされているため、直接確認はできません）

### 3. パスワードをリセット（必要に応じて）

パスワードが間違っている可能性がある場合は、リセットできます：

```powershell
# パスワードをリセット（新しいパスワードを設定）
gcloud sql users set-password majong_user --instance=majong-app-db-staging --project=majong-app-staging --password="新しいパスワード"
```

**注意:** パスワードをリセットした後は、DATABASE_URLも更新する必要があります。

### 4. DATABASE_URLを更新（パスワード変更後）

パスワードを変更した場合は、Cloud Runサービスの環境変数も更新してください：

```powershell
# 接続名を取得
$CONNECTION_NAME = gcloud sql instances describe majong-app-db-staging --project=majong-app-staging --format='value(connectionName)'

# DATABASE_URLを更新（新しいパスワードを使用）
gcloud run services update majong-app-backend-staging `
  --region us-west1 `
  --project=majong-app-staging `
  --update-env-vars "DATABASE_URL=postgresql://majong_user:新しいパスワード@/majong_db?host=/cloudsql/$CONNECTION_NAME"
```

## よくある問題

### 問題1: ユーザーが存在しない

**症状:**
- `gcloud sql users list`で`majong_user`が表示されない

**解決方法:**
```powershell
# ユーザーを作成
gcloud sql users create majong_user --instance=majong-app-db-staging --project=majong-app-staging --password="パスワード"
```

### 問題2: パスワードが間違っている

**症状:**
- 接続エラーが発生する
- 認証エラーが表示される

**解決方法:**
- 上記の手順でパスワードをリセット
- DATABASE_URLを更新

### 問題3: データベース名が間違っている

**確認方法:**
```powershell
# Cloud SQLインスタンスのデータベース一覧を確認
gcloud sql databases list --instance=majong-app-db-staging --project=majong-app-staging
```

**確認事項:**
- `majong_db`が存在するか

## 接続テスト（ローカルから）

Cloud SQL Proxyを使用してローカルから接続テストを行うこともできます：

```powershell
# Cloud SQL Proxyを起動（別のターミナルで実行）
# まず、Cloud SQL Proxyをダウンロード（初回のみ）
# https://cloud.google.com/sql/docs/postgres/sql-proxy からダウンロード

# Cloud SQL Proxyを起動
.\cloud-sql-proxy.exe majong-app-staging:us-west1:majong-app-db-staging

# 別のターミナルで、psqlを使用して接続テスト
psql -h 127.0.0.1 -U majong_user -d majong_db
```

## 参考資料

- [Cloud SQL ユーザーの管理](https://cloud.google.com/sql/docs/postgres/users)
- [Cloud SQL Proxy の使用](https://cloud.google.com/sql/docs/postgres/sql-proxy)

