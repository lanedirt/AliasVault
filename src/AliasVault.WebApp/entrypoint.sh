#!/bin/sh

# Replace placeholder with the actual API URL
sed -i "s|http://localhost:5092|${API_URL}|g" /app/wwwroot/appsettings.json

# Start the application
nginx -g "daemon off;"

