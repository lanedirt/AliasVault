---
layout: default
title: Update
parent: Installation Guide
nav_order: 3
---

# Updating AliasVault
To update AliasVault to the latest version, run the install script with the `update` option. This will pull the latest version of AliasVault from GitHub and restart all containers.

You can see the latest available version of AliasVault on [GitHub](https://github.com/lanedirt/AliasVault/releases).

{: .warning }
Before updating, it's recommended to backup your database and other important data. You can do this by making
a copy of the `database` and `certificates` directories.

## Updating to the latest available version
To update to the latest version, run the install script with the `update` option. The script will check for the latest version and prompt you to confirm the update. Follow the prompts to complete the update.

```bash
./install.sh update
```

> Tip: to skip the confirmation prompts and automatically proceed with the update, use the `-y` flag: `./install.sh update -y`

## Updating the installer script
The installer script can check for and apply updates to itself. This is done as part of the `update` command. However you can also update the installer script separately with the `update-installer` command. This is useful if you want to update the installer script without updating AliasVault itself, e.g. as a separate step during CI/CD pipeline.

```bash
./install.sh update-installer
```

> Tip: to skip the confirmation prompts and automatically proceed with the update, use the `-y` flag: `./install.sh update-installer -y`

## Installing a specific version
To install a specific version and skip the automatic version checks, run the install script with the `install` option and specify the version you want to install.

```bash
./install.sh install <version>

# Example:
./install.sh install 0.7.0
```
