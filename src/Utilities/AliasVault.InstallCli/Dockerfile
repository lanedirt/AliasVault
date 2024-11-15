FROM mcr.microsoft.com/dotnet/runtime:9.0 AS base
WORKDIR /app

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy csproj files and restore as distinct layers
COPY ["src/Utilities/AliasVault.InstallCli/AliasVault.InstallCli.csproj", "src/Utilities/AliasVault.InstallCli/"]
COPY ["src/Databases/AliasServerDb/AliasServerDb.csproj", "src/Databases/AliasServerDb/"]
RUN dotnet restore "src/Utilities/AliasVault.InstallCli/AliasVault.InstallCli.csproj"

# Copy the entire source code
COPY . .

# Build the project
RUN dotnet build "src/Utilities/AliasVault.InstallCli/AliasVault.InstallCli.csproj"  \
    -c "$BUILD_CONFIGURATION" -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "src/Utilities/AliasVault.InstallCli/AliasVault.InstallCli.csproj"  \
    -c "$BUILD_CONFIGURATION" -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "AliasVault.InstallCli.dll"]
