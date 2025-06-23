---
layout: default
title: Upgrade the AliasClientDb EF model
parent: Development
grand_parent: Miscellaneous
nav_order: 5
---

# Upgrade the AliasClientDb EF model

This guide explains how to upgrade the AliasVault client database structure. The AliasVault client database is built and managed using Entity Framework code-first approach, where all SQL structure is maintained in code and then converted to SQL scripts for use across web apps, browser extensions, and mobile apps.

## Overview

The upgrade process involves three main steps:

1. **Update .NET Entity Framework model** - Modify the EF model and create migrations
2. **Generate SQL scripts** - Convert EF migrations to SQL scripts for cross-platform use
3. **Rebuild vault-sql shared library** - Compile and distribute the updated SQL scripts

---

## 1. Update .NET Entity Framework Model

### Step 1.1: Modify the EF Model
Make changes to the AliasClientDb EF model in the `AliasClientDb` project.

### Step 1.2: Create a New Migration
Run the following command in the `AliasClientDb` project:

```bash
# Important: Migration name must be prefixed with the Semver version number of the release.
# Example: If the release version is 1.0.0, use `1.0.0-<migration-name>`
dotnet ef migrations add "1.0.0-<migration-name>"
```

**Note:** Always prefix migration names with the release version number to ensure proper versioning across all client platforms.

---

## 2. Generate SQL Scripts

### Step 2.1: Run the SQL Generation Script
Execute the SQL generation script to convert EF migrations to SQL scripts:

```bash
apps/server/Databases/AliasClientDb/Scripts/run-all.sh
```

### Step 2.2: Verify Output
The script will:
- Create individual SQL scripts for each migration
- Convert these to TypeScript versions
- Save the results in `shared/vault-sql/src/sql` directory

---

## 3. Rebuild vault-sql Shared Library

### Step 3.1: Compile and Distribute
The vault-sql TypeScript library is consumed by web apps, browser extensions, and mobile apps for vault creation and updates. After generating the SQL scripts, rebuild the library:

```bash
shared/build-and-distribute.sh
```

### Step 3.2: Verify Distribution
Ensure the updated library is properly distributed to all consuming applications.

---

## Testing and Deployment

### Manual Testing
On the next login of any client app, users will be prompted (required) to upgrade their database schema to the latest version. **Always manually test that the migration works as expected** before releasing.
