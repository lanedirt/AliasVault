# AliasVault: password & (email) alias manager [<img src="https://github.com/user-attachments/assets/933c8b45-a190-4df6-913e-b7c64ad9938b" width="100" align="right" alt="AliasVault">](https://github.com/lanedirt/AliasVault)

[<img src="https://img.shields.io/github/v/release/lanedirt/AliasVault?include_prereleases&logo=github">](https://github.com/lanedirt/AliasVault/releases)
[<img src="https://img.shields.io/github/actions/workflow/status/lanedirt/AliasVault/dotnet-unit-tests.yml?label=unit tests">](https://github.com/lanedirt/AliasVault/actions/workflows/dotnet-build-run-tests.yml)
[<img src="https://img.shields.io/github/actions/workflow/status/lanedirt/AliasVault/dotnet-integration-tests.yml?label=integration tests">](https://github.com/lanedirt/AliasVault/actions/workflows/dotnet-build-run-tests.yml)
[<img src="https://img.shields.io/github/actions/workflow/status/lanedirt/AliasVault/dotnet-e2e-client-tests.yml?label=e2e tests">](https://github.com/lanedirt/AliasVault/actions/workflows/dotnet-e2e-client-tests.yml)
[<img src="https://img.shields.io/sonar/quality_gate/lanedirt_AliasVault?server=https%3A%2F%2Fsonarcloud.io&label=sonarcloud&logo=sonarcloud">](https://sonarcloud.io/summary/new_code?id=lanedirt_AliasVault)
[<img alt="Discord" src="https://img.shields.io/discord/1309300619026235422?logo=discord&logoColor=%237289da&label=discord&color=%237289da">](https://discord.gg/DsaXMTEtpF)

> AliasVault is an end-to-end encrypted password and (email) alias manager that protects your privacy by creating alternative identities, passwords and email addresses for every website you use. Use the official supported cloud version or self-host AliasVault on your own server with Docker.

## Quick links
- <a href="https://app.aliasvault.net">Try the cloud version 🔥</a> - <a href="https://aliasvault.net?utm_source=gh-readme">Website 🌐</a> - <a href="https://docs.aliasvault.net?utm_source=gh-readme">Documentation 📚</a> - <a href="#self-hosting">Self-host instructions ⚙️</a>

### What makes AliasVault unique:
- **Zero-knowledge architecture**: All data is end-to-end encrypted on the client and stored in encrypted state on the server. Your master password never leaves your device and the server never has access to your data.
- **Built-in email server**: AliasVault includes its own email server that allows you to generate real working email addresses for each alias. Emails sent to these addresses are instantly visible in the AliasVault app and browser extension.
- **Alias generation**: Generate aliases and assign them to a website, allowing you to use different email addresses and usernames for each website. Keeping your online identities separate and secure, making it harder for bad actors to link your accounts.
- **Open-source**: The source code is available on GitHub and AliasVault can be self-hosted on your own server via an easy install script.

## Screenshots

<table>
    <tr>
        <th align="center">Browser Extension</th>
        <th align="center">Generate email and aliases</th>
    </tr>
    <tr>
        <td align="center">
            <img src="https://github.com/user-attachments/assets/d9ffd3dc-08a0-462d-8148-e8da5ec5a520" alt="Browser Autofill" />
        </td>
        <td align="center">
            <img src="https://github.com/user-attachments/assets/86752994-d469-4b0e-b633-c089e0aed12b" alt="Generate Aliases" />
		</td>
    </tr>
    <tr>
        <th align="center">Strong security</th>
        <th align="center">Easy self-host</th>
    </tr>
    <tr>
		<td align="center">
            <img src="https://github.com/user-attachments/assets/26b66379-10a5-4b8b-9c69-e64b553a10be" alt="Strong security" />
		</td>
		<td align="center">
           <img src="https://github.com/user-attachments/assets/47c7002a-e326-4507-8801-194e134e00dd" alt="Easy self-host installation" />
        </td>
	</tr>
</table>

## Official Cloud Version
The official cloud version of AliasVault is freely available at [app.aliasvault.net](https://app.aliasvault.net). This fully supported platform is always up to date with our latest release. Create an account to protect your privacy today.

[<img width="700" alt="Screenshot of AliasVault" src="docs/assets/img/screenshot.png">](https://app.aliasvault.net)

## Self-hosting
For full control over your own data you can self-host and install AliasVault on your own servers. The easiest method is to use the provided install script. This will download the pre-built Docker images and start the containers.

### Install using install script

This method uses pre-built Docker images and works on minimal hardware specifications:

- Linux VM with root access (Ubuntu/AlmaLinux recommended) or Raspberry Pi
- 1 vCPU
- 1GB RAM
- 16GB disk space
- Docker installed

```bash
# Download install script from latest stable release
curl -o install.sh https://raw.githubusercontent.com/lanedirt/AliasVault/0.12.3/install.sh

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
- [x] Chrome browser extension
- [ ] Firefox browser extension (https://github.com/lanedirt/AliasVault/issues/581)
- [ ] Add and associate TOTP MFA tokens to credentials (https://github.com/lanedirt/AliasVault/issues/181)
- [ ] Add support for connecting custom user domains to cloud hosted version (https://github.com/lanedirt/AliasVault/issues/485)
- [ ] Import passwords from existing password managers (https://github.com/lanedirt/AliasVault/issues/542)

### Future Plans
- [ ] Mobile apps (iOS, Android)
- [ ] Team / organization features (sharing passwords/aliases)
- [ ] Disposable phone number service

Want to suggest a feature? Join our [Discord](https://discord.gg/DsaXMTEtpF) or create an issue on GitHub.

## Tech Stack & Security

AliasVault is built with a modern, secure, and scalable technology stack, ensuring robust encryption and privacy protection.

### Core Technologies
- **C# & ASP.NET Core** – Reliable, high-performance backend for Web API.
- **Blazor WASM** – Secure, interactive web UI.
- **PostgreSQL & SQLite** – Database solutions, with SQLite powering encrypted user vaults.
- **Docker** – Containerized deployment for scalability.
- **Next.JS & React & Typescript** - Powering the AliasVault website and browser extensions

### Security & Cryptography
- **Argon2id (Konscious.Security.Cryptography)** – Industry-leading password hashing.
- **SRP** – Secure Remote Password (SRP-6a) protocol for authentication.
- **MimeKit & SmtpServer** – Secure email processing and virtual addresses.

### Additional Tools
- **Tailwind CSS & Flowbite** – Modern UI design.
- **Playwright** – Automated end-to-end testing.
- **SonarCloud** – Continuous code quality monitoring.

AliasVault prioritizes security, performance, and user privacy with a technology stack trusted by the industry.
