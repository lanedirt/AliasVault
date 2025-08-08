FROM postgres:16-alpine

# Add any custom PostgreSQL configurations if needed
COPY apps/server/Databases/AliasServerDb/postgresql.conf /etc/postgresql/postgresql.conf

# Define database name and username
ENV POSTGRES_DB=aliasvault
ENV POSTGRES_USER=aliasvault

CMD ["postgres", "-c", "config_file=/etc/postgresql/postgresql.conf"]