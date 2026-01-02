output "service_url" {
  description = "Cloud Run service URL"
  value       = var.create_service ? google_cloud_run_service.service[0].status[0].url : ""
}

output "service_name" {
  description = "Cloud Run service name"
  value       = var.create_service ? google_cloud_run_service.service[0].name : ""
}

