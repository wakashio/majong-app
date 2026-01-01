output "instance_name" {
  description = "Cloud SQL instance name"
  value       = google_sql_database_instance.db.name
}

output "connection_name" {
  description = "Cloud SQL connection name"
  value       = google_sql_database_instance.db.connection_name
}

output "private_ip" {
  description = "Private IP address"
  value       = google_sql_database_instance.db.private_ip_address
}

