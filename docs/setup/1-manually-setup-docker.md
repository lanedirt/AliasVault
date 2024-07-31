# Manual Setup Instructions for AliasVault

This README provides step-by-step instructions for manually setting up AliasVault without using the `install.sh` script. Follow these steps if you prefer to execute all statements yourself.

## Prerequisites

- Docker and Docker Compose installed on your system
- OpenSSL for generating random passwords

## Steps

1. **Create .env file**

   Copy the `.env.example` file to create a new `.env` file:
   ```
   cp .env.example .env
   ```

2. **Generate and set JWT_KEY**

   Update the .env file and set the JWT_KEY environment variable to a random 32-char string. This key is used for JWT token generation and should be kept secure.

   Generate a random 32 char string for the JWT:
   ```
   openssl rand -base64 32
   ```

    Add the generated key to the .env file:

   ```
    JWT_KEY=your_32_char_string_here

3. **Set PRIVATE_EMAIL_DOMAINS**

   Update the .env file and set the PRIVATE_EMAIL_DOMAINS value the allowed domains that can be used for email addresses. Separate multiple domains with commas.
   ```
   PRIVATE_EMAIL_DOMAINS=yourdomain.com,anotherdomain.com
   ```
   Replace `yourdomain.com,anotherdomain.com` with your actual allowed domains.

4. **Set SMTP_TLS_ENABLED**

   Decide whether to enable TLS for email and add it to the .env file:
   ```
   SMTP_TLS_ENABLED=true
   ```
   Or set it to `false` if you don't want to enable TLS.

5. **Generate admin password**

   Set the admin password hash in the .env file. The password hash is generated using the `InitializationCLI` utility.

   Build the Docker image for password hashing:
   ```
   docker build -t initcli -f src/Utilities/InitializationCLI/Dockerfile .
   ```

   Generate the password hash:
   ```
   docker run --rm initcli "<your_prefered_admin_password_here>"
   ```

   Add the password hash and generation timestamp to the .env file:
   ```
   ADMIN_PASSWORD_HASH=<output_of_step_above>
   ADMIN_PASSWORD_GENERATED=2024-01-01T00:00:00Z
   ```

6. **Build and start Docker containers**

   Build the Docker Compose stack:
   ```
   docker-compose build
   ```

   Start the Docker Compose stack:
   ```
   docker-compose up -d
   ```

7. **Access AliasVault**

   AliasVault should now be running. You can access it as follows:

    - Admin Panel: http://localhost:8080/
        - Username: admin
        - Password: [Use the ADMIN_PASSWORD generated in step 5]

    - Client Website: http://localhost:80/
        - Create your own account from here

## Important Notes

- Make sure to save the admin password (ADMIN_PASSWORD) generated in step 5 in a secure location. It won't be shown again.
- If you need to reset the admin password in the future, you'll need to generate a new hash and update the .env file manually.
Afterwards restart the docker containers which will update the admin password in the database.
- Always keep your .env file secure and do not share it, as it contains sensitive information.

## Troubleshooting

If you encounter any issues during the setup:

1. Check the Docker logs:
   ```
   docker-compose logs
   ```
2. Ensure all required ports (8080 and 80) are available and not being used by other services.
3. Verify that all environment variables in the .env file are set correctly.

For further assistance, please refer to the project documentation or seek support through the appropriate channels.
