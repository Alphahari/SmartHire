module "gce_instance" {
  source = "./modules/gce-instance"

  name         = "${local.name_prefix}-vm"
  zone         = var.zone
  machine_type = var.machine_type
  subnet       = "default"
  labels       = local.labels
} 