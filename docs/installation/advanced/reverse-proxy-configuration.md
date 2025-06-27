---
layout: default
title: Reverse Proxy Configuration
parent: Advanced
nav_order: 2
---

# Reverse Proxy Configuration
This guide is intended for users who already have a self-hosted reverse proxy setup (such as nginx, Apache, or Cloudflare Tunnel) and want to expose AliasVault through it. In this case, the recommended approach is to forward a single hostname (e.g., `aliasvault.example.com`) to the internal reverse proxy container that AliasVault provides.

If you do **not** already have an existing reverse proxy, you can simply rely on the built-in reverse proxy that comes with AliasVault, as it's fully capable of handling all routing, SSL termination, and WebSocket support out of the box.


## Overview
AliasVault includes its own internal reverse proxy (nginx) that handles routing between its three core services:
- **Client Application** (`/`) – The main user interface
- **API Server** (`/api`) – REST API endpoints
- **Admin Panel** (`/admin`) – Administrative interface

When using an external reverse proxy, you **must** forward requests to the `reverse-proxy` container. Do **not** route traffic directly to the individual services.

## Why AliasVault Uses Its Own Reverse Proxy
AliasVault’s internal reverse proxy ensures proper routing and configuration of all services under one domain:

1. **Unified Hostname** – All services operate under the same domain (e.g., `aliasvault.example.com`)
2. **Path-Based Routing** – Correct dispatch of `/`, `/api`, and `/admin` requests
3. **Security Headers** – Consistent headers across services
4. **SSL Termination** – Central SSL/TLS handling
5. **WebSocket Support** – Required for the Blazor-based admin interface

## Internal Nginx Configuration Structure
AliasVault's reverse proxy follows a path-based routing configuration like this:

```nginx
# Upstream services
upstream client {
    server client:3000;
}
upstream api {
    server api:3001;
}
upstream admin {
    server admin:3002;
}

server {
    listen 443 ssl;
    server_name _;

    location /admin {
        proxy_pass http://admin;
        # WebSocket support and headers
    }

    location /api {
        proxy_pass http://api;
    }

    location / {
        proxy_pass http://client;
    }
}
```

## Simplest Setup (Recommended)
Forward all traffic from your external reverse proxy to the AliasVault internal reverse proxy container. This avoids manual path-based routing.

### Example: External Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name aliasvault.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name aliasvault.example.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    location / {
        proxy_pass https://aliasvault-internal:443;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Port Configuration
AliasVault’s internal reverse proxy defaults to port `443`. If this port is already in use, you can change it in the `.env` file inside your AliasVault folder:

```
HTTP_PORT=80
HTTPS_PORT=443
```

Make sure your external proxy points to the correct port.

## Common Issues and Solutions

### HTTP 502 Bad Gateway

**Cause**: External proxy routing to wrong container.
**Fix**: Ensure it routes to `reverse-proxy` container, not `client`, `api`, or `admin`.

### WebSocket Errors

**Cause**: WebSocket headers not forwarded.
**Fix**: Make sure `Upgrade` and `Connection` headers are preserved.

### SSL/TLS Verification (e.g., Cloudflare Tunnel)

**Cause**: TLS verification fails.
**Fix**: Enable “No TLS Verify” in your Cloudflare Tunnel configuration.

### Partial Routing Failures

**Cause**: External proxy modifies paths.
**Fix**: Do not strip or rewrite paths. Proxy should pass `/`, `/api`, `/admin` as-is.

## Testing
After setup, verify:

- `https://your-domain.com/` loads the client app
- `https://your-domain.com/api` returns OK
- `https://your-domain.com/admin` loads the admin interface

All services must be available under the **same** hostname.

## Security Considerations
- Always use HTTPS in production
- Preserve headers like `X-Real-IP`, `X-Forwarded-For`
- Consider adding rate limiting or IP restrictions on your external proxy
- Keep certificates and secrets secure

For advanced scenarios or troubleshooting, refer to the main [troubleshooting guide](../troubleshooting.md).
