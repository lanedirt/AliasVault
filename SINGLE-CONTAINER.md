# AliasVault Single Container Deployment

This guide covers deploying AliasVault in a single container, specifically designed for NAS platforms like Unraid, QNAP, Synology, and simple home server setups where ease of deployment is prioritized over scalability.

## Overview

The single container deployment packages all AliasVault services into one Docker container:
- PostgreSQL database
- .NET API service
- .NET Client (Blazor WebAssembly)
- .NET Admin interface
- SMTP service for email aliases
- Task runner for background jobs
- Nginx reverse proxy with SSL termination

All services are managed by **s6-overlay v3**, providing proper process supervision, dependency management, and graceful shutdown.

## Quick Start

Stop and delete any existing instance:
```bash
docker stop aliasvault 2>/dev/null || true
docker rm aliasvault 2>/dev/null || true
```

Build the image locally:
```bash
docker build -f Dockerfile.server.allinone -t aliasvault-allinone:latest .
```

Create data directory if it doesn't exist already:
```bash
# Create data directory
mkdir -p ./data
mkdir -p ./data/database
mkdir -p ./data/logs
mkdir -p ./data/certificates
```

Then run it:

```bash
# Minimal run command - only required environment variables
docker run -d --name aliasvault \
     -p 80:80 \
     -p 443:443 \
     -p 25:25 \
     -p 587:587 \
     -v "$(pwd)/data:/data" \
     -e JWT_KEY="$(openssl rand -base64 32)" \
     -e ADMIN_PASSWORD_HASH="AQAAAAIAAYagAAAAEAWMjs7wDg4V/ZsxJVV6Ua8dPuCnxOkepZHTo29OhFituMdAoCiaH6AhWb5O/PJ2SA==" \
     -e ADMIN_PASSWORD_GENERATED="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
     -e DATA_PROTECTION_CERT_PASS="$(openssl rand -base64 32)" \
     --restart unless-stopped \
     aliasvault-allinone:latest
```

Full command with all optional environment variables (showing defaults):
```bash
docker run -d --name aliasvault \
     -p 80:80 \
     -p 443:443 \
     -p 25:25 \
     -p 587:587 \
     -v "$(pwd)/database:/database" \
     -v "$(pwd)/certificates:/certificates" \
     -v "$(pwd)/logs:/logs" \
     -e JWT_KEY="KIhUqVPFbSoTYH8MxqkFsfEoumEl5t2nKU17/ZtDGao=" \
     -e ADMIN_PASSWORD_HASH="<your-generated-hash>" \
     -e ADMIN_PASSWORD_GENERATED="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
     -e DATA_PROTECTION_CERT_PASS="$(openssl rand -base64 32)" \
     -e PRIVATE_EMAIL_DOMAINS="" \                       # Default: empty
     -e PUBLIC_REGISTRATION_ENABLED="true" \             # Default: true
     -e IP_LOGGING_ENABLED="true" \                      # Default: true
     -e SMTP_TLS_ENABLED="false" \                       # Default: false
     -e POSTGRES_PASSWORD="defaultpassword" \            # Default: defaultpassword (change in production!)
     --restart unless-stopped \
     aliasvault-allinone:latest
```

Single command to remove existing, build, and run interactively
```bash
docker stop aliasvault 2>/dev/null || true \
 && docker rm aliasvault 2>/dev/null || true \
 && docker build -f dockerfiles/Dockerfile.server.allinone -t aliasvault-allinone:latest . \
 && docker run --name aliasvault \
     -p 80:80 \
     -p 443:443 \
     -p 25:25 \
     -p 587:587 \
     -v "$(pwd)/database:/database" \
     -v "$(pwd)/certificates:/certificates" \
     -v "$(pwd)/logs:/logs" \
     -v "$(pwd)/secrets:/secrets" \
     -e JWT_KEY="KIhUqVPFbSoTYH8MxqkFsfEoumEl5t2nKU17/ZtDGao=" \
     -e ADMIN_PASSWORD_HASH="<your-generated-hash>" \
     -e ADMIN_PASSWORD_GENERATED="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
     -e DATA_PROTECTION_CERT_PASS="+6wInFdXTegAbgTzij1anB0RtcuPSDUaybNYQAwaoOo=" \
     -e POSTGRES_PASSWORD="3EPsEatRHaRkU8RCjr4dItLa3J7ZMVwyasvEkONZvk4=" \
     --restart unless-stopped \
     aliasvault-allinone:latest
```

