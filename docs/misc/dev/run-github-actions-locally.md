---
layout: default
title: Run GitHub Actions Locally
parent: Development
grand_parent: Miscellaneous
nav_order: 9
---

# Run GitHub Actions Locally

This guide will help you set up and run GitHub Actions locally on Linux, which can be useful for debugging and testing your workflows without pushing changes to the repository.

## Prerequisites

- Linux (Ubuntu or RHEL-based distributions)
- [Docker](https://www.docker.com/) installed and running

## Setup Instructions

### 1. Install GitHub CLI

First, install the GitHub CLI using Homebrew:

```bash
sudo dnf install 'dnf-command(config-manager)'
sudo dnf config-manager --add-repo https://cli.github.com/packages/rpm/gh-cli.repo
sudo dnf install gh --repo gh-cli
```

### 2. Install Nektos/Act

Next, install the Nektos/Act extension for GitHub CLI:

```bash
gh extension install https://github.com/nektos/gh-act
```

## Basic usage

To run GitHub Actions locally, navigate to the root of your Git project and execute:

```bash
act
```

This command will pull the necessary Docker containers and execute the GitHub Actions defined in your repository.

### Understanding the `-P` Option

By default, `act` uses a simple Docker container that is small in size. However, official GitHub runners are much larger (10GB or even 100GB+). When certain commands or environments are needed, you should specify the full runner image using the `-P` option.

The `-P` option allows you to map the platform to a specific Docker image. This is particularly useful when you need to replicate the environment of the official GitHub runners more closely.

Syntax:
```bash
act -P ubuntu-latest=catthehacker/ubuntu:full-latest
```

This command tells `act` to use the `catthehacker/ubuntu:full-latest` Docker image for the `ubuntu-latest` platform, which is a more complete representation of the GitHub-hosted runner environment.

## Debugging E2E Tests for AliasVault

To run and debug the E2E tests for AliasVault using a more complete runner image, use the following command:

```bash
act -W .github/workflows/dotnet-e2e-tests.yml -P ubuntu-latest=catthehacker/ubuntu:full-latest
```

This command does the following:
- `-W .github/workflows/dotnet-e2e-tests.yml`: Specifies the workflow file to run
- `-P ubuntu-latest=catthehacker/ubuntu:full-latest`: Uses a more complete Ubuntu image that better replicates the GitHub-hosted runner environment

Running this command will execute the E2E tests locally, allowing you to debug and test your workflow without pushing changes to the repository.

```bash
docker image prune -a -f && docker system prune -a -f
```

## Troubleshooting

### Handling Disk Space Errors

If you encounter disk space errors, you can free up space by pruning Docker images and system resources:

### Misc

If you encounter any issues while running GitHub Actions locally, consider the following:

1. Ensure Docker is running and has sufficient resources allocated.
2. Check that your workflow file is correctly formatted and placed in the `.github/workflows/` directory.
3. Verify that all required secrets and environment variables are properly set.
4. If you're using specific tools or commands that are available in GitHub-hosted runners but not in the default `act` image, make sure to use the `-P` option with an appropriate image as shown in the E2E tests example.

For more detailed information and advanced usage, refer to the [Nektos/Act GitHub repository](https://github.com/nektos/act).
