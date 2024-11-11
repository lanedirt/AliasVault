#!/bin/sh
# Set the default API URL for localhost debugging
DEFAULT_API_URL="http://localhost:81"
DEFAULT_PRIVATE_EMAIL_DOMAINS="localmail.tld"
DEFAULT_SUPPORT_EMAIL=""

# Use the provided API_URL environment variable if it exists, otherwise use the default
API_URL=${API_URL:-$DEFAULT_API_URL}
PRIVATE_EMAIL_DOMAINS=${PRIVATE_EMAIL_DOMAINS:-$DEFAULT_PRIVATE_EMAIL_DOMAINS}
SUPPORT_EMAIL=${SUPPORT_EMAIL:-$DEFAULT_SUPPORT_EMAIL}

# Replace the default URL with the actual API URL
sed -i "s|http://localhost:5092|${API_URL}|g" /usr/share/nginx/html/appsettings.json
# Replace the default SMTP allowed domains with the actual allowed SMTP domains
# Note: this is used so the client knows which email addresses should be registered with the AliasVault server
# in order to be able to receive emails.

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
