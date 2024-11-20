#!/bin/sh

# Create SSL directory if it doesn't exist
mkdir -p /etc/nginx/ssl

# Generate self-signed SSL certificate if not exists
if [ ! -f /etc/nginx/ssl/cert.pem ] || [ ! -f /etc/nginx/ssl/key.pem ]; then
    echo "Generating new SSL certificate..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/key.pem \
        -out /etc/nginx/ssl/cert.pem \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

    # Set proper permissions
    chmod 644 /etc/nginx/ssl/cert.pem
    chmod 600 /etc/nginx/ssl/key.pem
fi

export LETSENCRYPT_ENABLED
export HOSTNAME

envsubst '${LETSENCRYPT_ENABLED} ${HOSTNAME}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Start nginx
nginx -g "daemon off;"