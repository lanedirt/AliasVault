FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG TARGETARCH
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy all project files
COPY apps/server .

# Build and publish the application
WORKDIR "/src/Services/AliasVault.TaskRunner"
RUN dotnet publish "./AliasVault.TaskRunner.csproj" \
    -c "$BUILD_CONFIGURATION" \
    -a "$TARGETARCH" \
    -o /app/publish \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/runtime:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "AliasVault.TaskRunner.dll"]
