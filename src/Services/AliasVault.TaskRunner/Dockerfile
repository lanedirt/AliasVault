FROM mcr.microsoft.com/dotnet/runtime:9.0 AS base
WORKDIR /app

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy the project files and restore dependencies
COPY ["src/Services/AliasVault.TaskRunner/AliasVault.TaskRunner.csproj", "src/Services/AliasVault.TaskRunner/"]
RUN dotnet restore "./src/Services/AliasVault.TaskRunner/AliasVault.TaskRunner.csproj"
COPY . .

# Build and publish the application
WORKDIR "/src/src/Services/AliasVault.TaskRunner"
RUN dotnet publish "./AliasVault.TaskRunner.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "AliasVault.TaskRunner.dll"]
