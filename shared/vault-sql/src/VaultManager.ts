import { COMPLETE_SCHEMA_SQL, MIGRATION_SCRIPTS } from './sql/SqlConstants.js';
import { VAULT_VERSIONS, CURRENT_VAULT_VERSION, type IVaultVersion } from './types/VaultVersion.js';

/**
 * Database execution interface for different platforms
 */
export interface IDbExecutor {
  /**
   * Execute SQL command
   */
  executeSql(sql: string): Promise<void>;

  /**
   * Execute SQL command and return results
   */
  executeSqlWithResults<T = unknown>(sql: string): Promise<T[]>;

  /**
   * Execute multiple SQL commands in a transaction
   */
  executeTransaction(sqlCommands: string[]): Promise<void>;
}

/**
 * Vault creation and migration result
 */
export interface IVaultOperationResult {
  success: boolean;
  version: string;
  migrationNumber: number;
  error?: string;
}

/**
 * Vault version info from database
 */
export interface ICurrentVaultInfo {
  version: string;
  migrationNumber: number;
  needsUpgrade: boolean;
  availableUpgrades: IVaultVersion[];
}

/**
 * Vault SQL manager for creating and migrating vaults across platforms
 */
export class VaultManager {
  constructor(private dbExecutor: IDbExecutor) {}

