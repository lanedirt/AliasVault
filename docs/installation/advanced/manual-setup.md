---
layout: default
title: Manual Setup
parent: Advanced
nav_order: 1
---

# Manual Setup

If you prefer to manually set up AliasVault instead of using the `install.sh` script, this README provides step-by-step instructions.

{: .toc }
* TOC
{:toc}

---

## Prerequisites

- Docker and Docker Compose installed on your system
- Knowledge of working with direct Docker commands
- Knowledge of .env files
- OpenSSL for generating random passwords

## Steps

1. **Clone the git repository**
   ```bash
   # Clone repository
   git clone https://github.com/lanedirt/AliasVault.git

   # Navigate to the AliasVault directory
   cd AliasVault
   ```

2. **Create required directories**

   Create the following directories in your project root:
   ```bash
   # Create required directories
   mkdir -p certificates/ssl certificates/app database/postgres
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

   By default, the AliasVault private email domains feature is disabled. If you wish to enable this so you can use your own private domains to create email aliases with, please read the `Email Server Setup` section in the main installation guide [Basic Install](../install.md#3-email-server-setup).

   For more information, read the article explaining the differences between AliasVault's [private and public domains](../../misc/private-vs-public-email.md).


## Important Notes

- Make sure to save both the admin password and PostgreSQL password in a secure location.
- Always keep your .env file secure and do not share it, as it contains sensitive information.
- The PostgreSQL data is persisted in the `database/postgres` directory.
- The docker-compose.yml file uses the `:latest` tag for containers by default. This means it always uses the latest available AliasVault version. In order to update AliasVault to a newer version at a later time, you can pull new containers when they are available with this command:
```
docker compose pull && docker compose down && docker compose up -d
```

## Troubleshooting
If you encounter any issues during the setup:

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
