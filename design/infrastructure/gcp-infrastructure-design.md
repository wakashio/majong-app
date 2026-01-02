# GCPインフラ設計

## 概要

麻雀記録アプリケーションをGCP上にデプロイするためのインフラストラクチャ設計書です。

### 要件

- **想定ユーザー数**: 5人程度（同時使用最大5人）
- **コスト予算**: ほぼ0円想定（無料枠を最大限活用）
- **可用性目標**: オンデマンド利用
- **環境分離**: ステージング環境と本番環境を分離
- **インフラコード化**: Terraformを使用

### コスト見積もり

- **月額**: ¥1,000-1,500程度（データベースのみ有料）
- **初年度**: 新規ユーザー向け$300の無料クレジットで最初の3ヶ月は実質無料

---

## インフラ構成

### 全体アーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│                    GCP プロジェクト                      │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Cloud Load Balancer                  │  │
│  └──────────────┬───────────────────────────────────┘  │
│                 │                                        │
│  ┌──────────────▼──────────────┐                       │
│  │      Cloud Run (Frontend)   │                       │
│  │   Vue.js ビルド成果物        │                       │
│  └─────────────────────────────┘                       │
│                                                          │
│  ┌─────────────────────────────┐                       │
│  │      Cloud Run (Backend)     │                       │
│  │   Node.js/Express API        │                       │
│  └──────────────┬──────────────┘                       │
│                 │                                        │
│  ┌──────────────▼──────────────┐                       │
│  │   Cloud SQL for PostgreSQL   │                       │
│  │   db-f1-micro (最小構成)      │                       │
│  └─────────────────────────────┘                       │
│                                                          │
│  ┌─────────────────────────────┐                       │
│  │      Cloud Storage           │                       │
│  │   静的ファイル配信            │                       │
│  └─────────────────────────────┘                       │
│                                                          │
│  ┌─────────────────────────────┐                       │
│  │   Cloud Logging/Monitoring   │                       │
│  │   監視・ログ管理              │                       │
│  └─────────────────────────────┘                       │
└─────────────────────────────────────────────────────────┘
```

---

## サービス詳細

### 1. Cloud Run（フロントエンド）

#### 設定

- **サービス名**: `majong-app-frontend`
- **リージョン**: `us-west1`（無料枠適用）
- **CPU**: 1 vCPU（リクエスト時のみ）
- **メモリ**: 512 MiB
- **最大インスタンス数**: 1（コスト削減）
- **最小インスタンス数**: 0（コスト削減）
- **タイムアウト**: 300秒
- **同時リクエスト数**: 80

#### 無料枠

- リクエスト数: 月200万回まで無料
- コンピューティング時間: 180,000 vCPU秒、360,000 GiB秒まで無料

#### デプロイ方法

- Dockerイメージをビルドしてデプロイ
- GitHub Actionsで自動デプロイ

---

### 2. Cloud Run（バックエンド）

#### 設定

- **サービス名**: `majong-app-backend`
- **リージョン**: `us-west1`（無料枠適用）
- **CPU**: 1 vCPU（リクエスト時のみ）
- **メモリ**: 512 MiB
- **最大インスタンス数**: 1（コスト削減）
- **最小インスタンス数**: 0（コスト削減）
- **タイムアウト**: 300秒
- **同時リクエスト数**: 80

#### 環境変数

- `DATABASE_URL`: Cloud SQL接続文字列
- `NODE_ENV`: `production`（本番環境）または`staging`（ステージング環境）
- その他のシークレット: Secret Managerから取得

#### 無料枠

- リクエスト数: 月200万回まで無料
- コンピューティング時間: 180,000 vCPU秒、360,000 GiB秒まで無料

#### デプロイ方法

- Dockerイメージをビルドしてデプロイ
- GitHub Actionsで自動デプロイ

---

### 3. Cloud SQL for PostgreSQL

#### 設定

- **インスタンス名**: `majong-app-db`
- **データベースエンジン**: PostgreSQL 16
- **インスタンスタイプ**: `db-f1-micro`
  - vCPU: 共有0.2コア
  - メモリ: 0.6GB
  - ストレージ: 10GB HDD
- **リージョン**: `us-west1`
- **可用性**: 単一ゾーン（コスト削減）
- **バックアップ**: 自動バックアップ有効（7日間保持）

#### 接続方法

- **Cloud SQL Proxyを使用（推奨・実装済み）**: Cloud RunからCloud SQLへの接続にCloud SQL Proxyを使用。`--add-cloudsql-instances`フラグで有効化し、Unixソケット経由で接続する。
- **接続文字列形式**: `postgresql://user:password@/database?host=/cloudsql/CONNECTION_NAME`
- **詳細**: `design/infrastructure/cloud-sql-proxy-connection.md`を参照

