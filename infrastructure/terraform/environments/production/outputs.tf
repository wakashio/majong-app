output "frontend_url" {
  description = "Frontend Cloud Run service URL"
  value       = module.frontend.service_url
}

output "backend_url" {
  description = "Backend Cloud Run service URL"
  value       = module.backend.service_url
}

output "database_connection_name" {
  description = "Cloud SQL connection name"
  value       = module.cloud_sql.connection_name
}

output "database_private_ip" {
  description = "Cloud SQL private IP address"
  value       = module.cloud_sql.private_ip
}

