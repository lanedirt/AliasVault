# AliasVault architecture outline

TODO: create architecture outline document. Below are areas
to include.

## Document how SRP works:
- Zero-knowledge architecture
- Users master password is converted to byte[] via Argon2Id algorithm.
  - The user master password is used for both SRP (passwordless server authentication) and for symmetrically encrypting the vault.
- SRP salt and verifier are stored on server in Vaults table (before this was stored in users table). This is done because
  in case a vault is restored to a previous version the users login is also changed back to that previous version.