#### コスト

- **月額**: 約¥1,000-1,500（最小構成）

---

### 4. Cloud Storage

#### 設定

- **バケット名**: `majong-app-static-{environment}`（環境ごとに分離）
- **リージョン**: `us-west1`
- **ストレージクラス**: Standard
- **アクセス制御**: Cloud CDN経由で配信

#### 無料枠

- ストレージ: 月5GBまで無料

#### 用途

- 静的ファイル配信（オプション）
- フロントエンドのビルド成果物を配信する場合に使用

---

### 5. VPCネットワーク

#### 設定

- **VPC名**: `majong-app-vpc`
- **サブネット**: `majong-app-subnet`
- **リージョン**: `us-west1`
- **IP範囲**: `10.0.0.0/24`

#### ファイアウォールルール

- Cloud RunからCloud SQLへの接続を許可
- 外部からのHTTP/HTTPSアクセスを許可（Cloud Load Balancer経由）

---

### 6. Cloud Load Balancer

#### 設定

- **タイプ**: HTTP(S) Load Balancer
- **リージョン**: `us-west1`
- **バックエンド**: Cloud Runサービス（フロントエンド、バックエンド）

#### 無料枠

- 基本的なロードバランシング機能は無料（転送量に応じて課金あり）

---

### 7. Cloud Logging / Monitoring

#### 設定

- **ログ保持期間**: 30日（無料枠内）
- **メトリクス**: Cloud Run、Cloud SQLのメトリクスを監視

#### 無料枠

- ログ保存: 50GB/月まで無料
- メトリクス: 150MB/月まで無料

---

## 環境分離

### ステージング環境

- **プロジェクト**: 同一プロジェクト内で環境変数で分離
- **Cloud Runサービス**: `majong-app-frontend-staging`、`majong-app-backend-staging`
- **Cloud SQL**: 別インスタンスまたは同一インスタンス内で別データベース
- **Cloud Storage**: `majong-app-static-staging`バケット

### 本番環境

- **プロジェクト**: 同一プロジェクト内で環境変数で分離
- **Cloud Runサービス**: `majong-app-frontend-prod`、`majong-app-backend-prod`
- **Cloud SQL**: 別インスタンスまたは同一インスタンス内で別データベース
- **Cloud Storage**: `majong-app-static-prod`バケット

---

## Terraform設定

