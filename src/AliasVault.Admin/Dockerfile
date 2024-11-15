FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 4431

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release

WORKDIR /src

# Copy the project files and restore dependencies
COPY ["src/AliasVault.Admin/AliasVault.Admin.csproj", "src/AliasVault.Admin/"]
RUN dotnet restore "src/AliasVault.Admin/AliasVault.Admin.csproj"
COPY . .

# Build the WebApi project
WORKDIR "/src/src/AliasVault.Admin"
RUN dotnet build "AliasVault.Admin.csproj" -c "$BUILD_CONFIGURATION" -o /app/build

# Publish the application to the /app/publish directory in the container
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "AliasVault.Admin.csproj" -c "$BUILD_CONFIGURATION" -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
COPY /src/AliasVault.Admin/entrypoint.sh /app

# Create SSL directory
RUN mkdir -p /app/ssl && chmod 755 /app/ssl

RUN chmod +x /app/entrypoint.sh
EXPOSE 4431
ENV ASPNETCORE_URLS=https://+:4431
ENTRYPOINT ["/app/entrypoint.sh"]
