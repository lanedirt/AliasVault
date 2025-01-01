---
layout: default
title: Upgrade the AliasServerDb EF model
parent: Development
grand_parent: Miscellaneous
nav_order: 3
---

# Upgrade the AliasServerDb EF model

The AliasServerDb EF model has migrations for both the SQLite and PostgreSQL databases. This means
that when you make changes to the EF model, you need to create migrations for both databases.

1. Make migration for PostgreSQL database:
```bash
dotnet ef migrations add InitialMigration --context AliasServerDbContextPostgresql --output-dir Migrations/PostgresqlMigrations
```

2. Make migration for SQLite database:
```bash
dotnet ef migrations add InitialMigration --context AliasServerDbContextSqlite --output-dir Migrations/SqliteMigrations
```
