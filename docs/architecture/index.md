---
layout: default
title: Architecture
has_children: true
nav_order: 5
---

# Architecture

AliasVault implements a zero-knowledge architecture where sensitive user data and passwords never leave the client device in unencrypted form. Below is a detailed explanation of how the system secures user data and communications.

## Diagram
The security architecture diagram below illustrates all encryption and authentication processes used in AliasVault to secure user data and communications.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="../assets/diagrams/security-architecture/aliasvault-security-architecture-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="../assets/diagrams/security-architecture/aliasvault-security-architecture-light.svg">
  <img alt="AliasVault Security Architecture Diagram" src="../assets/diagrams/security-architecture/aliasvault-security-architecture-light.svg">
</picture>

You can also view the diagram in a browser-friendly HTML format: [AliasVault Security Architecture](https://docs.aliasvault.net/assets/diagrams/security-architecture/aliasvault-security-architecture.html)

## Key Components and Process Flow

### 1. Key Derivation
- When a user enters their master password, it remains strictly on the client device
- The master password is processed through Argon2id (a memory-hard key derivation function) locally
- The derived key serves two purposes:
    - Authentication with the server through the SRP protocol
    - Local encryption/decryption of vault contents using AES-256-GCM

### 2. Authentication Process
1. SRP (Secure Remote Password) Authentication
    - Enables secure password-based authentication without transmitting the password
    - Client and server perform a cryptographic handshake to verify identity

2. Two-Factor Authentication (Optional)
    - If enabled, requires an additional verification step after successful SRP authentication
    - Uses Time-based One-Time Password (TOTP) protocol
    - Compatible with standard authenticator apps (e.g., Google Authenticator)
    - Server only issues the final JWT access token after successful 2FA verification

### 3. Vault Operations
- All vault contents are encrypted/decrypted locally using AES-256-GCM
- The encryption key is derived from the user's master password
- Only encrypted data is ever transmitted to or stored on the server
- The server never has access to the unencrypted vault contents

### 4. Email System Security

#### Key Generation and Storage
1. RSA key pair is generated locally on the client
2. Private key is stored in the encrypted vault
3. Public key is sent to the server and associated with email claim(s)

#### Email Reception Process
1. When an email is received, the server:
    - Verifies if the recipient has a valid email claim
    - If no valid claim exists, the email is rejected
    - If valid, generates a random 256-bit symmetric key
    - Encrypts the email content using this symmetric key
    - Encrypts the symmetric key using the recipient's public key
    - Stores both the encrypted email and encrypted symmetric key

#### Email Retrieval Process
1. Client retrieves encrypted email and encrypted symmetric key from server
2. Client uses private key from vault to decrypt the symmetric key
3. Client uses decrypted symmetric key to decrypt the email contents
4. All decryption occurs locally on the client device

> Note: The use of a symmetric key for email content encryption and asymmetric encryption for the symmetric key (hybrid encryption) is implemented due to RSA's limitations on encryption string length and for better performance.

## Security Benefits
- Zero-knowledge architecture ensures user data privacy
- Master password never leaves the client device
- All sensitive operations (key derivation, encryption/decryption) happen locally
- Server stores only encrypted data
- Multi-layer encryption for emails provides secure communication
- Optional 2FA adds an additional security layer
- Use of established cryptographic standards (Argon2id, AES-256-GCM, RSA/OAEP)

This security architecture ensures that even if the server is compromised, user data remains secure as all sensitive operations and keys remain strictly on the client side.
