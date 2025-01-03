FROM mcr.microsoft.com/dotnet/runtime:9.0 AS base
WORKDIR /app

FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG TARGETARCH
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy the project files and restore dependencies
COPY ["src/Services/AliasVault.SmtpService/AliasVault.SmtpService.csproj", "src/Services/AliasVault.SmtpService/"]
RUN dotnet restore "./src/Services/AliasVault.SmtpService/AliasVault.SmtpService.csproj" -a $TARGETARCH
COPY . .

# Build and publish the application
WORKDIR "/src/src/Services/AliasVault.SmtpService"
RUN dotnet publish "./AliasVault.SmtpService.csproj" -c "$BUILD_CONFIGURATION" -a $TARGETARCH -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "AliasVault.SmtpService.dll"]
