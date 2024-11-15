#!/bin/sh
# Set the default hostname for localhost debugging
DEFAULT_HOSTNAME="localhost"
DEFAULT_PRIVATE_EMAIL_DOMAINS="localmail.tld"
DEFAULT_SUPPORT_EMAIL=""

# Use the provided HOSTNAME environment variable if it exists, otherwise use the default
HOSTNAME=${HOSTNAME:-$DEFAULT_HOSTNAME}
PRIVATE_EMAIL_DOMAINS=${PRIVATE_EMAIL_DOMAINS:-$DEFAULT_PRIVATE_EMAIL_DOMAINS}
SUPPORT_EMAIL=${SUPPORT_EMAIL:-$DEFAULT_SUPPORT_EMAIL}

# Create SSL directory if it doesn't exist
mkdir -p /etc/nginx/ssl

# Generate self-signed SSL certificate if not exists
if [ ! -f /etc/nginx/ssl/nginx.crt ] || [ ! -f /etc/nginx/ssl/nginx.key ]; then
    echo "Generating new SSL certificate..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/nginx.key \
        -out /etc/nginx/ssl/nginx.crt \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

    # Set proper permissions
    chmod 644 /etc/nginx/ssl/nginx.crt
    chmod 600 /etc/nginx/ssl/nginx.key
fi

# Replace the default URL with the actual API URL constructed from hostname
sed -i "s|http://localhost:5092|https://${HOSTNAME}|g" /usr/share/nginx/html/appsettings.json

# Convert comma-separated list to JSON array
json_array=$(echo $PRIVATE_EMAIL_DOMAINS | awk '{split($0,a,","); printf "["; for(i=1;i<=length(a);i++) {printf "\"%s\"", a[i]; if(i<length(a)) printf ","} printf "]"}')

# Use sed to update the PrivateEmailDomains field in appsettings.json
sed -i.bak "s|\"PrivateEmailDomains\": \[.*\]|\"PrivateEmailDomains\": $json_array|" /usr/share/nginx/html/appsettings.json

# Update support email in appsettings.json
if [ ! -z "$SUPPORT_EMAIL" ]; then
    sed -i "s|\"SupportEmail\": \".*\"|\"SupportEmail\": \"$SUPPORT_EMAIL\"|g" /usr/share/nginx/html/appsettings.json
else
    sed -i "s|\"SupportEmail\": \".*\"|\"SupportEmail\": \"\"|g" /usr/share/nginx/html/appsettings.json
fi

# Start the application
nginx -g "daemon off;"
