variable "service_name" {
  description = "Cloud Run service name"
  type        = string
}

variable "environment" {
  description = "Environment name (staging or production)"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-west1"
}

variable "image" {
  description = "Container image URL"
  type        = string
}

variable "container_port" {
  description = "Container port"
  type        = number
  default     = 8080
}

variable "cpu_limit" {
  description = "CPU limit"
  type        = string
  default     = "1"
}

variable "memory_limit" {
  description = "Memory limit"
  type        = string
  default     = "512Mi"
}

variable "container_concurrency" {
  description = "Container concurrency"
  type        = number
  default     = 80
}

variable "max_instances" {
  description = "Maximum number of instances"
  type        = string
  default     = "1"
}

variable "min_instances" {
  description = "Minimum number of instances"
  type        = string
  default     = "0"
}

variable "env_vars" {
  description = "Environment variables"
  type        = map(string)
  default     = {}
}

variable "create_service" {
  description = "Whether to create the Cloud Run service (set to false for initial deployment without images)"
  type        = bool
  default     = true
}

