# PostgreSQLへの移行設計

## 概要

現在使用しているSQLiteからPostgreSQLへの移行を実施する。本番環境ではクラウドのマネージドサービスを想定し、開発環境ではDocker Composeを使用してPostgreSQLコンテナを用意する。

## 設計内容

### 1. Prismaスキーマの変更

#### 変更内容

- `backend/prisma/schema.prisma`の`datasource`セクションの`provider`を`sqlite`から`postgresql`に変更

#### 変更前

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

#### 変更後

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2. Docker Compose設定

#### ファイル構成

- プロジェクトルートに`docker-compose.yml`を作成

#### 設定内容

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: majong-app-postgres
    environment:
      POSTGRES_USER: majong_user
      POSTGRES_PASSWORD: majong_password
      POSTGRES_DB: majong_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U majong_user -d majong_db"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

#### 説明

- PostgreSQL 16のAlpineイメージを使用（軽量）
- コンテナ名: `majong-app-postgres`
- データベース名: `majong_db`
- ユーザー名: `majong_user`
- パスワード: `majong_password`（開発環境用）
- ポート: `5432`
- データ永続化: `postgres_data`ボリュームを使用
- ヘルスチェック: データベースの起動確認

### 3. 環境変数の設定

#### 開発環境

- `.env`ファイル（または`.env.local`）に以下を設定:

```env
DATABASE_URL="postgresql://majong_user:majong_password@localhost:5432/majong_db?schema=public"
```

#### 本番環境

- クラウドのマネージドサービス（AWS RDS、Google Cloud SQL、Azure Database等）の接続URLを設定
- 環境変数またはシークレット管理サービスで管理

#### 接続URL形式

```
postgresql://[ユーザー名]:[パスワード]@[ホスト]:[ポート]/[データベース名]?schema=public
```

### 4. マイグレーション手順

#### 手順

1. Docker ComposeでPostgreSQLを起動
   ```bash
   docker-compose up -d
   ```

2. Prismaマイグレーションを実行
   ```bash
   cd backend
   npx prisma migrate dev --name init
   ```

3. Prisma Clientを再生成
   ```bash
   npx prisma generate
   ```

4. データベース接続の確認
   ```bash
   npx prisma studio
   ```

### 5. 既存データの移行

#### 現状

- 現在データベースにデータがないため、データ移行は不要
- マイグレーションのみで対応可能

#### 将来データがある場合の移行手順（参考）

1. SQLiteデータベースのエクスポート
2. PostgreSQL形式への変換
3. PostgreSQLへのインポート

### 6. 本番環境の考慮事項

#### クラウドマネージドサービス

- **AWS RDS**: `postgresql://[user]:[password]@[endpoint]:5432/[database]`
- **Google Cloud SQL**: `postgresql://[user]:[password]@[ip]:5432/[database]`
- **Azure Database**: `postgresql://[user]:[password]@[server].postgres.database.azure.com:5432/[database]`

#### セキュリティ

- 本番環境では強力なパスワードを使用
- 接続はSSL/TLSを有効化
- 環境変数やシークレット管理サービスで管理

### 7. 開発環境の起動手順

#### 初回セットアップ

```bash
# Docker ComposeでPostgreSQLを起動
docker-compose up -d

# 環境変数を設定（.envファイルに記載）
# DATABASE_URL="postgresql://majong_user:majong_password@localhost:5432/majong_db?schema=public"

# Prismaマイグレーションを実行
cd backend
npx prisma migrate dev --name init

# Prisma Clientを再生成
npx prisma generate
```

#### 日常的な起動

```bash
# PostgreSQLを起動
docker-compose up -d

# 停止
docker-compose down

# データを削除して再起動（開発時）
docker-compose down -v
docker-compose up -d
```

## 影響範囲

### 変更が必要なファイル

1. `backend/prisma/schema.prisma`: providerの変更
2. `docker-compose.yml`: 新規作成
3. `.env`: DATABASE_URLの更新
4. `.gitignore`: `.env`が既に含まれていることを確認

### 影響を受ける機能

- 現在データベースを使用している機能はないため、影響なし
- 今後作成するデータモデルはPostgreSQL用に設計される

## テスト方針

### テスト内容

1. Docker ComposeでPostgreSQLが正常に起動することを確認
2. Prismaマイグレーションが正常に実行されることを確認
3. Prisma Clientが正常に生成されることを確認
4. データベース接続が正常に行われることを確認

### テスト方法

- 手動テスト: `docker-compose up -d`で起動確認
- 手動テスト: `npx prisma migrate dev`でマイグレーション確認
- 手動テスト: `npx prisma studio`で接続確認

## 参考資料

- [Prisma PostgreSQL Documentation](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [Docker Compose PostgreSQL](https://hub.docker.com/_/postgres)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)

