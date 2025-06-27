---
layout: default
title: Database Backup
parent: Advanced
nav_order: 4
---

# Database Backup

In order to backup the database, you can use the `install.sh` script. This script will stop all services, export the database to a file, and then restart the services.

```bash
./install.sh db-backup > backup.sql.gz
```

# Database Restore

To restore the database, you can use the `install.sh` script. This script will stop all services, drop the database, import the database from a file, and then restart the services.

```bash
./install.sh db-restore < backup.sql.gz
```
