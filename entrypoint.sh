#!/bin/sh

# Apply database migrations using the bundle
echo "Running database migrations..."
/app/AliasVault/migrationbundle

# Start the application
echo "Starting application..."
dotnet /app/AliasVault/AliasVault.dll
