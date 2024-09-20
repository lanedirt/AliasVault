FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8082

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
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
EXPOSE 8082
ENV ASPNETCORE_URLS=http://+:8082
ENTRYPOINT ["dotnet", "AliasVault.Admin.dll"]