#### File based password tests:
```bash
docker stop aliasvault 2>/dev/null || true \
 && docker rm aliasvault 2>/dev/null || true \
 && docker build -f dockerfiles/Dockerfile.server.allinone -t aliasvault-allinone:latest . \
 && docker run --name aliasvault \
     -p 80:80 \
     -p 443:443 \
     -p 25:25 \
     -p 587:587 \
     -v "$(pwd)/database:/database" \
     -v "$(pwd)/certificates:/certificates" \
     -v "$(pwd)/logs:/logs" \
     -v "$(pwd)/secrets:/secrets" \
      --restart unless-stopped \
     aliasvault-allinone:latest
```

### Push image to cr.xivi.nl
```bash
docker buildx build --platform linux/amd64,linux/arm64 -f dockerfiles/all-in-one/Dockerfile.server.allinone -t cr.xivi.nl/aliasvault/aliasvault-allinone:latest   --push .
```

### Debug helpers:
Check actual run scripts that are being written by the single docker compose file
```bash
docker exec -it aliasvault cat /etc/s6-overlay/s6-rc.d/api/run
docker exec -it aliasvault cat /etc/s6-overlay/s6-rc.d/admin/run
```

## Configuration

### Environment Variables

The single container uses a simplified configuration. Only 4 environment variables are required:

**Required Variables:**
| Variable | Description |
|----------|-------------|
| `JWT_KEY` | JWT signing key (generate with `openssl rand -base64 32`) |
| `ADMIN_PASSWORD_HASH` | Admin password hash (generate via Admin portal) |
| `ADMIN_PASSWORD_GENERATED` | Admin password generation date (use `date -u +%Y-%m-%dT%H:%M:%SZ`) |
| `DATA_PROTECTION_CERT_PASS` | Data protection certificate password (generate with `openssl rand -base64 32`) |

**Optional Variables (with defaults):**
| Variable | Default | Description |
|----------|---------|-------------|
| `PRIVATE_EMAIL_DOMAINS` | DISABLED.TLD | Comma-separated email domains to receive mail for |
| `PUBLIC_REGISTRATION_ENABLED` | true | Allow new user registrations |
| `IP_LOGGING_ENABLED` | true | Enable IP address logging |
| `SMTP_TLS_ENABLED` | false | Enable TLS for SMTP service |
| `POSTGRES_PASSWORD` | defaultpassword | PostgreSQL password (change in production!) |
| `HOSTNAME` | localhost | Domain where AliasVault is accessible |
| `LETSENCRYPT_ENABLED` | false | Enable Let's Encrypt SSL |

### Data Persistence

All persistent data is stored in the following locations:

```
/data/
├── postgres/          # PostgreSQL database files
├── database/          # Application database backups
├── certificates/      # SSL certificates
│   ├── ssl/          # Self-signed or custom certificates
│   ├── app/          # Application certificates
│   └── letsencrypt/  # Let's Encrypt certificates
└── logs/             # Application logs
```

## Platform-Specific Instructions

### Unraid

1. **Apps → Search for "AliasVault"** or install manually:
   - **Repository**: `ghcr.io/lanedirt/aliasvault-single:latest`
   - **Network Type**: Bridge
   - **Port Mappings**:
     - `80:80` (HTTP)
     - `443:443` (HTTPS)
     - `25:25` (SMTP) - optional
     - `587:587` (SMTP TLS) - optional
   - **Path Mapping**: `/mnt/user/appdata/aliasvault:/data`

2. **Environment Variables**:
   - `HOSTNAME`: Your domain or server IP
   - `PUBLIC_REGISTRATION_ENABLED`: `true` or `false`

### QNAP Container Station

1. **Create Container** → **Search** → `ghcr.io/lanedirt/aliasvault-single`
2. **Advanced Settings**:
   - **Port Settings**: Map 80→80, 443→443, 25→25, 587→587
   - **Volume**: Mount a shared folder to `/data`
   - **Environment**: Add HOSTNAME and other variables

### Synology Docker

1. **Registry** → Search `lanedirt/aliasvault-single` → **Download**
2. **Container** → **Create** → **Advanced Settings**:
   - **Port Settings**: Auto or manual mapping
   - **Volume**: Mount Docker folder to `/data`
   - **Environment**: Configure HOSTNAME, etc.

## Management Commands

If using `install-single.sh`:

```bash
./install-single.sh start      # Start container
./install-single.sh stop       # Stop container
./install-single.sh restart    # Restart container
./install-single.sh logs       # View logs
./install-single.sh status     # Check status
./install-single.sh update     # Update to latest version
./install-single.sh uninstall  # Remove completely
```

With Docker directly:

```bash
docker start aliasvault
docker stop aliasvault
docker restart aliasvault
docker logs -f aliasvault
docker exec -it aliasvault bash  # Enter container shell
```

## SSL Certificates

### Self-Signed (Default)
The container automatically generates self-signed certificates for immediate use. Browsers will show security warnings.

### Let's Encrypt
Set `LETSENCRYPT_ENABLED=true` and `HOSTNAME` to your public domain. Requires ports 80 and 443 accessible from the internet.

