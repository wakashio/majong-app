# Cloud SQLモジュール
resource "google_sql_database_instance" "db" {
  name             = "majong-app-db-${var.environment}"
  database_version = "POSTGRES_16"
  region           = var.region

  # サービスネットワーキング接続の完了を待つ
  # 注意: サービスネットワーキング接続は非同期で完了するため、
  # 初回デプロイ時には数分かかることがあります
  depends_on = []

  settings {
    tier              = var.db_tier
    availability_type = "ZONAL"
    disk_size         = var.disk_size
    disk_type         = var.disk_type
    
    backup_configuration {
      enabled    = true
      start_time = "03:00"
    }

    ip_configuration {
      ipv4_enabled    = false
      private_network = var.vpc_network_id
    }

    database_flags {
      name  = "max_connections"
      value = "100"
    }
  }

  deletion_protection = var.deletion_protection
}

resource "google_sql_database" "database" {
  name     = "majong_db"
  instance = google_sql_database_instance.db.name
}

resource "google_sql_user" "db_user" {
  name     = var.db_user
  instance = google_sql_database_instance.db.name
  password = var.db_password
}

