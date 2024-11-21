---
layout: default
title: Upgrade the AliasClientDb EF model
parent: Development
grand_parent: Miscellaneous
nav_order: 3
---

# Upgrade the AliasClientDb EF model

To upgrade the AliasClientDb EF model, follow these steps:

1. Make changes to the AliasClientDb EF model in the `AliasClientDb` project.
2. Create a new migration by running the following command in the `AliasClientDb` project:

```bash
# Important: make sure the migration name is prefixed by the Semver version number of the release.
# For example, if the release version is 1.0.0, the migration name should be `1.0.0-<migration-name>`.
dotnet ef migrations add "1.0.0-<migration-name>"
```
4. On the next login of a user, they will be prompted (required) to upgrade their database schema to the latest version.
Make sure to manually test this.
