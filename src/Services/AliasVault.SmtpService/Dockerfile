FROM mcr.microsoft.com/dotnet/runtime:8.0 AS base
WORKDIR /app

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy the project files and restore dependencies
COPY ["src/Services/AliasVault.SmtpService/AliasVault.SmtpService.csproj", "src/Services/AliasVault.SmtpService/"]
RUN dotnet restore "./src/Services/AliasVault.SmtpService/AliasVault.SmtpService.csproj"
COPY . .

# Build the SmtpService project
WORKDIR "/src/src/Services/AliasVault.SmtpService"
RUN dotnet build "./AliasVault.SmtpService.csproj" -c $BUILD_CONFIGURATION -o /app/build

# Publish the application to the /app/publish directory in the container
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./AliasVault.SmtpService.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "AliasVault.SmtpService.dll"]
