# ``VaultStoreKit``

The VaultStoreKit is the core native iOS module for AliasVault that handles all critical data operations. This module serves as the deepest level of data management in the iOS app, providing secure and efficient access to sensitive information.

## Key Components

- **Encrypted Vault**: Stores and manages encrypted user data
- **SQLite Client**: Handles local database operations
- **Native iOS Keychain integration**: This module directly integrates with the native iOS Keychain features which protects important data such as stored encryption keys with Face ID / Touch ID.

## Architecture

The VaultStore is accessed by the React Native layer through Turbo Modules, which provide a high-performance bridge between JavaScript and native code. This architecture ensures:

- Secure data handling at the native level
- Optimal performance for critical operations
- Seamless integration with React Native components

## Integration

The module is designed to be accessed exclusively through the Turbo Module interface, ensuring proper encapsulation of sensitive operations while maintaining the benefits of cross-platform development.
