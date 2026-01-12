# Cloud SQL Proxy設定をGUIで追加する方法

## 手順

### ステップ1: Cloud Runサービスのページを開く

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. プロジェクトを`majong-app-staging`に切り替え
3. 左側のメニューから「**Cloud Run**」を選択
4. サービス一覧から「**majong-app-backend-staging**」をクリック

### ステップ2: サービスを編集

1. ページ上部の「**編集と新しいリビジョンをデプロイ**」ボタンをクリック

### ステップ3: Cloud SQL接続を設定

1. 「**接続**」タブをクリック
2. 「**Cloud SQL接続**」セクションを展開
3. 「**Cloud SQLインスタンスを追加**」をクリック
4. ドロップダウンから「**majong-app-db-staging**」を選択
   - または、接続名「**majong-app-staging:us-west1:majong-app-db-staging**」を直接入力
5. 「**完了**」をクリック

### ステップ4: 環境変数を確認

1. 「**変数とシークレット**」タブをクリック
2. `DATABASE_URL`環境変数を確認
   - 値が`postgresql://majong_user:...@/majong_db?host=/cloudsql/majong-app-staging:us-west1:majong-app-db-staging`形式になっていることを確認
3. もし形式が違う場合は、編集して正しい形式に変更

### ステップ5: デプロイ

1. ページ下部の「**デプロイ**」ボタンをクリック
2. デプロイが完了するまで待機（通常1-2分）

### ステップ6: 確認

1. デプロイ完了後、サービス詳細ページに戻る
2. 「**接続**」タブで「**Cloud SQL接続**」セクションを確認
3. `majong-app-staging:us-west1:majong-app-db-staging`が表示されていることを確認

## 注意事項

- Cloud SQL接続を追加する際は、接続名の形式が`PROJECT_ID:REGION:INSTANCE_NAME`であることを確認してください
- 環境変数`DATABASE_URL`が正しい形式（`host=/cloudsql/CONNECTION_NAME`）になっていることを確認してください
- デプロイ後、数秒待ってからAPIをテストしてください

## 確認方法

デプロイ後、以下のコマンドでAPIが正常に動作するか確認してください：

```powershell
curl -X GET "https://majong-app-backend-staging-323648023154.us-west1.run.app/api/players" -H "accept: application/json"
```

期待結果:
- ステータスコード200が返ること
- プレイヤー一覧のJSONが返ること（空の配列`[]`でもOK）

