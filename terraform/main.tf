# --- RED ---
resource "oci_core_vcn" "portfolio_vcn" {
  cidr_block     = "10.0.0.0/16"
  compartment_id = var.compartment_ocid
  display_name   = "portfolio-vcn"
}

resource "oci_core_internet_gateway" "portfolio_igw" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.portfolio_vcn.id
  display_name   = "portfolio-igw"
}

resource "oci_core_route_table" "portfolio_rt" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.portfolio_vcn.id
  display_name   = "portfolio-rt"
  route_rules {
    destination       = "0.0.0.0/0"
    network_entity_id = oci_core_internet_gateway.portfolio_igw.id
  }
}

resource "oci_core_security_list" "portfolio_sl" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.portfolio_vcn.id
  display_name   = "portfolio-security-list"

  egress_security_rules {
    destination = "0.0.0.0/0"
    protocol    = "all"
  }

  dynamic "ingress_security_rules" {
    for_each = [22, 80, 443]
    content {
      source   = "0.0.0.0/0"
      protocol = "6"
      tcp_options {
        max = ingress_security_rules.value
        min = ingress_security_rules.value
      }
    }
  }
}

resource "oci_core_subnet" "portfolio_subnet" {
  cidr_block        = "10.0.1.0/24"
  compartment_id    = var.compartment_ocid
  vcn_id            = oci_core_vcn.portfolio_vcn.id
  route_table_id    = oci_core_route_table.portfolio_rt.id
  security_list_ids = [oci_core_security_list.portfolio_sl.id]
  display_name      = "portfolio-public-subnet"
}

# --- IMAGEN Y CÓMPUTO ---
data "oci_core_images" "oracle_linux" {
  compartment_id           = var.compartment_ocid
  operating_system         = "Oracle Linux"
  operating_system_version = "9"
  shape                    = "VM.Standard.A1.Flex"
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}

data "oci_identity_availability_domains" "ads" {
  compartment_id = var.tenancy_ocid
}

resource "oci_core_instance" "portfolio_vm" {
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  compartment_id      = var.compartment_ocid
  display_name        = "portfolio-web-server"

  shape = "VM.Standard.A1.Flex"

  shape_config {
    ocpus         = 4
    memory_in_gbs = 24
  }

  source_details {
    source_id   = data.oci_core_images.oracle_linux.images[0].id
    source_type = "image"
  }

  create_vnic_details {
    subnet_id        = oci_core_subnet.portfolio_subnet.id
    assign_public_ip = true
  }

  metadata = {
    user_data = base64encode(<<-EOF
      #!/bin/bash
      dnf install -y nginx
      systemctl enable --now nginx
      firewall-cmd --permanent --add-service=http
      firewall-cmd --permanent --add-service=https
      firewall-cmd --reload

      useradd -m -s /bin/bash deployer
      mkdir -p /home/deployer/.ssh
      echo "${var.ssh_public_key}" >> /home/deployer/.ssh/authorized_keys
      chown -R deployer:deployer /home/deployer/.ssh
      chmod 700 /home/deployer/.ssh
      chmod 600 /home/deployer/.ssh/authorized_keys

      # ESTAS DOS LÍNEAS CAMBIARON PARA DAR PERMISOS TOTALES A DEPLOYER
      chown -R deployer:deployer /usr/share/nginx/html
      chmod -R 755 /usr/share/nginx/html
    EOF
    )
  }
}
