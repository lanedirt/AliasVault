# AliasVault: password & (email) alias manager [<img src="https://github.com/user-attachments/assets/933c8b45-a190-4df6-913e-b7c64ad9938b" width="100" align="right" alt="AliasVault">](https://github.com/lanedirt/AliasVault)

[<img src="https://img.shields.io/github/v/release/lanedirt/AliasVault?include_prereleases&logo=github">](https://github.com/lanedirt/AliasVault/releases)
[<img src="https://img.shields.io/github/actions/workflow/status/lanedirt/AliasVault/dotnet-unit-tests.yml?label=unit tests">](https://github.com/lanedirt/AliasVault/actions/workflows/dotnet-build-run-tests.yml)
[<img src="https://img.shields.io/github/actions/workflow/status/lanedirt/AliasVault/dotnet-integration-tests.yml?label=integration tests">](https://github.com/lanedirt/AliasVault/actions/workflows/dotnet-build-run-tests.yml)
[<img src="https://img.shields.io/github/actions/workflow/status/lanedirt/AliasVault/dotnet-e2e-client-tests.yml?label=e2e tests">](https://github.com/lanedirt/AliasVault/actions/workflows/dotnet-e2e-client-tests.yml)
[<img src="https://img.shields.io/sonar/quality_gate/lanedirt_AliasVault?server=https%3A%2F%2Fsonarcloud.io&label=sonarcloud&logo=sonarcloud">](https://sonarcloud.io/summary/new_code?id=lanedirt_AliasVault)
[<img alt="Discord" src="https://img.shields.io/discord/1309300619026235422?logo=discord&logoColor=%237289da&label=discord&color=%237289da">](https://discord.gg/DsaXMTEtpF)

> AliasVault is an end-to-end encrypted password and (email) alias manager that protects your privacy by creating alternative identities, passwords and email addresses for every website you use. Use the official supported cloud version or self-host AliasVault on your own server with Docker.

- <a href="https://app.aliasvault.net">Try the cloud version 🔥</a> - <a href="https://aliasvault.net?utm_source=gh-readme">Website 🌐</a> - <a href="https://docs.aliasvault.net?utm_source=gh-readme">Documentation 📚</a> - <a href="#self-hosting">Self-host instructions ⚙️</a> - <a href="https://aliasvault.net/plugins?utm_source=gh-readme">Browser Extensions 🔌</a>

### What makes AliasVault unique:
- **Zero-knowledge architecture**:
    - All data is end-to-end encrypted on the client and stored in encrypted state on the server. Your master password never leaves your device and the server never has access to your data.
- **Built-in email server**:
    - AliasVault includes its own email server that allows you to generate real working email addresses for each alias. Emails sent to these addresses are instantly visible in the AliasVault app and browser extension.
- **Alias generation**:
     - Generate aliases and assign them to a website, allowing you to use different email addresses and usernames for each website. Keeping your online identities separate and secure, making it harder for bad actors to link your accounts.
- **Open-source & Self-hostable**:
    - The source code is available on GitHub and AliasVault can be self-hosted on your own server via an easy install script.

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
curl -L -o install.sh https://github.com/lanedirt/AliasVault/releases/latest/download/install.sh

# Make install script executable and run it. This will create the .env file, pull the Docker images, and start the AliasVault containers.
chmod +x install.sh
./install.sh install
```

The install script will output the URL where the app is available. By default this is:
- Client: https://localhost
- Admin portal: https://localhost/admin

> Note: If you want to change the default AliasVault ports you can do so in the `.env` file.

## Documentation
For more information about the installation process, manual setup instructions and other topics, please see the official documentation website:
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

AliasVault is under active development, with a strong focus on usability, security, and cross-platform support.  
The main focus is on ensuring robust usability for everyday tasks, including comprehensive autofill capabilities across all platforms.

🛠️ Incremental releases are published every 2–3 weeks, with a strong emphasis on real-world testing and user feedback. 
During this phase, AliasVault can safely be used in production as it maintains strict data integrity and automatic migration guarantees.

Core features that are being worked on:

- [x] Core password & alias management
- [x] Full end-to-end encryption
- [x] Built-in email server for aliases
- [x] Easy self-hosted installer
- [x] Browser extensions with autofill feature (Chrome, Firefox, Edge, Safari, Brave)
- [x] Built-in TOTP authenticator
- [x] Import passwords from traditional password managers
- [ ] iOS and Android native apps
- [ ] Data model improvements to support reusable identities in combination with aliases
- [ ] Support for FIDO2/WebAuthn hardware keys and passkeys
- [ ] Adding support for family/team sharing (organization features)

👉 [View the full AliasVault roadmap here](https://github.com/lanedirt/AliasVault/issues/731)

### Got feedback or ideas?  
Feel free to open an issue or join our [Discord](https://discord.gg/DsaXMTEtpF)! Contributions are warmly welcomed—whether in feature development, testing, or spreading the word. Get in touch on Discord if you're interested in contributing.

### Support the mission
Your donation helps me dedicate more time and resources to improving AliasVault, making the internet safer for everyone!

<a href="https://www.buymeacoffee.com/lanedirt" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