  /**
   * Create a new vault with the latest schema
   */
  async createNewVault(): Promise<IVaultOperationResult> {
    try {
      // Enable foreign key constraints and create complete schema
      const sqlCommands = [
        'PRAGMA foreign_keys = ON;',
        COMPLETE_SCHEMA_SQL,
        // Insert version tracking
        `INSERT INTO "Settings" ("Key", "Value", "CreatedAt", "UpdatedAt", "IsDeleted")
         VALUES ('vault_version', '${CURRENT_VAULT_VERSION.version}', datetime('now'), datetime('now'), 0);`,
        `INSERT INTO "Settings" ("Key", "Value", "CreatedAt", "UpdatedAt", "IsDeleted")
         VALUES ('vault_migration_number', '${CURRENT_VAULT_VERSION.migrationNumber}', datetime('now'), datetime('now'), 0);`
      ];

      await this.dbExecutor.executeTransaction(sqlCommands);

      return {
        success: true,
        version: CURRENT_VAULT_VERSION.version,
        migrationNumber: CURRENT_VAULT_VERSION.migrationNumber
      };
    } catch (error) {
      return {
        success: false,
        version: '0.0.0',
        migrationNumber: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get current vault version and upgrade information
   */
  async getCurrentVaultInfo(): Promise<ICurrentVaultInfo> {
    try {
      // Check if Settings table exists
      const tables = await this.dbExecutor.executeSqlWithResults<{name: string}>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='Settings';"
      );

      if (tables.length === 0) {
        // Very old vault or no vault - needs full migration
        return {
          version: '0.0.0',
          migrationNumber: 0,
          needsUpgrade: true,
          availableUpgrades: VAULT_VERSIONS
        };
      }

      // Try to get version from Settings table
      const versionResult = await this.dbExecutor.executeSqlWithResults<{Value: string}>(
        "SELECT Value FROM Settings WHERE Key = 'vault_version' AND IsDeleted = 0 LIMIT 1;"
      );

      const migrationResult = await this.dbExecutor.executeSqlWithResults<{Value: string}>(
        "SELECT Value FROM Settings WHERE Key = 'vault_migration_number' AND IsDeleted = 0 LIMIT 1;"
      );

      let currentVersion = '1.0.0';
      let currentMigrationNumber = 1;

      if (versionResult.length > 0) {
        currentVersion = versionResult[0].Value;
      }

      if (migrationResult.length > 0) {
        currentMigrationNumber = parseInt(migrationResult[0].Value, 10);
      }

      const needsUpgrade = currentMigrationNumber < CURRENT_VAULT_VERSION.migrationNumber;
      const availableUpgrades = VAULT_VERSIONS.filter(v => v.migrationNumber > currentMigrationNumber);

      return {
        version: currentVersion,
        migrationNumber: currentMigrationNumber,
        needsUpgrade,
        availableUpgrades
      };
    } catch {
      // If we can't determine version, assume it needs upgrade
      return {
        version: '0.0.0',
        migrationNumber: 0,
        needsUpgrade: true,
        availableUpgrades: VAULT_VERSIONS
      };
    }
  }

  /**
   * Upgrade vault to latest version
   */
  async upgradeVault(): Promise<IVaultOperationResult> {
    try {
      const currentInfo = await this.getCurrentVaultInfo();

      if (!currentInfo.needsUpgrade) {
        return {
          success: true,
          version: currentInfo.version,
          migrationNumber: currentInfo.migrationNumber
        };
      }

      // Apply migrations in order
      const sqlCommands: string[] = ['PRAGMA foreign_keys = ON;'];

      for (const upgrade of currentInfo.availableUpgrades) {
        const migrationSql = MIGRATION_SCRIPTS[upgrade.migrationNumber];
        if (migrationSql) {
          sqlCommands.push(migrationSql);
        }
      }

      // Update version tracking
      sqlCommands.push(
        `INSERT OR REPLACE INTO "Settings" ("Key", "Value", "CreatedAt", "UpdatedAt", "IsDeleted")
         VALUES ('vault_version', '${CURRENT_VAULT_VERSION.version}', datetime('now'), datetime('now'), 0);`
      );
      sqlCommands.push(
        `INSERT OR REPLACE INTO "Settings" ("Key", "Value", "CreatedAt", "UpdatedAt", "IsDeleted")
         VALUES ('vault_migration_number', '${CURRENT_VAULT_VERSION.migrationNumber}', datetime('now'), datetime('now'), 0);`
      );

      await this.dbExecutor.executeTransaction(sqlCommands);

      return {
        success: true,
        version: CURRENT_VAULT_VERSION.version,
        migrationNumber: CURRENT_VAULT_VERSION.migrationNumber
      };
    } catch (error) {
      return {
        success: false,
        version: '0.0.0',
        migrationNumber: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Upgrade vault to a specific version
   */
  async upgradeVaultToVersion(targetVersion: string): Promise<IVaultOperationResult> {
    try {
      const currentInfo = await this.getCurrentVaultInfo();
      const targetVersionInfo = VAULT_VERSIONS.find(v => v.version === targetVersion);

      if (!targetVersionInfo) {
        return {
          success: false,
          version: currentInfo.version,
          migrationNumber: currentInfo.migrationNumber,
          error: `Target version ${targetVersion} not found`
        };
      }

      if (currentInfo.migrationNumber >= targetVersionInfo.migrationNumber) {
        return {
          success: true,
          version: currentInfo.version,
          migrationNumber: currentInfo.migrationNumber
        };
      }

      // Apply migrations up to target version
      const sqlCommands: string[] = ['PRAGMA foreign_keys = ON;'];

      const migrationsToApply = VAULT_VERSIONS.filter(
        v => v.migrationNumber > currentInfo.migrationNumber &&
             v.migrationNumber <= targetVersionInfo.migrationNumber
      );

      for (const migration of migrationsToApply) {
        const migrationSql = MIGRATION_SCRIPTS[migration.migrationNumber];
        if (migrationSql) {
          sqlCommands.push(migrationSql);
        }
      }

      // Update version tracking
      sqlCommands.push(
        `INSERT OR REPLACE INTO "Settings" ("Key", "Value", "CreatedAt", "UpdatedAt", "IsDeleted")
         VALUES ('vault_version', '${targetVersionInfo.version}', datetime('now'), datetime('now'), 0);`
      );
      sqlCommands.push(
        `INSERT OR REPLACE INTO "Settings" ("Key", "Value", "CreatedAt", "UpdatedAt", "IsDeleted")
         VALUES ('vault_migration_number', '${targetVersionInfo.migrationNumber}', datetime('now'), datetime('now'), 0);`
      );

      await this.dbExecutor.executeTransaction(sqlCommands);

      return {
        success: true,
        version: targetVersionInfo.version,
        migrationNumber: targetVersionInfo.migrationNumber
      };
    } catch (error) {
      return {
        success: false,
        version: '0.0.0',
        migrationNumber: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if vault database exists and is valid
   */
  async isValidVault(): Promise<boolean> {
    try {
      // Check if core tables exist
      const tables = await this.dbExecutor.executeSqlWithResults<{name: string}>(
        `SELECT name FROM sqlite_master WHERE type='table' AND name IN
         ('Aliases', 'Services', 'Credentials', 'Passwords', 'Attachments', 'EncryptionKeys', 'Settings', 'TotpCodes');`
      );

      // Should have all 8 core tables
      return tables.length >= 5; // At minimum, need core tables (some might not exist in older versions)
    } catch {
      return false;
    }
  }
}
