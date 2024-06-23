FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release

WORKDIR /src

# Copy the project files and restore dependencies
COPY ["src/AliasVault.Api/AliasVault.Api.csproj", "src/AliasVault.Api/"]
COPY ["src/AliasDb/AliasDb.csproj", "src/AliasDb/"]
COPY ["src/AliasVault.Shared/AliasVault.Shared.csproj", "src/AliasVault.Shared/"]
COPY ["src/AliasGenerators/AliasGenerators.csproj", "src/AliasGenerators/"]
RUN dotnet restore "src/AliasVault.Api/AliasVault.Api.csproj"

# Copy the rest of the application code
COPY . .

# Build the WebApi project
WORKDIR "/src/src/AliasVault.Api"
RUN dotnet build "AliasVault.Api.csproj" -c "$BUILD_CONFIGURATION" -o /app/build

# Publish the application to the /app/publish directory in the container
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "AliasVault.Api.csproj" -c "$BUILD_CONFIGURATION" -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
COPY /src/AliasVault.Api/entrypoint.sh /app
RUN chmod +x /app/entrypoint.sh
EXPOSE 8081
ENV ASPNETCORE_URLS=http://+:8081
ENTRYPOINT ["/app/entrypoint.sh"]
