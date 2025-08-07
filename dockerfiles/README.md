# AliasVault Dockerfiles

This folder contains alternative Docker configurations for AliasVault deployment scenarios beyond the standard multi-container setup.

## Files

### `docker-compose.build.yml`
Used to locally build Docker images from source instead of retrieving pre-built images from GitHub Container Registry. Automatically used when running `./install.sh build`.

### `docker-compose.dev.yml`
Contains containers for aiding in local development of AliasVault. Provides a separate PostgreSQL instance for development on port 5433, managed via `./install.sh configure-dev-db`.

### `Dockerfile.server.singlecontainer`
This is a standalone single-container build for easy self-hosting, using s6-overlay to run multiple services (database, API, web, smtp, task runner) inside one image.

This build is primarily intended for **limited platforms** like NAS devices, Unraid, or other **small home-use scenarios** where simplicity is preferred over flexibility.

> **Note:** For production or more advanced setups, we recommend using the default multi-container configuration available via [`../docker-compose.yml`](../docker-compose.yml).

## Usage

- **Standard deployment**: `./install.sh install` (uses multi-container setup and ../docker-compose.yml)
- **Build from source**: `./install.sh build` (uses docker-compose.build.yml)
- **Development database**: `./install.sh configure-dev-db start`
- **Single container**: Build with `docker build -f Dockerfile.single` and deploy with `docker-compose.single.yml`