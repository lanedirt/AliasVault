---
layout: default
title: Manual Setup
parent: Advanced
nav_order: 3
---

# Manual Setup

If you prefer to manually set up AliasVault, this README provides step-by-step instructions. Follow these steps if you prefer to execute all statements yourself.

## Prerequisites

- Docker and Docker Compose installed on your system
- OpenSSL for generating random passwords

## Steps

1. **Clone the git repository**
   ```
   # Clone repository
   git clone https://github.com/lanedirt/AliasVault.git

   # Navigate to the AliasVault directory
   cd AliasVault
   ```

1. **Create required directories**

   Create the following directories in your project root:
   ```bash
   mkdir -p certificates/ssl certificates/app database/postgres
   ```

2. **Create .env file**

   Copy the `.env.example` file to create a new `.env` file:
   ```bash
   cp .env.example .env
   ```

3. **Set all required settings in .env**

   Open the .env file in your favorite text editor and follow the instructions to fill in all
   required variables.

4. **Set default ports**

   Update the .env file with the ports you want to use for the AliasVault components. The values defined here are used by the docker-compose.yml file.
   ```bash
   HTTP_PORT=80
   HTTPS_PORT=443
   SMTP_PORT=25
   SMTP_TLS_PORT=587
   ```

5. **Generate and set JWT_KEY**

   Generate a random 32-char string for JWT token generation:
   ```bash
   openssl rand -base64 32
   ```

   Add the generated key to the .env file:
   ```bash
   JWT_KEY=your_generated_key_here
   ```

6. **Generate and set DATA_PROTECTION_CERT_PASS**

   Generate a random password for the data protection certificate:
   ```bash
   openssl rand -base64 32
   ```

   Add it to the .env file:
   ```bash
   DATA_PROTECTION_CERT_PASS=your_generated_password_here
   ```

7. **Configure PostgreSQL Settings**

   Set the following PostgreSQL-related variables in your .env file:
   ```bash
   # Database name (default: aliasvault)
   POSTGRES_DB=aliasvault

   # Database user (default: aliasvault)
   POSTGRES_USER=aliasvault

   # Generate a secure password for PostgreSQL
   POSTGRES_PASSWORD=$(openssl rand -base64 32)
   ```

8. **Set PRIVATE_EMAIL_DOMAINS**

   Update the .env file with allowed email domains. Use DISABLED.TLD to disable email support:
   ```bash
   PRIVATE_EMAIL_DOMAINS=yourdomain.com,anotherdomain.com
   ```
   Or to disable email:
   ```bash
   PRIVATE_EMAIL_DOMAINS=DISABLED.TLD
   ```

9. **Set SUPPORT_EMAIL (Optional)**

   Add a support email address if desired:
   ```bash
   SUPPORT_EMAIL=support@yourdomain.com
   ```

10. **Generate admin password**

   Build the Docker image for password hashing:
   ```bash
   docker build -t installcli -f src/Utilities/AliasVault.InstallCli/Dockerfile .
   ```

   Generate the password hash:
   ```bash
   docker run --rm installcli "your_preferred_admin_password_here"
   ```

   Add the password hash and generation timestamp to the .env file:
   ```bash
   ADMIN_PASSWORD_HASH=<output_from_previous_command>
   ADMIN_PASSWORD_GENERATED=2024-01-01T00:00:00Z
   ```

11. **Optional configuration**
   Enable or disable public registration of new users:
   ```bash
   PUBLIC_REGISTRATION_ENABLED=false
   ```

12. **Build and start Docker containers**

    Build the Docker Compose stack:
    ```bash
    docker compose -f docker-compose.yml -f docker-compose.build.yml build
    ```

    Start the Docker Compose stack:
    ```bash
    docker compose -f docker-compose.yml -f docker-compose.build.yml up -d
    ```

13. **Access AliasVault**

    AliasVault should now be running. You can access it at:

    - Admin Panel: https://localhost/admin
        - Username: admin
        - Password: [Use the password you set in step 9]

    - Client Website: https://localhost/
        - Create your own account from here

## Important Notes

- Make sure to save both the admin password and PostgreSQL password in a secure location.
- If you need to reset the admin password in the future, repeat step 9 and restart the Docker containers.
- Always keep your .env file secure and do not share it, as it contains sensitive information.
- The PostgreSQL data is persisted in the `database/postgres` directory.

## Troubleshooting

If you encounter any issues during the setup:

1. Check the Docker logs:
   ```bash
   docker compose logs
   ```
2. Ensure all required ports (80, 443, and 5432) are available and not being used by other services.
3. Verify that all environment variables in the .env file are set correctly.
4. Check PostgreSQL container logs specifically:
   ```bash
   docker compose logs postgres
   ```

For more detailed troubleshooting information, please refer to the full [troubleshooting guide](../troubleshooting.md).
