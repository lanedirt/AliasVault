<div align="center">

<h1>AliasVault</h1>

[<img src="https://img.shields.io/github/v/release/lanedirt/AliasVault?include_prereleases&logo=github">](https://github.com/lanedirt/OGameX/releases)
[<img src="https://img.shields.io/github/actions/workflow/status/lanedirt/AliasVault/docker-compose-build.yml?label=docker-compose%20build">](https://github.com/lanedirt/AliasVault/actions/workflows/docker-compose-build.yml)
[<img src="https://img.shields.io/github/actions/workflow/status/lanedirt/AliasVault/dotnet-build-run-tests.yml?label=unit tests">](https://github.com/lanedirt/AliasVault/actions/workflows/dotnet-build-run-tests.yml)
[<img src="https://img.shields.io/github/actions/workflow/status/lanedirt/AliasVault/dotnet-integration-tests.yml?label=e2e tests">](https://github.com/lanedirt/AliasVault/actions/workflows/dotnet-integration-tests.yml)
[<img src="https://img.shields.io/sonar/coverage/lanedirt_AliasVault?server=https%3A%2F%2Fsonarcloud.io&label=test code coverage">](https://sonarcloud.io/summary/new_code?id=lanedirt_AliasVault)
[<img src="https://img.shields.io/sonar/quality_gate/lanedirt_AliasVault?server=https%3A%2F%2Fsonarcloud.io&label=sonarcloud&logo=sonarcloud">](https://sonarcloud.io/summary/new_code?id=lanedirt_AliasVault)
</div>

AliasVault is an open-source password and identity manager built with C# ASP.NET technology. AliasVault can be self-hosted on your own server with Docker, providing a secure and private solution for managing your online identities and passwords.

### What makes AliasVault unique:
- **Zero-knowledge architecture**: All data is end-to-end encrypted on the client and stored in encrypted state on the server. Your master password never leaves your device and the server never has access to your data.
- **Virtual identities**: Generate virtual identities with virtual (working) email addresses that are assigned to one or more passwords.
- **Open-source**: The source code is available on GitHub and can be self-hosted on your own server.

> Note: AliasVault is currently in development and not yet ready for production use. The project is still in the early stages and many features are not yet implemented. You are welcome to contribute to the project by submitting pull requests or opening issues.

## Live demo
A live demo of the app is available at [main.aliasvault.net](https://main.aliasvault.net) (nightly builds). You can create a free account to try it out yourself.

<img width="700" alt="Screenshot 2024-07-12 at 14 58 29" src="https://github.com/user-attachments/assets/57103f67-dff0-4124-9b33-62137aab5578">

## Installation on your own machine
To install AliasVault on your own machine, follow the steps below. Note: the install process is tested on MacOS and Linux. It should work on Windows too, but you might need to adjust some commands.

### Requirements:
- Access to a terminal
- Docker
- Git

### 1. Clone this repository.

```bash
# Clone this Git repository to "AliasVault" directory
$ git clone https://github.com/lanedirt/AliasVault.git
```

### 2. Run the init script to set up the .env file and generate a random encryption secret.
This script will create a .env file in the root directory of the project if it does not yet exist and populate it with a random encryption secret.
```bash
# Go to the project directory
$ cd AliasVault

# Make init script executable
$ chmod +x init.sh

# Run the init script
$ ./init.sh
```

### 3. Build and run the app via Docker:

```bash
# Build and run the app via Docker Compose
$ docker compose up -d --build --force-recreate
```
> Note: the container binds to port 80 by default. If you have another service running on port 80, you can change the port in the `docker-compose.yml` file.

#### Note for first time build:
- When running the docker compose command for the first time, it may take a few minutes to build the Docker image.
- A SQLite database file will be created in `./database/AliasServerDb.sqlite`. This file will store all (encrypted) password vaults. It should be kept secure and not shared.

After the Docker containers have started the app will be available at http://localhost:80

## Tech stack / credits
The following technologies, frameworks and libraries are used in this project:

- [C#](https://docs.microsoft.com/en-us/dotnet/csharp/) - A simple, modern, object-oriented, and type-safe programming language.
- [ASP.NET Core](https://dotnet.microsoft.com/apps/aspnet) - An open-source framework for building modern, cloud-based, internet-connected applications.
- [Entity Framework Core](https://docs.microsoft.com/en-us/ef/core/) - A lightweight, extensible, open-source and cross-platform version of the popular Entity Framework data access technology.
- [Blazor WASM](https://dotnet.microsoft.com/apps/aspnet/web-apps/blazor) - A framework for building interactive web UIs using C# instead of JavaScript. It's a single-page app framework that runs in the browser via WebAssembly.
- [Playwright](https://playwright.dev/) - A Node.js library to automate Chromium, Firefox and WebKit with a single API. Used for end-to-end testing.
- [Docker](https://www.docker.com/) - A platform for building, sharing, and running containerized applications.
- [SQLite](https://www.sqlite.org/index.html) - A C-language library that implements a small, fast, self-contained, high-reliability, full-featured, SQL database engine.
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework for rapidly building custom designs.
- [Flowbite](https://flowbite.com/) - A free and open-source UI component library based on Tailwind CSS.
- [Konscious.Security.Cryptography](https://github.com/kmaragon/Konscious.Security.Cryptography) - A .NET library that implements Argon2id, a memory-hard password hashing algorithm.
- [SRP.net](https://github.com/secure-remote-password/srp.net) - SRP6a Secure Remote Password protocol for secure password authentication.
- [SqliteWasmHelper](https://github.com/JeremyLikness/SqliteWasmHelper) - The AliasVault SQLite WASM implementation is loosely based on this library.
