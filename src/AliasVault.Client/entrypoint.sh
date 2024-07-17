#!/bin/sh
# Set the default API URL for localhost debugging
DEFAULT_API_URL="http://localhost:81"

# Use the provided API_URL environment variable if it exists, otherwise use the default
API_URL=${API_URL:-$DEFAULT_API_URL}

# Replace the default URL with the actual API URL
sed -i "s|http://localhost:5092|${API_URL}|g" /usr/share/nginx/html/appsettings.json

# Start the application
nginx -g "daemon off;"

