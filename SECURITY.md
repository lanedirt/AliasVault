# SECURITY.md
This document describes the encryption algorithms used by AliasVault in order to keep its user data secure.

## Overview
AliasVault features a [zero-knowledge architecture](https://en.wikipedia.org/wiki/Zero-knowledge_service) and uses a combination of encryption algorithms to protect the data of its users.

The basic premise is that the master password chosen by the user upon registration forms the basis for all encryption
and decryption operations. This master password is never transmitted over the network and only resides on the client.
All data is encrypted at rest and in transit. This ensures that even if the AliasVault servers are compromised,
the user's data remains secure.

## Encryption algorithms
The following encryption algorithms are used by AliasVault:

- [Argon2id](#argon2id)
- [SRP](#srp)
- [AES-GCM](#aes-gcm)
- [RSA-OAEP](#rsa-oaep)

Below is a detailed explanation of each encryption algorithm.

For more information about how these algorithms are specifically used in AliasVault, see the [Architecture Documentation](https://docs.aliasvault.net/architecture) section on the documentation site.

### Argon2id
To derive a key from the master password, AliasVault uses the Argon2id key derivation function. Argon2id is a memory-hard
key derivation function which allows for controlling the execution time, memory required and degree of parallelism.
This makes it resilient against brute-force attacks and makes it one of the best choices for deriving keys from passwords.

AliasVault uses Argon2id with the following default parameters:
- Degree of parallelism: 1
- Memory size: 19456 KB
- Iterations: 2

More information about Argon2id can be found on the [Argon2](https://en.wikipedia.org/wiki/Argon2) Wikipedia page.

### SRP
The Secure Remote Password (SRP) protocol is used for authenticating a user with the AliasVault server during login.
The SRP protocol is a password-authenticated key exchange protocol (PAKE). This means that the client and server can
authenticate each other using a password, without sending the password itself over the network.

With the use of SRP the master password never leaves the client. The client sends a verifier to the server,
which is a value derived from the master password. The server uses this verifier to authenticate the client without
having ever seen the actual master password.

For more information see the [SRP protocol](https://en.wikipedia.org/wiki/Secure_Remote_Password_protocol) information on Wikipedia.

### AES-256-GCM
All user's vault data is fully encrypted on the client using the AES-256-GCM encryption algorithm, which stands for
*Advanced Encryption Standard with 256-bit key in Galois/Counter Mode*. The key for encryption is derived from the
master password by using the Argon2Id algorithm. AliasVault implements AES-GCM with the following specifications:

- Key Size: 256 bits
- Uses the Web Crypto API's SubtleCrypto interface for secure cryptographic operations
- Generates a random 12-byte (96-bit) IV (initialization vector) for each encryption operation
- Performs all encryption/decryption operations entirely in the browser

#### The encryption process works as follows:
- A unique IV is generated for each encryption operation
- The users vault data is encrypted using AES-GCM with the derived key and IV
- The IV is prepended to the ciphertext

More information about AES-GCM can be found on the [AES-GCM](https://en.wikipedia.org/wiki/Galois/Counter_Mode) Wikipedia page.

### RSA-OAEP
To secure email communications, AliasVault uses RSA-OAEP (RSA with Optimal Asymmetric Encryption Padding). This asymmetric
encryption system allows AliasVault to store emails on the server in encrypted state which can only be read by the
intended recipient. AliasVault implements RSA-OAEP with the following specifications:
- Algorithm: RSA-OAEP with SHA-256 hash
- Key Size: 2048-bit modulus
- Key Format: JWK (JSON Web Key)
- Padding: OAEP (Optimal Asymmetric Encryption Padding)

#### Email Security Flow
1. Key Generation: When a user creates a vault, a RSA key pair is generated:
   - A private key that remains in the encrypted user's vault and is never transmitted
   - A public key that is sent to the server

2. Email Reception Process: When an email arrives at the AliasVault email server:
   - The server generates a random 256-bit symmetric encryption key to encrypt the email contents
   - The symmetric encryption key is encrypted using the recipient's asymmetric public key
   - The encrypted email contents together with the encrypted symmetric encryption key are stored in the server's database
   - The original email content is never stored or logged

3. Email Retrieval Process:
   - When a user accesses their emails, the encrypted content is retrieved from the server
   - The client-side application decrypts the symmetric encryption key using the user's private key that is stored in their vault
   - The decrypted symmetric encryption key is used to decrypt the email contents
   - Decryption occurs entirely in the browser, maintaining end-to-end encryption

This implementation ensures that:
- Emails are encrypted and secure at rest in the server database
- Only the intended recipient that holds the private key can decrypt and read their emails
- Even if the server is compromised, email contents remain encrypted and unreadable

More information about RSA-OAEP can be found on the [RSA-OAEP](https://en.wikipedia.org/wiki/Optimal_asymmetric_encryption_padding) Wikipedia page.
