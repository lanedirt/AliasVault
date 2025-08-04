---
layout: default
title: Upgrade the AliasServerDb EF model
parent: Development
grand_parent: Miscellaneous
nav_order: 6
---

# Upgrade the AliasServerDb EF model

The below command allows you to create a new EF migration based on the existing database structure as defined in the EF mode classes.

```bash
dotnet ef migrations add InitialMigration --output-dir Migrations/PostgresqlMigrations
```
