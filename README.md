# AliasVault

---

> Disclaimer: This repository is currently in an alpha state and is NOT ready for production use. Critical features, such as encryption, are not yet fully implemented. AliasVault is a work in progress and as of this moment serves as a research playground. Users are welcome to explore and use this project, but please be aware that there are no guarantees regarding its security or stability. Use at your own risk!

AliasVault is an open-source password manager that can generate virtual identities complete with virtual email addresses. AliasVault can be self-hosted on your own server with Docker, providing a secure and private solution for managing your online identities and passwords.

## Features
- Password Management: Securely store and manage your passwords.
- Virtual Identities: Generate virtual identities with virtual (working) email addresses.
- Data Protection: Ensures that all sensitive data is encrypted and securely stored.
- User Authentication: Secure login and user management functionalities.

## Installation

1. Clone this repository.

```bash
git clone [URL]
```

2. Run the app via Docker:

```bash
docker compose up -d --build --force-recreate
```

The app will be available at http://localhost:80
