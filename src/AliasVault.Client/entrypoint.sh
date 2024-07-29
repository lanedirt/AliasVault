#!/bin/sh
# Set the default API URL for localhost debugging
DEFAULT_API_URL="http://localhost:81"
DEFAULT_SMTP_ALLOWED_DOMAINS="localmail.tld"

# Use the provided API_URL environment variable if it exists, otherwise use the default
API_URL=${API_URL:-$DEFAULT_API_URL}
SMTP_ALLOWED_DOMAINS=${SMTP_ALLOWED_DOMAINS:-$DEFAULT_SMTP_ALLOWED_DOMAINS}

# Replace the default URL with the actual API URL
sed -i "s|http://localhost:5092|${API_URL}|g" /usr/share/nginx/html/appsettings.json
# Replace the default SMTP allowed domains with the actual allowed SMTP domains
# Note: this is used so the client knows which email addresses should be registered with the AliasVault server
# in order to be able to receive emails.
sed -i "s|localmail.tld|${SMTP_ALLOWED_DOMAINS}|g" /usr/share/nginx/html/appsettings.json

# Start the application
nginx -g "daemon off;"

