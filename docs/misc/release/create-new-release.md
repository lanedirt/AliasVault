---
layout: default
title: Create a new release
parent: Release
grand_parent: Miscellaneous
nav_order: 1
---

# Release Preparation Checklist

Follow the steps in the checklist below to prepare a new release.

- [ ] Update ./src/Shared/AliasVault.Shared.Core/AppInfo.cs and update major/minor/patch to the new version. This version will be shown in the client and admin app footer.
- [ ] Update ./install.sh `@version` in header if the install script has changed. This allows the install script to self-update when running ./install.sh update command on default installations.
- [ ] Update README screenshots if applicable
- [ ] Update README current/upcoming features

Optional steps:
- [ ] Update /docs instructions if any changes have been made to the setup process
