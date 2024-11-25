FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 3001

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release

WORKDIR /src
COPY ["src/AliasVault.Api/AliasVault.Api.csproj", "src/AliasVault.Api/"]
RUN dotnet restore "src/AliasVault.Api/AliasVault.Api.csproj"
COPY . .

WORKDIR "/src/src/AliasVault.Api"
RUN dotnet publish "AliasVault.Api.csproj" -c "$BUILD_CONFIGURATION" -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:3001
ENV ASPNETCORE_PATHBASE=/api
ENTRYPOINT ["dotnet", "AliasVault.Api.dll"]
