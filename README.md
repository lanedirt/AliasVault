<div align="center">

<h1>AliasVault</h1>

<p align="center">
<a href="https://main.aliasvault.net">Live demo 🚀</a> • <a href="https://aliasvault.net?utm_source=gh-readme">Website 🏠</a> • <a href="#installation">Installation 📦</a>
</p>

<h3 align="center">
Open-source password and identity manager
</h3>

[<img src="https://img.shields.io/github/v/release/lanedirt/AliasVault?include_prereleases&logo=github">](https://github.com/lanedirt/OGameX/releases)
[<img src="https://img.shields.io/github/actions/workflow/status/lanedirt/AliasVault/docker-compose-build.yml?label=docker-compose%20build">](https://github.com/lanedirt/AliasVault/actions/workflows/docker-compose-build.yml)
[<img src="https://img.shields.io/github/actions/workflow/status/lanedirt/AliasVault/dotnet-unit-tests.yml?label=unit tests">](https://github.com/lanedirt/AliasVault/actions/workflows/dotnet-build-run-tests.yml)
[<img src="https://img.shields.io/github/actions/workflow/status/lanedirt/AliasVault/dotnet-integration-tests.yml?label=integration tests">](https://github.com/lanedirt/AliasVault/actions/workflows/dotnet-build-run-tests.yml)
[<img src="https://img.shields.io/github/actions/workflow/status/lanedirt/AliasVault/dotnet-e2e-client-tests.yml?label=e2e tests">](https://github.com/lanedirt/AliasVault/actions/workflows/dotnet-e2e-client-tests.yml)
[<img src="https://img.shields.io/sonar/coverage/lanedirt_AliasVault?server=https%3A%2F%2Fsonarcloud.io&label=test code coverage">](https://sonarcloud.io/summary/new_code?id=lanedirt_AliasVault)
[<img src="https://img.shields.io/sonar/quality_gate/lanedirt_AliasVault?server=https%3A%2F%2Fsonarcloud.io&label=sonarcloud&logo=sonarcloud">](https://sonarcloud.io/summary/new_code?id=lanedirt_AliasVault)
</div>

AliasVault is an open-source password and identity manager built with C# ASP.NET technology. AliasVault can be self-hosted on your own server with Docker, providing a secure and private solution for managing your online identities and passwords.

### What makes AliasVault unique:
- **Zero-knowledge architecture**: All data is end-to-end encrypted on the client and stored in encrypted state on the server. Your master password never leaves your device and the server never has access to your data.
- **Built-in email server**: AliasVault includes its own email server that allows you to generate virtual email addresses for each identity. Emails sent to these addresses are instantly visible in the AliasVault app.
- **Virtual identities**: Generate virtual identities and assign them to a website, allowing you to use different email addresses and usernames for each website. Keeping your online identities separate and secure, making it harder for attackers to link your accounts.
- **Open-source**: The source code is available on GitHub and can be self-hosted on your own server.

> Note: AliasVault is currently in active development and some features may not yet have been (fully) implemented. If you run into any issues, please create an issue on GitHub.

## Live demo
A live demo of the app is available at [main.aliasvault.net](https://main.aliasvault.net) (nightly builds). You can create a free account to try it out yourself.

<img width="700" alt="Screenshot 2024-07-12 at 14 58 29" src="https://github.com/user-attachments/assets/57103f67-dff0-4124-9b33-62137aab5578">

## Installation
To install AliasVault on your local machine, follow the steps below. Note: the install process is tested on MacOS and Linux. It should work on Windows too, but you might need to adjust some commands.

### Requirements:
- Access to a terminal
- Docker
- Git

### 1. Clone and run install script
AliasVault comes with a install script that prepares the .env file, builds the Docker image, and starts the AliasVault containers.

```bash
# Clone this Git repository to "AliasVault" directory
$ git clone https://github.com/lanedirt/AliasVault.git

# Go to the project directory
$ cd AliasVault

# Make install script executable and run it.
$ chmod +x install.sh && ./install.sh
```

Note: if you do not wish to run the script, you can set up the environment variables and build the Docker image and containers manually instead. See the [manual setup instructions](docs/setup/1-manually-setup-docker.md) for more information.

### 2. Ready to use
The install script executed in step #1 will output the URL where the app is available. By default this is http://localhost:80 for the client and http://localhost:8080 for the admin.

> Note: If you want to change the default AliasVault ports you can do so in the `docker-compose.yml` file.

#### Note for first time build:
- When running the init script for the first time, it may take a few minutes for Docker to download all dependencies. Subsequent builds will be faster.
- A SQLite database file will be created in `./database/AliasServerDb.sqlite`. This file will store all (encrypted) password vaults. It should be kept secure and not shared.

#### Other useful commands:
- To reset the admin password, run the install.sh script with the `--reset-admin-password` flag.
- To uninstall AliasVault, make the uninstall script executable with `chmod +x uninstall.sh` first, then run the script: `./uninstall.sh`.
This will remove all containers, images, and volumes related to AliasVault. It will keep all files and configuration intact however, so you can easily reinstall AliasVault later.

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
- [SmtpServer](https://github.com/cosullivan/SmtpServer) - A SMTP server library for .NET that is used for the virtual email address feature.
- [MimeKit](https://github.com/jstedfast/MimeKit) - A .NET MIME creation and parser library used for the virtual email address feature.
