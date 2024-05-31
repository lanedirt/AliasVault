#!/bin/bash

# Apply database migrations
dotnet ef database update

# Start the application
exec dotnet "AliasVault.dll"
