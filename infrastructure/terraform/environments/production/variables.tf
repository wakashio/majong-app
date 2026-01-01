variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-west1"
}

variable "db_user" {
  description = "Database user name"
  type        = string
  default     = "majong_user"
}

variable "db_password" {
  description = "Database user password"
  type        = string
  sensitive   = true
}

variable "frontend_image" {
  description = "Frontend container image URL"
  type        = string
  default     = "gcr.io/PROJECT_ID/majong-app-frontend:latest"
}

variable "backend_image" {
  description = "Backend container image URL"
  type        = string
  default     = "gcr.io/PROJECT_ID/majong-app-backend:latest"
}

