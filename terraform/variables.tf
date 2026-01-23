variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "env" {
  description = "Environment name (dev, prod)"
  type        = string
}

variable "region" {
  type = string
}

variable "zone" {
  type = string
}

variable "instance_name" {
  type = string
}

variable "machine_type" {
  type = string
}

variable "image" {
  description = "GCE boot image"
  type        = string
}

variable "subnet_cidr" {
  description = "CIDR range for subnet"
  type        = string
}

variable "boot_disk_size_gb" {
  description = "Boot disk size in GB"
  type        = number
}

variable "service_account_email" {
  description = "Service account email attached to the compute instance"
  type        = string
}
