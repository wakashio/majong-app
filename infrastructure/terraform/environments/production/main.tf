# 本番環境のメイン設定
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
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
  
  environment = "production"
  region      = var.region
  subnet_cidr = "10.0.1.0/24"
}

# Cloud SQLモジュール
module "cloud_sql" {
  source = "../../modules/cloud-sql"
  
  environment      = "production"
  region           = var.region
  db_tier          = "db-f1-micro"
  disk_size        = 10
  disk_type        = "PD_HDD"
  vpc_network_id   = module.vpc.vpc_id
  db_user          = var.db_user
  db_password      = var.db_password
  deletion_protection = true
}

# Cloud Run - フロントエンド
module "frontend" {
  source = "../../modules/cloud-run"
  
  service_name         = "majong-app-frontend"
  environment          = "production"
  region               = var.region
  image                = var.frontend_image
  container_port       = 80
  cpu_limit            = "1"
  memory_limit         = "512Mi"
  container_concurrency = 80
  max_instances        = "1"
  min_instances        = "0"
  env_vars             = {
    NODE_ENV = "production"
  }
}

# Cloud Run - バックエンド
module "backend" {
  source = "../../modules/cloud-run"
  
  service_name         = "majong-app-backend"
  environment          = "production"
  region               = var.region
  image                = var.backend_image
  container_port       = 3000
  cpu_limit            = "1"
  memory_limit         = "512Mi"
  container_concurrency = 80
  max_instances        = "1"
  min_instances        = "0"
  env_vars             = {
    NODE_ENV     = "production"
    DATABASE_URL = "postgresql://${var.db_user}:${var.db_password}@${module.cloud_sql.private_ip}:5432/majong_db"
  }
}

