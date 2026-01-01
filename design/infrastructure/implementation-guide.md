# GCPインフラ実装手順書

## 概要

このドキュメントは、GCPインフラ設計に基づいて、実際にインフラを構築するための手順書です。

**初回デプロイの詳細な手順については、[初回デプロイ手順書](./first-deployment-guide.md)を参照してください。**

## 前提条件

### 必要なツール

- **GCPアカウント**: 新規ユーザー向け$300の無料クレジットが利用可能
- **gcloud CLI**: GCPコマンドラインツール
- **Terraform**: バージョン1.0以上
- **Docker**: コンテナイメージのビルド用
- **Git**: バージョン管理

### 必要な知識

- GCPの基本的な概念（プロジェクト、リージョン、サービスアカウントなど）
- Terraformの基本的な使い方
- Dockerの基本的な使い方
- GitHub Actionsの基本的な使い方

---

## 実装手順

### ステップ1: GCPプロジェクトのセットアップ

#### 1.1 GCPプロジェクトの作成

```bash
# GCPプロジェクトを作成
gcloud projects create majong-app --name="Majong App"

# プロジェクトを設定
gcloud config set project majong-app

# プロジェクトIDを確認（後で使用します）
gcloud config get-value project
```

#### 1.2 必要なAPIの有効化

```bash
# Cloud Build API
gcloud services enable cloudbuild.googleapis.com

# Cloud Run API
gcloud services enable run.googleapis.com

# Cloud SQL Admin API
gcloud services enable sqladmin.googleapis.com

# Compute Engine API
gcloud services enable compute.googleapis.com

# Secret Manager API
gcloud services enable secretmanager.googleapis.com

# Cloud Resource Manager API
gcloud services enable cloudresourcemanager.googleapis.com
```

#### 1.3 課金アカウントのリンク

```bash
# 課金アカウントを確認
gcloud billing accounts list

# 課金アカウントをプロジェクトにリンク（BILLING_ACCOUNT_IDを実際のIDに置き換え）
gcloud billing projects link majong-app --billing-account=BILLING_ACCOUNT_ID
```

---

### ステップ2: サービスアカウントの作成

#### 2.1 GitHub Actions用サービスアカウントの作成

```bash
# サービスアカウントを作成
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Service Account" \
  --project=majong-app

# 必要な権限を付与
gcloud projects add-iam-policy-binding majong-app \
  --member="serviceAccount:github-actions@majong-app.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding majong-app \
  --member="serviceAccount:github-actions@majong-app.iam.gserviceaccount.com" \
  --role="roles/sql.admin"

gcloud projects add-iam-policy-binding majong-app \
  --member="serviceAccount:github-actions@majong-app.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding majong-app \
  --member="serviceAccount:github-actions@majong-app.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding majong-app \
  --member="serviceAccount:github-actions@majong-app.iam.gserviceaccount.com" \
  --role="roles/compute.admin"

# サービスアカウントキーを生成（GitHub Secretsに設定）
gcloud iam service-accounts keys create github-actions-key.json \
  --iam-account=github-actions@majong-app.iam.gserviceaccount.com
```

---

### ステップ3: Terraformのセットアップ

#### 3.1 Terraformのインストール

```bash
# macOSの場合
brew install terraform

# Windowsの場合
# https://www.terraform.io/downloads からダウンロード

# バージョン確認
terraform version
```

#### 3.2 Terraformファイルの作成

設計書に基づいて、以下のディレクトリ構成でTerraformファイルを作成します:

```
infrastructure/
├── terraform/
│   ├── environments/
│   │   ├── staging/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   ├── outputs.tf
│   │   │   └── terraform.tfvars
│   │   └── production/
│   │       ├── main.tf
│   │       ├── variables.tf
│   │       ├── outputs.tf
│   │       └── terraform.tfvars
│   └── modules/
│       ├── cloud-run/
│       ├── cloud-sql/
│       └── vpc/
```

#### 3.3 Terraformの初期化

```bash
# ステージング環境
cd infrastructure/terraform/environments/staging
terraform init

# 本番環境
cd infrastructure/terraform/environments/production
terraform init
```

---

### ステップ4: Dockerfileの作成

#### 4.1 フロントエンドのDockerfile

`frontend/Dockerfile`を作成します（後で実装します）。

#### 4.2 バックエンドのDockerfile

`backend/Dockerfile`を作成します（後で実装します）。

---

