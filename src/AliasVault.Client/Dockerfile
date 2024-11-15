FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
ENV DOTNET_CLI_TELEMETRY_OPTOUT=1
ENV MSBUILDDEBUGPATH=/src/msbuild-logs
WORKDIR /src

# Create the debug directory
RUN mkdir -p /src/msbuild-logs

# Install Python which is required by the WebAssembly tools
RUN apt-get update && apt-get install -y python3 && apt-get clean

# Install the WebAssembly tools
RUN dotnet workload install wasm-tools

# Copy the project files and restore dependencies
COPY ["src/AliasVault.Client/AliasVault.Client.csproj", "src/AliasVault.Client/"]
RUN dotnet restore "src/AliasVault.Client/AliasVault.Client.csproj"
COPY . .

# Build the Client project
WORKDIR "/src/src/AliasVault.Client"
RUN dotnet build "AliasVault.Client.csproj" -c "$BUILD_CONFIGURATION" -o /app/build

# Publish the Client project
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "AliasVault.Client.csproj" -c "$BUILD_CONFIGURATION" -o /app/publish /p:UseAppHost=false

# Final stage
FROM nginx:1.24.0 AS final
WORKDIR /usr/share/nginx/html
COPY --from=publish /app/publish/wwwroot .
COPY /src/AliasVault.Client/nginx.conf /etc/nginx/nginx.conf
COPY /src/AliasVault.Client/entrypoint.sh /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh

EXPOSE 3000
ENV ASPNETCORE_URLS=http://+:3000
ENTRYPOINT ["/app/entrypoint.sh"]
