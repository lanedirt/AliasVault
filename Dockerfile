FROM nginx:alpine

# Install OpenSSL
RUN apk add --no-cache openssl

# Copy configuration and entrypoint script
COPY nginx.conf /etc/nginx/nginx.conf
COPY entrypoint.sh /docker-entrypoint.sh

# Create SSL directory
RUN mkdir -p /etc/nginx/ssl && chmod 755 /etc/nginx/ssl \
    && chmod +x /docker-entrypoint.sh

EXPOSE 80 443
ENTRYPOINT ["/docker-entrypoint.sh"]
