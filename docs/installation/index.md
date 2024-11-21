---
layout: default
title: Installation Guide
nav_order: 2
---

# Installation
Follow the steps below to install AliasVault on your own server. Minimum experience with Docker and Linux is required.

{: .toc }
* TOC
{:toc}

---

## Basic Installation
To get AliasVault up and running quickly, run the install script to pull pre-built Docker images. The install script will also configure the .env file and start the AliasVault containers. You can get up and running in less than 5 minutes.

### Hardware requirements
- Linux VM with root access (Ubuntu or RHEL based distros recommended)
- 1 vCPU
- 512MB RAM
- 16GB disk space
- Docker installed

### Installation steps
1. Download the install script
```bash
curl -o install.sh https://raw.githubusercontent.com/lanedirt/AliasVault/main/install.sh
```
2. Make the install script executable and run it. This will create the .env file, pull the Docker images, and start the AliasVault containers. Follow the on-screen prompts to configure AliasVault.
```bash
chmod +x install.sh
./install.sh install
```
3. After the script completes, you can access AliasVault at:
  - Client: `https://localhost`
  - Admin: `https://localhost/admin`

---

## SSL configuration
The default installation will create a self-signed SSL certificate and configure Nginx to use it.

You can however also use Let's Encrypt to generate valid SSL certificates and configure Nginx to use it. In order to make this work you will need the following:

- A public IPv4 address assigned to your server
- Port 80 and 443 on your server must be open and accessible from the internet
- A registered domain name with an A record pointing to your server's public IP address (e.g. mydomain.com)


### Steps

1. Run the install script with the `configure-ssl` option
```bash
./install.sh configure-ssl
```
2. Follow the prompts to configure Let's Encrypt.

### Reverting to self-signed SSL
If at any point you would like to revert to the self-signed SSL certificate, run the install script again with the `configure-ssl` option
and then in the prompt choose option 2.

---

## Miscellaneous

### Resetting the admin password
If you have lost your admin password, you can reset it by running the install script with the `reset-password` option. This will generate a new random password and update the .env file with it. After that it will restart the AliasVault containers to apply the changes.
```bash
./install.sh reset-password
```