#!/bin/sh

# Apply database migrations using the bundle
echo "Running database migrations..."
/app/migrationbundle

# Start the application
echo "Starting application..."
dotnet /app/AliasVault.Api.dll
