#!/bin/sh

# Apply database migrations using the bundle
echo "Running database migrations..."
/app/aliasVault/migrationbundle

# Start the application
echo "Starting application..."
dotnet /app/aliasVault/AliasVault.dll
