# ステージング環境のメイン設定
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    time = {
      source  = "hashicorp/time"
      version = "~> 0.9"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# VPCモジュール
module "vpc" {
  source = "../../modules/vpc"
  
  environment = "staging"
  region      = var.region
  subnet_cidr = "10.0.0.0/24"
}

# サービスネットワーキング接続の完了を待つ
# 注意: サービスネットワーキング接続は非同期で完了するため、数分かかることがあります
resource "time_sleep" "wait_for_vpc_connection" {
  depends_on = [module.vpc.private_vpc_connection]
  
  create_duration = "120s"  # 2分待機
}

# Cloud SQLモジュール
module "cloud_sql" {
  source = "../../modules/cloud-sql"
  
  environment      = "staging"
  region           = var.region
  db_tier          = "db-f1-micro"
  disk_size        = 10
  disk_type        = "PD_HDD"
  vpc_network_id   = module.vpc.vpc_id
  db_user          = var.db_user
  db_password      = var.db_password
  deletion_protection = false
  
  depends_on = [time_sleep.wait_for_vpc_connection]
}

# Cloud Run - フロントエンド
# 初回デプロイ時は create_service = false に設定し、
# イメージをビルド・プッシュしてから create_service = true に変更して再適用してください
module "frontend" {
  source = "../../modules/cloud-run"
  
  service_name         = "majong-app-frontend"
  environment          = "staging"
  region               = var.region
  image                = var.frontend_image
  container_port       = 80
  cpu_limit            = "1"
  memory_limit         = "512Mi"
  container_concurrency = 80
  max_instances        = "1"
  min_instances        = "0"
  create_service       = true  # イメージ準備完了後、true に変更
  env_vars             = {
    NODE_ENV = "staging"
    VITE_API_BASE_URL = module.backend.service_url != "" ? module.backend.service_url : "https://majong-app-backend-staging-xnzmyhq26q-uw.a.run.app"
  }
  
  depends_on = [module.backend]
}

# Cloud Run - バックエンド
# 初回デプロイ時は create_service = false に設定し、
# イメージをビルド・プッシュしてから create_service = true に変更して再適用してください
module "backend" {
  source = "../../modules/cloud-run"
  
  service_name         = "majong-app-backend"
  environment          = "staging"
  region               = var.region
  image                = var.backend_image
  container_port       = 3000
  cpu_limit            = "1"
  memory_limit         = "512Mi"
  container_concurrency = 80
  max_instances        = "1"
  min_instances        = "0"
  create_service       = true  # 初回デプロイ時は false、イメージ準備後に true に変更
  env_vars             = {
    NODE_ENV     = "staging"
    DATABASE_URL = "postgresql://${var.db_user}:${var.db_password}@${module.cloud_sql.private_ip}:5432/majong_db"
  }
}

