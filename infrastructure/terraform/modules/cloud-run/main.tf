# Cloud Runモジュール
resource "google_cloud_run_service" "service" {
  count    = var.create_service ? 1 : 0
  name     = "${var.service_name}-${var.environment}"
  location = var.region

  template {
    spec {
      containers {
        image = var.image
        ports {
          container_port = var.container_port
        }
        
        resources {
          limits = {
            cpu    = var.cpu_limit
            memory = var.memory_limit
          }
        }

        dynamic "env" {
          for_each = var.env_vars
          content {
            name  = env.key
            value = env.value
          }
        }
      }
      container_concurrency = var.container_concurrency
    }
    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale" = var.max_instances
        "autoscaling.knative.dev/minScale" = var.min_instances
        # 初回デプロイ時、イメージが存在しない場合でもサービスを作成できるようにする
        "run.googleapis.com/launch-stage" = "BETA"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  lifecycle {
    # イメージが存在しない場合でもリソースを作成できるようにする
    # 実際のイメージは後でビルド・プッシュしてから更新する
    ignore_changes = [
      template[0].spec[0].containers[0].image,
      template[0].metadata[0].annotations
    ]
    # リビジョンの失敗を無視する（初回デプロイ時）
    create_before_destroy = true
  }
}

resource "google_cloud_run_service_iam_member" "public_access" {
  count    = var.create_service ? 1 : 0
  service  = google_cloud_run_service.service[0].name
  location = google_cloud_run_service.service[0].location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

