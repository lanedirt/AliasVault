<div align="center">

🌟 **If you find this project useful, please consider giving it a star!** 🌟

<h1><img src="https://github.com/user-attachments/assets/933c8b45-a190-4df6-913e-b7c64ad9938b" width="40" /> AliasVault</h1>

<p align="center">
<a href="https://app.aliasvault.net">Try cloud version 🔥</a> • <a href="https://aliasvault.net?utm_source=gh-readme">Website 🌐</a> • <a href="https://docs.aliasvault.net?utm_source=gh-readme">Documentation 📚</a> • <a href="#self-host">Self-host instructions ⚙️</a>
</p>

<p align="center">
<strong>Open-source password and (email) alias manager</strong>
</p>

[<img src="https://img.shields.io/github/v/release/lanedirt/AliasVault?include_prereleases&logo=github">](https://github.com/lanedirt/AliasVault/releases)
[<img src="https://img.shields.io/github/actions/workflow/status/lanedirt/AliasVault/docker-compose-build.yml?label=docker-compose%20build">](https://github.com/lanedirt/AliasVault/actions/workflows/docker-compose-build.yml)
[<img src="https://img.shields.io/github/actions/workflow/status/lanedirt/AliasVault/dotnet-unit-tests.yml?label=unit tests">](https://github.com/lanedirt/AliasVault/actions/workflows/dotnet-build-run-tests.yml)
[<img src="https://img.shields.io/github/actions/workflow/status/lanedirt/AliasVault/dotnet-integration-tests.yml?label=integration tests">](https://github.com/lanedirt/AliasVault/actions/workflows/dotnet-build-run-tests.yml)
[<img src="https://img.shields.io/github/actions/workflow/status/lanedirt/AliasVault/dotnet-e2e-client-tests.yml?label=e2e tests">](https://github.com/lanedirt/AliasVault/actions/workflows/dotnet-e2e-client-tests.yml)
[<img src="https://img.shields.io/sonar/coverage/lanedirt_AliasVault?server=https%3A%2F%2Fsonarcloud.io&label=test code coverage">](https://sonarcloud.io/summary/new_code?id=lanedirt_AliasVault)
[<img src="https://img.shields.io/sonar/quality_gate/lanedirt_AliasVault?server=https%3A%2F%2Fsonarcloud.io&label=sonarcloud&logo=sonarcloud">](https://sonarcloud.io/summary/new_code?id=lanedirt_AliasVault)
</div>

<div align="center">

[<img alt="Discord" src="https://img.shields.io/discord/1309300619026235422?logo=discord&logoColor=%237289da&label=join%20discord%20chat&color=%237289da">](https://discord.gg/DsaXMTEtpF)

</div>

AliasVault is an end-to-end encrypted password and (email) alias manager that protects your privacy by creating alternative identities, passwords and email addresses for every website you use. The core of AliasVault is built with C# ASP.NET Blazor WASM technology. AliasVault can be self-hosted on your own server with Docker.

### What makes AliasVault unique:
- **Zero-knowledge architecture**: All data is end-to-end encrypted on the client and stored in encrypted state on the server. Your master password never leaves your device and the server never has access to your data.
- **Built-in email server**: AliasVault includes its own email server that allows you to generate virtual email addresses for each alias. Emails sent to these addresses are instantly visible in the AliasVault app.
- **Alias generation**: Generate aliases and assign them to a website, allowing you to use different email addresses and usernames for each website. Keeping your online identities separate and secure, making it harder for bad actors to link your accounts.
- **Open-source**: The source code is available on GitHub and can be self-hosted on your own server.

> Note: AliasVault is currently in active development and some features may not yet have been (fully) implemented. If you run into any issues, please create an issue on GitHub.

## Official Cloud Version
The official cloud version of AliasVault is freely available at [app.aliasvault.net](https://app.aliasvault.net). This fully supported platform is always up to date with our latest release. Create an account to protect your privacy today.

[<img width="700" alt="Screenshot of AliasVault" src="docs/assets/img/screenshot.png">](https://app.aliasvault.net)

## Self-host

To self-host and install AliasVault on your own server, the easiest method is to use the provided install script. This will download the pre-built Docker images and start the containers.

### Install using install script

This method uses pre-built Docker images and works on minimal hardware specifications:

- Linux VM with root access (Ubuntu/AlmaLinux recommended) or Raspberry Pi
- 1 vCPU
- 1GB RAM
- 16GB disk space
- Docker installed

```bash
# Download install script from latest stable release
curl -o install.sh https://raw.githubusercontent.com/lanedirt/AliasVault/0.11.1/install.sh

# Make install script executable and run it. This will create the .env file, pull the Docker images, and start the AliasVault containers.
chmod +x install.sh
./install.sh install
```

The install script will output the URL where the app is available. By default this is:
- Client: https://localhost
- Admin portal: https://localhost/admin

> Note: If you want to change the default AliasVault ports you can do so in the `.env` file.

## Documentation
For more detailed information about the installation process and other topics, please see the official documentation website:
- [Documentation website (docs.aliasvault.net) 📚](https://docs.aliasvault.net)

Here you can also find step-by-step instructions on how to install AliasVault to e.g. Azure, AWS and other popular cloud providers.

## Security Architecture
<a href="https://docs.aliasvault.net/architecture"><img alt="AliasVault Security Architecture Diagram" src="docs/assets/diagrams/security-architecture/aliasvault-security-architecture-thumb.jpg" width="343"></a>

AliasVault takes security seriously and implements various measures to protect your data:

- All sensitive user data is encrypted end-to-end using industry-standard encryption algorithms. This includes the complete vault contents and all received emails.
- Your master password never leaves your device.
- Zero-knowledge architecture ensures the server never has access to your unencrypted data

For detailed information about our encryption implementation and security architecture, see the following documents:
- [SECURITY.md](SECURITY.md)
- [Security Architecture Diagram](https://docs.aliasvault.net/architecture)

## Roadmap
AliasVault is under active development with new features being added regularly. We believe in transparency and want to share our vision for the future of the platform. Here's what we've accomplished and what we're working on next:

- [x] Core password & alias management
- [x] End-to-end encryption
- [x] Built-in email server for aliases
- [x] Single-command Docker-based installation
- [x] Chrome browser extension (https://github.com/lanedirt/AliasVault/issues/541)
- [ ] Firefox browser extension (https://github.com/lanedirt/AliasVault/issues/581)
- [ ] Add and associate TOTP MFA tokens to credentials (https://github.com/lanedirt/AliasVault/issues/181)
- [ ] Add support for connecting custom user domains to cloud hosted version (https://github.com/lanedirt/AliasVault/issues/485)
- [ ] Import passwords from existing password managers (https://github.com/lanedirt/AliasVault/issues/542)

### Future Plans
- [ ] Mobile apps (iOS, Android)
- [ ] Team / organization features (sharing passwords/aliases)
- [ ] Disposable phone number service

Want to suggest a feature? Join our [Discord](https://discord.gg/DsaXMTEtpF) or create an issue on GitHub.

## Tech stack / credits
The following technologies, frameworks and libraries are used in this project:

- [C#](https://docs.microsoft.com/en-us/dotnet/csharp/) - A simple, modern, object-oriented, and type-safe programming language.
- [ASP.NET Core](https://dotnet.microsoft.com/apps/aspnet) - An open-source framework for building modern multi-platform web applications.
- [Entity Framework Core](https://docs.microsoft.com/en-us/ef/core/) - Object-relational mapping framework for .NET.
- [Blazor WASM](https://dotnet.microsoft.com/apps/aspnet/web-apps/blazor) - A framework for building interactive web UIs using C# instead of JavaScript. It's a single-page app framework that runs in the browser via WebAssembly.
- [PostgreSQL](https://www.postgresql.org/) - An open-source object-relational database system used as the database for the server.
- [Docker](https://www.docker.com/) - Used for containerizing the server and client apps.
- [SQLite](https://www.sqlite.org/index.html) - A C-language library that implements a small, fast, self-contained, high-reliability, full-featured, SQL database engine. Used as database engine for the encrypted user's vault.
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework for rapidly building custom designs.
- [Flowbite](https://flowbite.com/) - A free and open-source UI component library based on Tailwind CSS.
- [Konscious.Security.Cryptography](https://github.com/kmaragon/Konscious.Security.Cryptography) - A .NET library that implements Argon2id, a memory-hard password hashing algorithm.
- [SRP.net](https://github.com/secure-remote-password/srp.net) - SRP6a Secure Remote Password protocol for secure password authentication without sending plaintext passwords over the network.
- [Playwright](https://playwright.dev/) - A Node.js library to automate Chromium, Firefox and WebKit with a single API. Used for end-to-end testing.
- [SmtpServer](https://github.com/cosullivan/SmtpServer) - A SMTP server library for .NET that is used for the virtual email address feature.
- [MimeKit](https://github.com/jstedfast/MimeKit) - A .NET MIME creation and parser library used for the virtual email address feature.
- [StyleCop.Analyzers](https://github.com/DotNetAnalyzers/StyleCopAnalyzers) - Static code analysis tool that enforces style and consistency rules for C# code.
- [SonarQube Cloud](https://www.sonarqube.org/) - A platform for continuous code quality management.
