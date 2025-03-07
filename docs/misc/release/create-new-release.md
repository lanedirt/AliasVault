---
layout: default
title: Create a new release
parent: Release
grand_parent: Miscellaneous
nav_order: 1
---

# Release Preparation Checklist
Follow the steps in the checklist below to prepare a new release.

## Versioning client and server
- [ ] Update ./src/Shared/AliasVault.Shared.Core/AppInfo.cs and update major/minor/patch to the new version. This version will be shown in the client and admin app footer. This version should be equal to the git release tag.
- [ ] Update ./src/Shared/AliasVault.Shared.Core/AppInfo.cs with the minimum supported client versions.
    - In case API output breaks earlier client versions and/or this version of the client/API will upgrade the client vault model to a new major version.
- [ ] Update ./install.sh `@version` in header if the install script has changed. This allows the install script to self-update when running the `./install.sh update` command on default installations.
- [ ] Update README.md install.sh download link to point to the new release version

## Versioning browser extension
- [ ] Update ./chrome/manifest.json with the new version for the extension. This will be shown in the Chrome Web Store. This version should be equal to the git release tag.
- [ ] Update ./chrome/src/shared/AppInfo.ts with the new version for the extension. This version should be equal to the git release tag.
- [ ] Update ./chrome/src/shared/AppInfo.ts with the minimum supported server version (in case of required API breaking changes).
- [ ] Update ./chrome/src/shared/AppInfo.ts with the minimum supported client vault version (in case of required client vault model changes).

## Docker Images
If docker containers have been added or removed:
- [ ] Verify that `.github/workflows/publish-docker-images.yml` contains references to all docker images that need to be published.
- [ ] Update `install.sh` and verify that the `images=()` array that takes care of pulling the images from the GitHub Container Registry is updated.

## Manual Testing (since v0.10.0+)
- [ ] Verify that the db migration from SQLite to PostgreSQL works. This needs to be tested manually until the SQLite support is removed. Test with: `./install.sh db-migrate` on an existing installation that has a SQLite database in `./database/AliasServerDb.sqlite`.

## Documentation
- [ ] Update /docs instructions if any changes have been made to the setup process
- [ ] Update README screenshots if applicable
- [ ] Update README current/upcoming features

# Release flow
Follow the steps below to publish a new release to the various channels.

## Create a new release on GitHub
The creation of the new release tag will cause the `install.sh` script to see the new version via GitHub and prompt the user to update when `install.sh update` is run.

The creation of the new release tag will also trigger the GitHub Actions workflow `Publish Docker Images` which will build the docker images and push them to the GitHub Container Registry. After publishing, the images will then be available for the installation script to pull during the update. Do take note that this publish step may take up to 15 minutes to complete. Between the creation of the release tag and the completion of the publish step, the installation script will not be able to pull the new images (yet), this is expected.

1. Create a new release on GitHub with a new tag in semver format, e.g. `0.12.0`.
2. Add a description to the release and generate the changelog.
3. Publish the release.

## Publish new browser extension version
The GitHub Actions workflow `Publish Browser Extension` will build the browser extension(s) and publish the archive to the GitHub Actions Artifacts page.

> Note: this step is only required if the browser extension has been updated.

1. Download the browser extension archive from the GitHub Actions Artifacts page.
2. Upload the archive to the Chrome Web Store.
3. Upload the archive (normal + sources) to the Firefox Add-ons page.
4. Upload the archive to the Microsoft Edge Add-ons page.
