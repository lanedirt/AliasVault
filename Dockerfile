# Use the official .NET 8 SDK image to build the app
FROM mcr.microsoft.com/dotnet/sdk:8.0  AS build
WORKDIR /src

# Copy the solution file to the /src directory in the container
COPY aliasVault.sln ./

# Copy the project file to the /src/AliasVault directory in the container
COPY src/AliasVault/AliasVault.csproj ./AliasVault/

# Restore dependencies for the AliasVault project
RUN dotnet restore "./AliasVault/AliasVault.csproj" --verbosity detailed

# Copy the rest of the application code to the /src directory in the container
COPY src/. ./

# Publish the application to the /app/publish directory in the container
WORKDIR /src/AliasVault
RUN dotnet publish -c Release -o /app --verbosity detailed

# Create the migration bundle
# Install the Entity Framework Core CLI tool and run migrations to create the database
RUN dotnet tool install --global dotnet-ef --version 8.0.5
RUN /root/.dotnet/tools/dotnet-ef migrations bundle -o /app/migrationbundle

# Use the official ASP.NET Core runtime image to run the app
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app/aliasVault

# Copy the published output from the build stage to the runtime stage
COPY --from=build /app ./

# Expose the port the app runs on
EXPOSE 8080

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
