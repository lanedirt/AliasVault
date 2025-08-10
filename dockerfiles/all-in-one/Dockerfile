# Multi-stage build for AliasVault single container deployment
# This creates a single container with all services for NAS/home server deployments

# ============================================
# Stage 1: Build .NET applications
# ============================================
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS dotnet-builder

# Install Python (required for WASM compilation)
RUN apt-get update && apt-get install -y python3 python3-pip && rm -rf /var/lib/apt/lists/*

WORKDIR /src

# Copy all source files
COPY apps/server/ ./apps/server/
COPY shared/ ./shared/

# Install required .NET workloads
RUN dotnet workload install wasm-tools

# Build all .NET applications
WORKDIR /src/apps/server

# Build API
RUN dotnet publish AliasVault.Api/AliasVault.Api.csproj -c Release -o /app/api

# Build Client (requires wasm-tools workload)
RUN dotnet publish AliasVault.Client/AliasVault.Client.csproj -c Release -o /app/client

# Build Admin
RUN dotnet publish AliasVault.Admin/AliasVault.Admin.csproj -c Release -o /app/admin

# Build SMTP Service
RUN dotnet publish Services/AliasVault.SmtpService/AliasVault.SmtpService.csproj -c Release -o /app/smtp

# Build Task Runner
RUN dotnet publish Services/AliasVault.TaskRunner/AliasVault.TaskRunner.csproj -c Release -o /app/taskrunner

# Build InstallCLI (for admin password hash generation)
RUN dotnet publish Utilities/AliasVault.InstallCli/AliasVault.InstallCli.csproj -c Release -o /app/installcli

# ============================================
# Stage 2: Final runtime image with s6-overlay
# ============================================
FROM mcr.microsoft.com/dotnet/aspnet:9.0

# Install PostgreSQL APT repository to get exact version matching postgres:16-alpine
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    gnupg \
    lsb-release \
    && wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /usr/share/keyrings/postgresql-archive-keyring.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/postgresql-archive-keyring.gpg] http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
    && apt-get update

# Install required packages and locales - pin PostgreSQL to version 16
RUN apt-get install -y \
    nginx \
    postgresql-16 \
    postgresql-client-16 \
    openssl \
    curl \
    xz-utils \
    netcat-openbsd \
    gettext-base \
    locales \
    && apt-mark hold postgresql-16 postgresql-client-16 \
    && rm -rf /var/lib/apt/lists/* \
    && useradd -r -s /bin/bash -d /var/lib/postgresql postgres 2>/dev/null || true \
    && sed -i '/en_US.UTF-8/s/^# //g' /etc/locale.gen \
    && locale-gen

# Install s6-overlay v3
ARG S6_OVERLAY_VERSION=3.2.0.2
ADD https://github.com/just-containers/s6-overlay/releases/download/v${S6_OVERLAY_VERSION}/s6-overlay-noarch.tar.xz /tmp
ADD https://github.com/just-containers/s6-overlay/releases/download/v${S6_OVERLAY_VERSION}/s6-overlay-x86_64.tar.xz /tmp
RUN tar -C / -Jxpf /tmp/s6-overlay-noarch.tar.xz \
    && tar -C / -Jxpf /tmp/s6-overlay-x86_64.tar.xz \
    && rm /tmp/s6-overlay-*.tar.xz

# Create necessary directories
RUN mkdir -p \
    /app/api \
    /app/client \
    /app/admin \
    /app/smtp \
    /app/taskrunner \
    /database \
    /certificates/ssl \
    /certificates/app \
    /logs/postgres \
    /etc/nginx/ssl \
    /var/run/postgresql \
    /var/www/certbot

# Copy built applications from builder stage
COPY --from=dotnet-builder /app/api /app/api
COPY --from=dotnet-builder /app/client /app/client
COPY --from=dotnet-builder /app/admin /app/admin
COPY --from=dotnet-builder /app/smtp /app/smtp
COPY --from=dotnet-builder /app/taskrunner /app/taskrunner

# Copy InstallCLI to /usr/local/bin and make it executable
COPY --from=dotnet-builder /app/installcli /usr/local/bin/aliasvault-cli
RUN chmod +x /usr/local/bin/aliasvault-cli/AliasVault.InstallCli && \
    ln -s /usr/local/bin/aliasvault-cli/AliasVault.InstallCli /usr/local/bin/aliasvault-cli.sh

# Copy client nginx configuration and ensure wwwroot is accessible
COPY apps/server/AliasVault.Client/nginx.conf /app/client/nginx.conf

# Copy nginx configuration for single container deployment
COPY apps/server/nginx.conf /etc/nginx/nginx.conf
COPY apps/server/nginx.conf.template /etc/nginx/nginx.conf.template
COPY apps/server/status.html /usr/share/nginx/html/status.html

# Replace upstream server hostnames with "localhost" in nginx.conf
# to accommodate for the single-container setup (for default nginx.conf)
RUN sed -i 's/server client:3000/server localhost:3000/g' /etc/nginx/nginx.conf && \
    sed -i 's/server api:3001/server localhost:3001/g' /etc/nginx/nginx.conf && \
    sed -i 's/server admin:3002/server localhost:3002/g' /etc/nginx/nginx.conf

# ============================================
# S6 Service Configuration
# ============================================

# Copy s6 service definitions
COPY dockerfiles/all-in-one/s6-scripts /etc/s6-overlay/s6-rc.d/

# Make all scripts executable (run for longrun services, up for oneshot services, and script files)
RUN find /etc/s6-overlay/s6-rc.d -type f \( -name "run" -o -name "up" -o -name "script" \) -exec chmod +x {} \;

# Enable all services in the default bundle
RUN mkdir -p /etc/s6-overlay/s6-rc.d/user/contents.d && \
    touch /etc/s6-overlay/s6-rc.d/user/contents.d/init && \
    touch /etc/s6-overlay/s6-rc.d/user/contents.d/postgres && \
    touch /etc/s6-overlay/s6-rc.d/user/contents.d/api \
    touch /etc/s6-overlay/s6-rc.d/user/contents.d/client && \
    touch /etc/s6-overlay/s6-rc.d/user/contents.d/admin && \
    touch /etc/s6-overlay/s6-rc.d/user/contents.d/smtp && \
    touch /etc/s6-overlay/s6-rc.d/user/contents.d/taskrunner && \
    touch /etc/s6-overlay/s6-rc.d/user/contents.d/nginx && \
    touch /etc/s6-overlay/s6-rc.d/user/contents.d/notification

# Set environment variables for s6-overlay
# ALIASVAULT_VERBOSITY: 0=minimal (default), 1=normal, 2=verbose
ENV ALIASVAULT_VERBOSITY=0 \
    PUBLIC_REGISTRATION_ENABLED=true \
    IP_LOGGING_ENABLED=true \
    SUPPORT_EMAIL="" \
    PRIVATE_EMAIL_DOMAINS="" \
    POSTGRES_HOST=localhost \
    POSTGRES_PORT=5432 \
    POSTGRES_USER=aliasvault \
    POSTGRES_DATABASE=aliasvault \
    S6_CMD_WAIT_FOR_SERVICES_MAXTIME=0 \
    S6_VERBOSITY=0

# Expose ports
EXPOSE 80 443 25 587

# Volumes for persistent data
VOLUME ["/database", "/certificates", "/logs", "/secrets"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
    CMD curl -f -k https://localhost/api || exit 1

# Set s6-overlay as entrypoint
ENTRYPOINT ["/init"]