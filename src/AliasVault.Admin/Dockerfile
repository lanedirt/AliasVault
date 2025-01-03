FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 3002

FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG TARGETARCH
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["src/AliasVault.Admin/AliasVault.Admin.csproj", "src/AliasVault.Admin/"]
RUN dotnet restore "src/AliasVault.Admin/AliasVault.Admin.csproj" -a $TARGETARCH
COPY . .

WORKDIR "/src/src/AliasVault.Admin"
RUN dotnet publish "AliasVault.Admin.csproj" -c "$BUILD_CONFIGURATION" -a $TARGETARCH -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:3002
ENV ASPNETCORE_PATHBASE=/admin
ENTRYPOINT ["dotnet", "AliasVault.Admin.dll"]
