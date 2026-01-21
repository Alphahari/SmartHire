variable "name" {
  type = string
}

variable "zone" {
  type = string
}

variable "machine_type" {
  type    = string
  default = "e2-small"
}

variable "image" {
  type    = string
  default = "projects/ubuntu-os-cloud/global/images/ubuntu-minimal-2510-questing-amd64-v20260114"
}

variable "disk_size" {
  type    = number
  default = 30
}

variable "disk_type" {
  type    = string
  default = "pd-balanced"
}

variable "subnet" {
  type = string
}

variable "service_account" {
  type    = string
  default = null
}

variable "labels" {
  type = map(string)
}