### ステップ5: CI/CDパイプラインの設定

#### 5.1 GitHub Secretsの設定

GitHubリポジトリのSettings > Secrets and variables > Actionsで以下を設定:

- `GCP_PROJECT_ID`: GCPプロジェクトID
- `GCP_SA_KEY`: サービスアカウントキー（JSON形式）

#### 5.2 GitHub Actionsワークフローの作成

`.github/workflows/deploy.yml`を作成します（後で実装します）。

---

### ステップ6: 初回デプロイ

#### 6.1 Terraformでインフラを作成

```bash
# ステージング環境
cd infrastructure/terraform/environments/staging
terraform plan
terraform apply

# 本番環境（準備ができたら）
cd infrastructure/terraform/environments/production
terraform plan
terraform apply
```

#### 6.2 アプリケーションのデプロイ

```bash
# フロントエンドのビルドとデプロイ
cd frontend
docker build -t gcr.io/majong-app/majong-app-frontend:latest .
docker push gcr.io/majong-app/majong-app-frontend:latest
gcloud run deploy majong-app-frontend-staging \
  --image gcr.io/majong-app/majong-app-frontend:latest \
  --region us-west1 \
  --platform managed

# バックエンドのビルドとデプロイ
cd backend
docker build -t gcr.io/majong-app/majong-app-backend:latest .
docker push gcr.io/majong-app/majong-app-backend:latest
gcloud run deploy majong-app-backend-staging \
  --image gcr.io/majong-app/majong-app-backend:latest \
  --region us-west1 \
  --platform managed \
  --set-env-vars DATABASE_URL="postgresql://..."
```

---

## 実装チェックリスト

### インフラ

- [ ] GCPプロジェクトの作成
- [ ] 必要なAPIの有効化
- [ ] サービスアカウントの作成と権限設定
- [ ] Terraformファイルの作成
  - [ ] VPCネットワーク
  - [ ] Cloud SQLインスタンス
  - [ ] Cloud Runサービス（フロントエンド）
  - [ ] Cloud Runサービス（バックエンド）
  - [ ] Cloud Storageバケット
  - [ ] IAMロールとバインディング
- [ ] Terraformの初期化と適用

### アプリケーション

- [ ] フロントエンドのDockerfile作成
- [ ] バックエンドのDockerfile作成
- [ ] 環境変数の設定
- [ ] データベース接続設定

### CI/CD

- [ ] GitHub Secretsの設定
- [ ] GitHub Actionsワークフローの作成
- [ ] デプロイスクリプトの作成

### セキュリティ

- [ ] Secret Managerの設定
- [ ] ネットワークセキュリティの設定
- [ ] IAMロールの最小権限原則の適用

---

## トラブルシューティング

### よくある問題と解決方法

#### 1. Terraformの適用が失敗する

**問題**: `Error: Error creating instance: googleapi: Error 403: Insufficient Permission`

**解決方法**:
- サービスアカウントに必要な権限が付与されているか確認
- `gcloud auth application-default login`で認証を確認

#### 2. Cloud RunからCloud SQLに接続できない

**問題**: `Error: connect ECONNREFUSED`

**解決方法**:
- VPCコネクタが正しく設定されているか確認
- Cloud SQLのプライベートIPが有効になっているか確認
- ファイアウォールルールを確認

#### 3. Dockerイメージのビルドが失敗する

**問題**: `Error: failed to solve: process "/bin/sh -c npm install" did not complete successfully`

**解決方法**:
- Dockerfileの依存関係インストール手順を確認
- `.dockerignore`ファイルで不要なファイルを除外

#### 4. GitHub Actionsのデプロイが失敗する

**問題**: `Error: googleapi: Error 403: Permission denied`

**解決方法**:
- GitHub Secretsの`GCP_SA_KEY`が正しく設定されているか確認
- サービスアカウントに必要な権限が付与されているか確認

---

## 次のステップ

実装が完了したら:

1. **テスト**: ステージング環境で動作確認
2. **監視**: Cloud Monitoringでリソース使用状況を確認
3. **コスト**: Cloud Billingでコストを確認
4. **本番デプロイ**: 準備ができたら本番環境にデプロイ

---

## 参考資料

- [GCP公式ドキュメント](https://cloud.google.com/docs)
- [Terraform GCP Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [Cloud Run公式ドキュメント](https://cloud.google.com/run/docs)
- [Cloud SQL公式ドキュメント](https://cloud.google.com/sql/docs)

