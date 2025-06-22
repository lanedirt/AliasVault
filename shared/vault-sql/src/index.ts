/**
 * @aliasvault/vault-sql
 *
 * Shared SQL scripts and utilities for AliasVault database operations.
 * Provides cross-platform vault creation and migration functionality.
 */

// Export VaultManager and interfaces
export {
  VaultManager,
  type IDbExecutor,
  type IVaultOperationResult,
  type ICurrentVaultInfo
} from './VaultManager.js';

// Export version types and constants
export {
  type IVaultVersion,
  VAULT_VERSIONS,
  CURRENT_VAULT_VERSION
} from './types/VaultVersion.js';

// Export SQL constants
export {
  COMPLETE_SCHEMA_SQL,
  MIGRATION_SCRIPTS
} from './sql/SqlConstants.js';
