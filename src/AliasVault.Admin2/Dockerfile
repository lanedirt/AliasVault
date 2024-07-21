FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["src/AliasVault.Admin2/AliasVault.Admin2.csproj", "src/AliasVault.Admin2/"]
RUN dotnet restore "src/AliasVault.Admin2/AliasVault.Admin2.csproj"
COPY . .
WORKDIR "/src/src/AliasVault.Admin2"
RUN dotnet build "AliasVault.Admin2.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "AliasVault.Admin2.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "AliasVault.Admin2.dll"]