### ディレクトリ構成

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
│   ├── modules/
│   │   ├── cloud-run/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   └── outputs.tf
│   │   ├── cloud-sql/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   └── outputs.tf
│   │   └── vpc/
│   │       ├── main.tf
│   │       ├── variables.tf
│   │       └── outputs.tf
│   └── shared/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
└── README.md
```

### 主要リソース

#### Cloud Run（フロントエンド）

```hcl
resource "google_cloud_run_service" "frontend" {
  name     = "majong-app-frontend-${var.environment}"
  location = var.region

  template {
    spec {
      containers {
        image = var.frontend_image
        ports {
          container_port = 80
        }
        resources {
          limits = {
            cpu    = "1"
            memory = "512Mi"
          }
        }
      }
      container_concurrency = 80
    }
    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale" = "1"
        "autoscaling.knative.dev/minScale" = "0"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}
```

#### Cloud Run（バックエンド）

```hcl
resource "google_cloud_run_service" "backend" {
  name     = "majong-app-backend-${var.environment}"
  location = var.region

  template {
    spec {
      containers {
        image = var.backend_image
        ports {
          container_port = 3000
        }
        env {
          name  = "DATABASE_URL"
          value = google_sql_database_instance.db.connection_name
        }
        env {
          name  = "NODE_ENV"
          value = var.environment
        }
        resources {
          limits = {
            cpu    = "1"
            memory = "512Mi"
          }
        }
      }
      container_concurrency = 80
    }
    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale" = "1"
        "autoscaling.knative.dev/minScale" = "0"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}
```

#### Cloud SQL

```hcl
resource "google_sql_database_instance" "db" {
  name             = "majong-app-db-${var.environment}"
  database_version = "POSTGRES_16"
  region           = var.region

  settings {
    tier              = "db-f1-micro"
    availability_type = "ZONAL"
    disk_size         = 10
    disk_type         = "PD_HDD"
    
    backup_configuration {
      enabled    = true
      start_time = "03:00"
    }

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.vpc.id
    }
  }

  deletion_protection = var.environment == "production"
}
```

#### VPC

```hcl
resource "google_compute_network" "vpc" {
  name                    = "majong-app-vpc-${var.environment}"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "subnet" {
  name          = "majong-app-subnet-${var.environment}"
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
  network       = google_compute_network.vpc.id
}
```

---

## CI/CDパイプライン

### GitHub Actionsワークフロー

#### デプロイワークフロー（`.github/workflows/deploy.yml`）

```yaml
name: Deploy to GCP

on:
  push:
    branches:
      - main      # 本番環境
      - staging   # ステージング環境

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Cloud SDK
        uses: google-github-actions/setup-gcloud@v1
        with:
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          project_id: ${{ secrets.GCP_PROJECT_ID }}
      
      - name: Configure Docker for GCR
        run: gcloud auth configure-docker
      
      - name: Build and push Frontend
        run: |
          cd frontend
          docker build -t gcr.io/${{ secrets.GCP_PROJECT_ID }}/majong-app-frontend:${{ github.sha }} .
          docker push gcr.io/${{ secrets.GCP_PROJECT_ID }}/majong-app-frontend:${{ github.sha }}
      
      - name: Build and push Backend
        run: |
          cd backend
          docker build -t gcr.io/${{ secrets.GCP_PROJECT_ID }}/majong-app-backend:${{ github.sha }} .
          docker push gcr.io/${{ secrets.GCP_PROJECT_ID }}/majong-app-backend:${{ github.sha }}
      
      - name: Deploy with Terraform
        run: |
          cd infrastructure/terraform/environments/${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
          terraform init
          terraform plan
          terraform apply -auto-approve
```

---

## セキュリティ設定

### IAMロール

- **Cloud Runサービスアカウント**: Cloud SQL接続権限
- **GitHub Actionsサービスアカウント**: デプロイ権限

### Secret Manager

- データベースパスワード
- APIキー（必要に応じて）
- その他の機密情報

### ネットワークセキュリティ

- Cloud SQLはプライベートIPのみで接続（`ipv4_enabled = false`）
- Cloud RunはCloud SQL Proxy経由でCloud SQLに接続（`--add-cloudsql-instances`フラグを使用）
- 外部からの直接アクセスはCloud Load Balancer経由のみ
- **詳細**: `design/infrastructure/cloud-sql-proxy-connection.md`を参照

---

## デプロイ手順

### 初回セットアップ

**詳細な手順については、[初回デプロイ手順書](./first-deployment-guide.md)を参照してください。**

初回デプロイ手順書には、以下の内容が詳細に記載されています:

- ステージング環境の初回デプロイ手順（10ステップ）
- 本番環境の初回デプロイ手順（10ステップ）
- 各ステップの詳細なコマンドと説明
- トラブルシューティング
- デプロイ後の確認事項

#### 簡易手順（概要）

1. **GCPプロジェクトの作成**
   ```bash
   gcloud projects create majong-app --name="Majong App"
   gcloud config set project majong-app
   ```

2. **必要なAPIの有効化**
   ```bash
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable sqladmin.googleapis.com
   gcloud services enable compute.googleapis.com
   gcloud services enable secretmanager.googleapis.com
   ```

3. **Terraformの初期化**
   ```bash
   cd infrastructure/terraform/environments/staging
   terraform init
   ```

4. **Terraformの適用**
   ```bash
   terraform plan
   terraform apply
   ```

### 通常のデプロイ

1. **コードをプッシュ**
   ```bash
   git push origin main  # 本番環境
   git push origin staging  # ステージング環境
   ```

2. **GitHub Actionsが自動的にデプロイ**

---

## コスト最適化

### 無料枠の活用

- Cloud Run: 月200万リクエストまで無料
- Cloud Storage: 月5GBまで無料
- Cloud Logging: 月50GBまで無料
- Cloud Monitoring: 月150MBまで無料

### コスト削減のポイント

- 最小構成のデータベース（db-f1-micro）を使用
- Cloud Runの最小インスタンス数を0に設定
- 不要なバックアップを無効化（開発環境のみ）
- リージョンは無料枠が適用されるリージョンを選択

---

## 監視・アラート

### Cloud Monitoring

- Cloud Runのリクエスト数、エラー率
- Cloud SQLのCPU使用率、メモリ使用率
- データベース接続数

### アラート設定

- Cloud Runのエラー率が閾値を超えた場合
- Cloud SQLのCPU使用率が高い場合
- データベース接続数が上限に近づいた場合

---

## トラブルシューティング

### よくある問題

1. **Cloud RunからCloud SQLに接続できない**
   - VPCコネクタの設定を確認
   - ファイアウォールルールを確認

2. **デプロイが失敗する**
   - サービスアカウントの権限を確認
   - Dockerイメージのビルドログを確認

3. **コストが予想以上に高い**
   - Cloud Billingで使用量を確認
   - 無料枠を超えていないか確認

---

## 参考資料

- [GCP無料枠](https://cloud.google.com/free)
- [Cloud Run料金](https://cloud.google.com/run/pricing)
- [Cloud SQL料金](https://cloud.google.com/sql/pricing)
- [Terraform GCP Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs)

