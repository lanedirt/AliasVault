# Encryption
This document describes the encryption used in AliasVault.

## SRP
The application uses the Secure Remote Password (SRP) protocol for authentication. The SRP protocol is a password-authenticated key agreement protocol. This means that the client and server can authenticate each other using a password, without sending the password over the network.

With the use of SRP the master password never leaves the client. The client sends a verifier to the server, which is a value derived from the master password. The server uses this verifier to authenticate the client. With this the server can authenticate the client without having ever seen the actual master password.

## Argon2id
The application uses the Argon2id key derivation function to derive a key from the master password. Argon2id is a memory-hard function, which makes it difficult to perform large-scale custom hardware attacks. This makes it a good choice for password hashing.

## AES
AES-256 IV is used to encrypt the data. The data is encrypted with a key derived from the master password using Argon2id. The Initialization Vector (IV) is generated randomly for each encryption.
