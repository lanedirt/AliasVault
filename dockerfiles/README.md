# AliasVault Dockerfiles

This folder contains alternative Docker configurations for AliasVault deployment scenarios beyond the standard multi-container setup.

## Files

### `docker-compose.build.yml`
Used to locally build Docker images from source instead of retrieving pre-built images from GitHub Container Registry. Automatically used when running `./install.sh build`.

### `docker-compose.dev.yml`
Contains containers for aiding in local development of AliasVault. Provides a separate PostgreSQL instance for development on port 5433, managed via `./install.sh configure-dev-db`.

### `Dockerfile.single`
Alternative all-in-one Dockerfile that wraps all AliasVault services (database, API, web, background services) in one container. Primarily used for hosting on limited platforms like NAS/Unraid and small home use scenarios.

### `docker-compose.single.yml`
Docker Compose configuration for the single-container deployment using the image built from `Dockerfile.single`. Includes security settings, resource limits, and health checks optimized for NAS environments.

## Usage

- **Standard deployment**: `./install.sh install` (uses multi-container setup and ../docker-compose.yml)
- **Build from source**: `./install.sh build` (uses docker-compose.build.yml)
- **Development database**: `./install.sh configure-dev-db start`
- **Single container**: Build with `docker build -f Dockerfile.single` and deploy with `docker-compose.single.yml`