### Custom Certificates
Place your certificates in the mounted data volume:
- `/data/certificates/ssl/cert.pem`
- `/data/certificates/ssl/key.pem`

## Email Server Setup

To receive emails for alias addresses:

1. Set `PRIVATE_EMAIL_DOMAINS=yourdomain.com` in `.env.single`
2. Configure DNS MX record pointing to your server
3. Ensure port 25 is open and accessible
4. Restart the container

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker logs aliasvault

# Common issues:
# - Port conflicts (change port mappings)
# - Permission issues (check data volume permissions)
# - Insufficient memory (allocate at least 1GB RAM)
```

### Services Not Responding
```bash
# Check service status inside container
docker exec aliasvault s6-rc -a list

# Check individual service logs
docker exec aliasvault journalctl -u postgres
docker exec aliasvault journalctl -u api
```

### Database Issues
```bash
# Access PostgreSQL directly
docker exec -it aliasvault su - postgres
psql -d aliasvault
```

### Reset Admin Password
```bash
# Generate new admin credentials
docker exec aliasvault /app/installcli/AliasVault.InstallCli hash-password "newpassword"
# Update ADMIN_PASSWORD_HASH in environment and restart
```

## Performance Tuning

### Memory Allocation
- **Minimum**: 1GB RAM
- **Recommended**: 2GB RAM for smooth operation
- **High Load**: 4GB+ RAM

### CPU Limits
```yaml
# In docker-compose.single.yml
services:
  aliasvault:
    deploy:
      resources:
        limits:
          memory: 2g
          cpus: '2.0'
```

### Database Tuning
```bash
# Access container and edit PostgreSQL config
docker exec -it aliasvault bash
nano /data/postgres/postgresql.conf

# Common optimizations:
# shared_buffers = 256MB
# effective_cache_size = 1GB
# maintenance_work_mem = 64MB
```

## Backup and Restore

### Backup
```bash
# Database backup
docker exec aliasvault pg_dump -U aliasvault aliasvault > backup.sql

# Full data backup
tar -czf aliasvault-backup-$(date +%Y%m%d).tar.gz data/
```

### Restore
```bash
# Database restore
docker exec -i aliasvault psql -U aliasvault aliasvault < backup.sql

# Full data restore
tar -xzf aliasvault-backup-20241201.tar.gz
```

## Migration from Multi-Container

To migrate from the standard multi-container setup:

1. **Stop the multi-container deployment**:
   ```bash
   ./install.sh stop
   ```

2. **Backup your data**:
   ```bash
   ./install.sh db-export > database-backup.sql.gz
   cp -r database/ certificates/ logs/ ~/aliasvault-backup/
   ```

3. **Install single container**:
   ```bash
   ./install-single.sh install
   ```

4. **Restore data**:
   ```bash
   # Stop single container
   ./install-single.sh stop

   # Copy data
   cp -r ~/aliasvault-backup/database/ ./data/
   cp -r ~/aliasvault-backup/certificates/ ./data/

   # Import database
   zcat database-backup.sql.gz | docker exec -i aliasvault psql -U aliasvault aliasvault

   # Start container
   ./install-single.sh start
   ```

## Architecture Details

### Service Dependencies
The s6-overlay manages service startup order:
1. Container initialization
2. PostgreSQL database
3. Database readiness check
4. Application services (API, Client, Admin, SMTP, Task Runner)
5. Nginx reverse proxy

### Process Management
Each service runs as a supervised process with automatic restart on failure. The container will stop if any critical service fails permanently.

### Networking
All services communicate via localhost within the container:
- PostgreSQL: `localhost:5432`
- API: `localhost:3001`
- Client: `localhost:3000`
- Admin: `localhost:3002`
- SMTP: `localhost:25,587`
- Nginx: External ports 80/443

## Limitations

1. **Scalability**: Cannot horizontally scale individual services
2. **Resource Isolation**: All services share container resources
3. **Update Granularity**: Must update entire container, not individual services
4. **Debugging**: More complex to debug individual services
5. **Docker Best Practices**: Goes against "one process per container" principle

## When to Use Single Container

**Good for**:
- Home servers and NAS platforms
- Simple deployments with minimal maintenance
- Resource-constrained environments
- Users who prefer simplicity over scalability

**Not recommended for**:
- Production environments with high availability requirements
- Deployments requiring individual service scaling
- Environments where services need different update schedules
- Complex networking requirements

## Support

For single container specific issues:
1. Check container logs: `docker logs aliasvault`
2. Verify service status: `docker exec aliasvault s6-rc -a list`
3. Review configuration in `.env.single`
4. Check the [main AliasVault documentation](README.md) for general issues
5. Open an issue on [GitHub](https://github.com/lanedirt/AliasVault/issues) with "single-container" label