FROM nginx:alpine

# Install OpenSSL and envsubst (which is part of gettext)
RUN apk add --no-cache openssl gettext

# Copy configuration template and entrypoint script
COPY nginx.conf.template /etc/nginx/nginx.conf.template
COPY entrypoint.sh /docker-entrypoint.sh

# Create SSL directory
RUN mkdir -p /etc/nginx/ssl && chmod 755 /etc/nginx/ssl \
    && chmod +x /docker-entrypoint.sh

EXPOSE 80 443
ENTRYPOINT ["/docker-entrypoint.sh"]
