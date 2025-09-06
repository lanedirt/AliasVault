---
layout: default
title: Self-hosting
nav_order: 2
---

# Self-hosting

AliasVault can be self-hosted on your own servers in two ways.
Both options use Docker, but the workflows differ in flexibility and convenience.
Choose the one that best matches your environment:

[Option 1: install.sh](./installation/install){: .btn .btn-primary .fs-5 .mb-4 .mb-md-0 .mr-2 }
[Option 2: All-In-One Docker Image](https://github.com/aliasvault/aliasvault){: .btn .btn-primary .fs-5 .mb-4 .mb-md-0 }

---

## Option 1: `install.sh` (Managed Multi-Container Stack)

> **Best for:**
> - Proxmox CT/VM
> - DigitalOcean Droplet
> - Hetzner VPS
> - AWS / Azure VM
> - Any other host that is directly accessible from the internet and/or has ports 80/443 forwarded to it, **without existing SSL termination**

This option installs the **full AliasVault stack** (client, API, Postgres, task runner, SMTP, admin, reverse proxy) as multiple Docker containers in the background.

The `install.sh` script provides:
- **Pulling of all required Docker images** and configures Docker Compose automatically
- **Built-in reverse proxy with Let's Encrypt SSL**
- **Easy updates and migrations** via a custom CLI
- **Start/stop/uninstall commands** for convenience
- Allows to build Docker containers from source (optional)
- Opinionated defaults for a secure, production-ready setup

{: .note }
ℹ️ This method is more suitable for **less experienced Linux users**. It still requires some basic knowledge, but the script provides guidance and automates many steps.
👉 Use this option if you want a **managed experience** with automatic SSL and CLI tools.

[Installation guide →](install-vm.md)

---

## Option 2: All-in-One Docker Image

> **Best for:**
> - Home servers (Synology, Unraid, Raspberry Pi, local Docker)
> - Advanced users with their own SSL termination (Traefik, Nginx, HAProxy, Caddy, etc.)
> - Environments where AliasVault runs **behind an existing reverse proxy**

This option runs AliasVault as a **single bundled container** (client, API, Postgres, task runner, SMTP, etc. included).
Unlike `install.sh`, it does **not provide**:
- SSL termination (you must handle HTTPS separately)
- A CLI for updates, migrations, or configuration

Instead, everything is managed via **standard Docker commands**:
- Updates are done manually with `docker pull`
- In some cases, future updates may require **manual migration steps** (these will be documented)
- Certain admin actions (e.g. resetting a password) require **manual container access via SSH**

👉 Use this option if you **already manage SSL**, have an existing host where you are running other Docker apps already, and/or prefer to run AliasVault inside your own reverse proxy setup.

[Docker guide →](install-docker.md)
