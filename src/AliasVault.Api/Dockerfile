FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 4430

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release

WORKDIR /src

# Copy the project files and restore dependencies
COPY ["src/AliasVault.Api/AliasVault.Api.csproj", "src/AliasVault.Api/"]
RUN dotnet restore "src/AliasVault.Api/AliasVault.Api.csproj"
COPY . .

# Build the WebApi project
WORKDIR "/src/src/AliasVault.Api"
RUN dotnet build "AliasVault.Api.csproj" -c "$BUILD_CONFIGURATION" -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "AliasVault.Api.csproj" -c "$BUILD_CONFIGURATION" -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
COPY /src/AliasVault.Api/entrypoint.sh /app

# Create SSL directory
RUN mkdir -p /app/ssl && chmod 755 /app/ssl

RUN chmod +x /app/entrypoint.sh
EXPOSE 4430
ENV ASPNETCORE_URLS=https://+:4430
ENTRYPOINT ["/app/entrypoint.sh"]
