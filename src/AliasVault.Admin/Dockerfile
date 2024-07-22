# Use the official .NET 8 SDK image to build the app
FROM mcr.microsoft.com/dotnet/sdk:8.0  AS build
WORKDIR /src

# Copy the solution file to the /src directory in the container
COPY aliasvault.sln ./

# Copy the project file to the /src/AliasVault directory in the container
COPY src/AliasVault.Admin/AliasVault.Admin.csproj ./AliasVault.Admin/

# Restore dependencies for the AliasVault project
RUN dotnet restore "./AliasVault.Admin/AliasVault.Admin.csproj" --verbosity detailed

# Copy the rest of the application code to the /src directory in the container
COPY src/. ./

# Publish the application to the /app/publish directory in the container
WORKDIR /src/AliasVault.Admin
RUN dotnet publish -c Release -o /app --verbosity detailed

# Use the official ASP.NET Core runtime image to run the app
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app/AliasVault.Admin

# Copy the published output from the build stage to the runtime stage
COPY --from=build /app ./

# Expose the port the app runs on
EXPOSE 8082
ENV ASPNETCORE_URLS=http://+:8082

ENTRYPOINT ["dotnet", "AliasVault.Admin.dll"]

