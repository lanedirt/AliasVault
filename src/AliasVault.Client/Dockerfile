FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app

FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG TARGETARCH
ARG BUILD_CONFIGURATION=Release
ENV DOTNET_CLI_TELEMETRY_OPTOUT=1
ENV MSBUILDDEBUGPATH=/src/msbuild-logs
WORKDIR /source

# Install Python which is required by the WebAssembly tools
RUN apt-get update && apt-get install -y python3 && apt-get clean

# Install the WebAssembly tools
RUN dotnet workload install wasm-tools

# Copy all project files first
COPY ["src/AliasVault.Client/AliasVault.Client.csproj", "src/AliasVault.Client/"]
COPY ["src/Databases/AliasClientDb/AliasClientDb.csproj", "src/Databases/AliasClientDb/"]
COPY ["src/Utilities/Cryptography/AliasVault.Cryptography.Client/AliasVault.Cryptography.Client.csproj", "src/Utilities/Cryptography/AliasVault.Cryptography.Client/"]
COPY ["src/Utilities/AliasVault.FaviconExtractor/AliasVault.FaviconExtractor.csproj", "src/Utilities/AliasVault.FaviconExtractor/"]
COPY ["src/Generators/AliasVault.Generators.Identity/AliasVault.Generators.Identity.csproj", "src/Generators/AliasVault.Generators.Identity/"]
COPY ["src/Utilities/AliasVault.CsvImportExport/AliasVault.CsvImportExport.csproj", "src/Utilities/AliasVault.CsvImportExport/"]
COPY ["src/Shared/AliasVault.Shared/AliasVault.Shared.csproj", "src/Shared/AliasVault.Shared/"]
COPY ["src/Shared/AliasVault.Shared.Core/AliasVault.Shared.Core.csproj", "src/Shared/AliasVault.Shared.Core/"]
COPY ["src/Generators/AliasVault.Generators.Password/AliasVault.Generators.Password.csproj", "src/Generators/AliasVault.Generators.Password/"]
COPY ["src/Shared/AliasVault.RazorComponents/AliasVault.RazorComponents.csproj", "src/Shared/AliasVault.RazorComponents/"]

# Restore all packages
RUN dotnet restore "src/AliasVault.Client/AliasVault.Client.csproj" -a $TARGETARCH

# Copy everything else and build
COPY . .
RUN dotnet publish "src/AliasVault.Client/AliasVault.Client.csproj" \
    -a $TARGETARCH \
    -c "$BUILD_CONFIGURATION" \
    --no-restore \
    -o /app/publish \
    /p:UseAppHost=false

# Final stage
FROM nginx:1.24.0-alpine
WORKDIR /usr/share/nginx/html
COPY --from=build /app/publish/wwwroot .
COPY src/AliasVault.Client/nginx.conf /etc/nginx/nginx.conf
COPY src/AliasVault.Client/entrypoint.sh /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh

EXPOSE 3000
ENV ASPNETCORE_URLS=http://+:3000
ENTRYPOINT ["/app/entrypoint.sh"]
