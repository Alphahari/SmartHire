# VPC Network
resource "google_compute_network" "vpc" {
  name                    = "smarthire-${var.env}-vpc"
  auto_create_subnetworks = false
}

# Subnet
resource "google_compute_subnetwork" "subnet" {
  name          = "smarthire-${var.env}-subnet"
  region        = var.region
  ip_cidr_range = var.subnet_cidr
  network       = google_compute_network.vpc.id
}

# Firewall Rules
resource "google_compute_firewall" "allow_web" {
  name    = "smarthire-${var.env}-allow-web"
  network = google_compute_network.vpc.name

  direction = "INGRESS"
  priority  = 1000

  allow {
    protocol = "tcp"
    ports    = ["80", "443", "8080", "9000"]
  }

  source_ranges = ["0.0.0.0/0"]

  target_tags = ["smarthire-app"]
}

resource "google_compute_firewall" "allow_iap_ssh" {
  name    = "smarthire-${var.env}-allow-iap-ssh"
  network = google_compute_network.vpc.name

  direction = "INGRESS"

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = ["35.235.240.0/20"]

  target_tags = ["smarthire-app"]
}
# Compute Instance
resource "google_compute_instance" "vm" {
  name         = var.instance_name
  machine_type = var.machine_type
  zone         = var.zone
  allow_stopping_for_update = true
  tags = ["smarthire-app"]

  boot_disk {
    initialize_params {
      image = var.image
      size  = var.boot_disk_size_gb
      type  = "pd-balanced"
    }
  }

  network_interface {
    network    = google_compute_network.vpc.id
    subnetwork = google_compute_subnetwork.subnet.id

    access_config {}
  }

  service_account {
    email  = var.service_account_email
    scopes = ["https://www.googleapis.com/auth/cloud-platform"]
  }

  metadata = {
    enable-oslogin = "TRUE"
  }
}