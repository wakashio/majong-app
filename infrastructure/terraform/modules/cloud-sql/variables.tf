variable "environment" {
  description = "Environment name (staging or production)"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-west1"
}

variable "db_tier" {
  description = "Database instance tier"
  type        = string
  default     = "db-f1-micro"
}

variable "disk_size" {
  description = "Disk size in GB"
  type        = number
  default     = 10
}

variable "disk_type" {
  description = "Disk type (PD_SSD or PD_HDD)"
  type        = string
  default     = "PD_HDD"
}

variable "vpc_network_id" {
  description = "VPC network ID for private IP"
  type        = string
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

variable "deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = false
}

