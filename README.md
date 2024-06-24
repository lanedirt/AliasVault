<div align="center">

<h1>AliasVault</h1>

[<img src="https://img.shields.io/github/v/release/lanedirt/AliasVault?include_prereleases&logo=github">](https://github.com/lanedirt/OGameX/releases)
[<img src="https://img.shields.io/github/actions/workflow/status/lanedirt/AliasVault/docker-compose-build.yml?label=docker-compose%20build">](https://github.com/lanedirt/AliasVault/actions/workflows/docker-compose-build.yml)
[<img src="https://img.shields.io/github/actions/workflow/status/lanedirt/AliasVault/dotnet-build-run-tests.yml?label=unit tests">](https://github.com/lanedirt/AliasVault/actions/workflows/dotnet-build-run-tests.yml)
[<img src="https://img.shields.io/github/actions/workflow/status/lanedirt/AliasVault/dotnet-integration-tests.yml?label=e2e tests">](https://github.com/lanedirt/AliasVault/actions/workflows/dotnet-integration-tests.yml)
[<img src="https://img.shields.io/sonar/coverage/lanedirt_AliasVault?server=https%3A%2F%2Fsonarcloud.io&label=test code coverage">](https://sonarcloud.io/summary/new_code?id=lanedirt_AliasVault)
[<img src="https://img.shields.io/sonar/quality_gate/lanedirt_AliasVault?server=https%3A%2F%2Fsonarcloud.io&label=sonarcloud&logo=sonarcloud">](https://sonarcloud.io/summary/new_code?id=lanedirt_AliasVault)
</div>

> Disclaimer: This repository is currently in an alpha state and is NOT ready for production use. Critical features, such as encryption, are not yet fully implemented. AliasVault is a work in progress and as of this moment serves as a research playground. Users are welcome to explore and use this project, but please be aware that there are no guarantees regarding its security or stability. Use at your own risk!

AliasVault is an open-source password manager that can generate virtual identities complete with virtual email addresses. AliasVault can be self-hosted on your own server with Docker, providing a secure and private solution for managing your online identities and passwords.

## Features
- **Password Management:** Securely store and manage your passwords.
- **Virtual Identities:** Generate virtual identities with virtual (working) email addresses that are assigned to one or more passwords.
- **Zero-knowledge architecture:** Ensures that all sensitive data is end-to-end encrypted on the client and stored in encrypted state on the database. The server never has access to your data.

## Installation

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
- When running the app for the first time, it may take a few minutes to build the Docker image.
- A SQLite database file will be created in `./database/aliasdb.sqlite`. This file will store all (encrypted) password vaults. It should be kept secure and not shared.

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
