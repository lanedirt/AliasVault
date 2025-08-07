#!/bin/sh

# Create SSL directory if it doesn't exist
mkdir -p /app/ssl

# Generate self-signed SSL certificate if not exists
if [ ! -f /app/ssl/admin.crt ] || [ ! -f /app/ssl/admin.key ]; then
    echo "Generating new SSL certificate (10 years validity)..."
    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
        -keyout /app/ssl/admin.key \
        -out /app/ssl/admin.crt \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

    # Set proper permissions
    chmod 644 /app/ssl/admin.crt
    chmod 600 /app/ssl/admin.key

    # Create PFX for ASP.NET Core
    openssl pkcs12 -export -out /app/ssl/admin.pfx \
        -inkey /app/ssl/admin.key \
        -in /app/ssl/admin.crt \
        -password pass:YourSecurePassword
fi

export ASPNETCORE_Kestrel__Certificates__Default__Path=/app/ssl/admin.pfx
export ASPNETCORE_Kestrel__Certificates__Default__Password=YourSecurePassword

# Start the application
dotnet AliasVault.Admin.dll