---
layout: default
title: Manual Setup
parent: Self-hosting
nav_order: 6
---

# Manual Setup

If you prefer to manually set up AliasVault instead of using the `install.sh` script, this README provides step-by-step instructions.

**Prerequisities:**
- Docker (20.10+) and Docker Compose (2.0+) installed on your system
  - See instructions: [https://docs.docker.com/engine/install/](https://docs.docker.com/engine/install/)
- Knowledge of working with direct Docker commands
- Knowledge of .env files
- OpenSSL for generating random passwords

---

{: .toc }
* TOC
{:toc}

---


## Steps
Follow these steps to manually install AliasVault on your own server.

1. **Clone the git repository**
   ```bash
   # Clone repository
   git clone https://github.com/aliasvault/aliasvault.git

   # Navigate to the AliasVault directory
   cd aliasvault
   ```

2. **Create required directories**

   Create the following directories in your project root:
   ```bash
   # Create required directories
   mkdir -p certificates/ssl database/postgres
   ```

3. **Create .env file**

   ```bash
   # Copy the .env.example file to create a new .env file
   cp .env.example .env
   ```

4. **Set all required settings in .env**

   Open the .env file in your favorite text editor and fill in all required variables
   by following the instructions inside the file.

   ```bash
   # Open the .env file with your favorite editor, e.g. nano.
   nano .env
   ```

5. **Start the docker containers**

   After you are done configuring your .env file, you can start the Docker Compose stack:
   ```bash
   # Start the docker compose stack
   docker compose up -d
   ```

6. **Access AliasVault**

    AliasVault should now be running. You can access it at:

    - Admin Panel: https://localhost/admin
        - Username: admin
        - Password: [Use the password you set in the .env file]

    - Client Website: https://localhost/
        - Create your own account from here

   > Note: if you changed the default ports from 80/443 to something else in the .env file, use those ports to access AliasVault here.

7. **Configuring private email domains**

   By default, the AliasVault private email domains feature is disabled. If you wish to enable this to use your own private domains to create email aliases with, please read the `Email Server Setup` section in the main installation guide [Basic Install](../install.md#3-email-server-setup).

   For more information, read the article explaining the differences between AliasVault's [private and public domains](../../misc/private-vs-public-email.md).


## Important Notes

- Make sure to save both the admin password and PostgreSQL password in a secure location.
- Always keep your .env file secure and do not share it, as it contains sensitive information.
- The PostgreSQL data is persisted in the `database/postgres` directory.
- The docker-compose.yml file uses the `:latest` tag for containers by default. This means it always uses the latest available AliasVault version. In order to update AliasVault to a newer version at a later time, you can pull new containers when they are available with this command:
```
docker compose pull && docker compose down && docker compose up -d
```

## Using a Custom Reverse Proxy (e.g. Cloudflare Tunnel)

AliasVault includes its own internal reverse proxy (nginx) container that routes traffic to other containers. By default, the built-in nginx container (`reverse-proxy`) makes AliasVault's services available at:

- **Client**: `http://localhost/`
- **API**: `http://localhost/api`
- **Admin**: `http://localhost/admin`

If you want to use your own reverse proxy setup (e.g. with a Cloudflare Tunnel), you **must** ensure the following:

- Your custom proxy/tunnel **points to the AliasVault `reverse-proxy` container**, **not** directly to the client, API, or admin containers.
- The forwarding protocol must be **HTTPS**, since the `reverse-proxy` container listens on port `443` for secure connections.

> ⚠️ Failing to route through the reverse-proxy container correctly will break the app. Errors such as HTTP 502 often indicate a misconfigured reverse proxy.

If you're using **Cloudflare Tunnel**, you will likely encounter TLS verification issues. In that case, go to the Cloudflare dashboard and enable the **"No TLS Verify"** option for your tunnel configuration. This tells Cloudflare to skip certificate validation when connecting to the internal reverse-proxy over HTTPS.


## Troubleshooting
If you encounter any miscellaneous issues during the setup:

1. Check the Docker logs:
   ```bash
   docker compose logs
   ```
2. Ensure all required ports (80, 443, 25, 587 and 5432) are available and not being used by other services.
3. Verify that all variables in the .env file are set correctly.
4. Check PostgreSQL container logs specifically:
   ```bash
   docker compose logs postgres
   ```

For more detailed troubleshooting information, please refer to the full [troubleshooting guide](../troubleshooting.md).

## FAQ
### Why does AliasVault use its own reverse proxy?
AliasVault requires precise routing between its client, API, and admin interfaces. These are structured under `/`, `/api`, and `/admin`. A unified nginx reverse proxy ensures that all AliasVault's containers are accessible under the same hostname and path structure. If you use your own reverse proxy, you must replicate this logic exactly. See the [nginx.conf](https://raw.githubusercontent.com/aliasvault/aliasvault/refs/heads/main/apps/server/nginx.conf) configuration that's used by the official container for reference.
