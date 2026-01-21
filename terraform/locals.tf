locals {
  name_prefix = "${var.environment}-app"
  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
}