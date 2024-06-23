# Use the official ASP.NET Core runtime image as the base image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app

# Use the official .NET SDK image to build the app
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy the project files and restore dependencies
COPY ["src/AliasVault.WebApp/AliasVault.WebApp.csproj", "src/AliasVault.WebApp/"]
COPY ["src/AliasVault.Shared/AliasVault.Shared.csproj", "src/AliasVault.Shared/"]
COPY ["src/AliasDb/AliasDb.csproj", "src/AliasDb/"]
COPY ["src/AliasGenerators/AliasGenerators.csproj", "src/AliasGenerators/"]
COPY ["src/Utilities/FaviconExtractor/FaviconExtractor.csproj", "src/Utilities/FaviconExtractor/"]
RUN dotnet restore "src/AliasVault.WebApp/AliasVault.WebApp.csproj"

# Copy the rest of the application code
COPY . .

# Build the WebApp project
WORKDIR "/src/src/AliasVault.WebApp"
RUN dotnet build "AliasVault.WebApp.csproj" -c "$BUILD_CONFIGURATION" -o /app/build

# Publish the WebApp project
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "AliasVault.WebApp.csproj" -c "$BUILD_CONFIGURATION" -o /app/publish /p:UseAppHost=false

# Final stage: start nginx and serve static html files that were published in the previous stage
FROM nginx:alpine AS final
WORKDIR /usr/share/nginx/html
COPY --from=publish /app/publish/wwwroot .
COPY /src/AliasVault.WebApp/nginx.conf /etc/nginx/nginx.conf
COPY /src/AliasVault.WebApp/entrypoint.sh /app/
RUN chmod +x /app/entrypoint.sh
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["/app/entrypoint.sh"]
