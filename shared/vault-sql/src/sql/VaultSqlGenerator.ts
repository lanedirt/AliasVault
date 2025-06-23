import { COMPLETE_SCHEMA_SQL, MIGRATION_SCRIPTS } from './SqlConstants';
import { VAULT_VERSIONS } from './VaultVersions';
import { type VaultVersion } from '../types/VaultVersion';

/**
 * Result of SQL generation operations
 */
export type SqlGenerationResult = {
  success: boolean;
  sqlCommands: string[];
  version: string;
  migrationNumber: number;
  error?: string;
}

/**
 * Information about vault version requirements
 */
export type VaultVersionInfo = {
  currentVersion: string;
  currentMigrationNumber: number;
  targetVersion: string;
  targetMigrationNumber: number;
  needsUpgrade: boolean;
  availableUpgrades: VaultVersion[];
}

/**
 * Vault SQL generator utility class
 * Provides SQL statements for vault creation and migration without database execution
 */
export class VaultSqlGenerator {
  /**
   * Get SQL commands to create a new vault with the latest schema
   */
  getCreateVaultSql(): SqlGenerationResult {
    try {
      const sqlCommands = [
        'PRAGMA foreign_keys = ON;',
        COMPLETE_SCHEMA_SQL,
        // Insert version tracking
        `INSERT INTO "Settings" ("Key", "Value", "CreatedAt", "UpdatedAt", "IsDeleted")
         VALUES ('vault_version', '${VAULT_VERSIONS[VAULT_VERSIONS.length - 1].version}', datetime('now'), datetime('now'), 0);`,
        `INSERT INTO "Settings" ("Key", "Value", "CreatedAt", "UpdatedAt", "IsDeleted")
         VALUES ('vault_migration_number', '${VAULT_VERSIONS[VAULT_VERSIONS.length - 1].revision}', datetime('now'), datetime('now'), 0);`
      ];

      return {
        success: true,
        sqlCommands,
        version: VAULT_VERSIONS[VAULT_VERSIONS.length - 1].version,
        migrationNumber: VAULT_VERSIONS[VAULT_VERSIONS.length - 1].revision
      };
    } catch (error) {
      return {
        success: false,
        sqlCommands: [],
        version: '0.0.0',
        migrationNumber: 0,
        error: error instanceof Error ? error.message : 'Unknown error creating vault SQL'
      };
    }
  }

  /**
   * Get SQL commands to upgrade vault from current version to target version
   */
  getUpgradeVaultSql(currentMigrationNumber: number, targetMigrationNumber?: number): SqlGenerationResult {
    try {
      const targetMigration = targetMigrationNumber ?? VAULT_VERSIONS[VAULT_VERSIONS.length - 1].revision;
      const targetVersionInfo = VAULT_VERSIONS.find(v => v.revision === targetMigration);

      if (!targetVersionInfo) {
        return {
          success: false,
          sqlCommands: [],
          version: '0.0.0',
          migrationNumber: 0,
          error: `Target migration number ${targetMigration} not found`
        };
      }

      // If already at target version or beyond, no upgrade needed
      if (currentMigrationNumber >= targetMigration) {
        return {
          success: true,
          sqlCommands: [],
          version: targetVersionInfo.version,
          migrationNumber: targetMigration
        };
      }

      // Get migrations to apply
      const migrationsToApply = VAULT_VERSIONS.filter(
        v => v.revision > currentMigrationNumber &&
             v.revision <= targetMigration
      );

      const sqlCommands: string[] = ['PRAGMA foreign_keys = ON;'];

      // Add migration SQL commands
      for (const migration of migrationsToApply) {
        const migrationSql = MIGRATION_SCRIPTS[migration.revision];
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
         VALUES ('vault_migration_number', '${targetMigration}', datetime('now'), datetime('now'), 0);`
      );

      return {
        success: true,
        sqlCommands,
        version: targetVersionInfo.version,
        migrationNumber: targetMigration
      };
    } catch (error) {
      return {
        success: false,
        sqlCommands: [],
        version: '0.0.0',
        migrationNumber: 0,
        error: error instanceof Error ? error.message : 'Unknown error generating upgrade SQL'
      };
    }
  }

  /**
   * Get SQL commands to upgrade vault to latest version
   */
  getUpgradeToLatestSql(currentMigrationNumber: number): SqlGenerationResult {
    return this.getUpgradeVaultSql(currentMigrationNumber);
  }

  /**
   * Get SQL commands to upgrade vault to a specific version
   */
  getUpgradeToVersionSql(currentMigrationNumber: number, targetVersion: string): SqlGenerationResult {
    const targetVersionInfo = VAULT_VERSIONS.find(v => v.version === targetVersion);

    if (!targetVersionInfo) {
      return {
        success: false,
        sqlCommands: [],
        version: '0.0.0',
        migrationNumber: 0,
        error: `Target version ${targetVersion} not found`
      };
    }

    return this.getUpgradeVaultSql(currentMigrationNumber, targetVersionInfo.revision);
  }

  /**
   * Get SQL commands to check current vault version
   */
  getVersionCheckSql(): string[] {
    return [
      // Check if Settings table exists
      "SELECT name FROM sqlite_master WHERE type='table' AND name='Settings';",
      // Get vault version
      "SELECT Value FROM Settings WHERE Key = 'vault_version' AND IsDeleted = 0 LIMIT 1;",
      // Get migration number
      "SELECT Value FROM Settings WHERE Key = 'vault_migration_number' AND IsDeleted = 0 LIMIT 1;"
    ];
  }

  /**
   * Get SQL command to validate vault structure
   */
  getVaultValidationSql(): string {
    return `SELECT name FROM sqlite_master WHERE type='table' AND name IN
            ('Aliases', 'Services', 'Credentials', 'Passwords', 'Attachments', 'EncryptionKeys', 'Settings', 'TotpCodes');`;
  }

  /**
   * Parse vault version information from query results
   */
  parseVaultVersionInfo(
    settingsTableExists: boolean,
    versionResult?: string,
    migrationResult?: string
  ): VaultVersionInfo {
    let currentVersion = '0.0.0';
    let currentMigrationNumber = 0;

    if (settingsTableExists) {
      if (versionResult) {
        currentVersion = versionResult;
      } else {
        // Has Settings table but no version info - likely v1.0.0 or v1.1.0
        currentVersion = '1.0.0';
        currentMigrationNumber = 1;
      }

      if (migrationResult) {
        currentMigrationNumber = parseInt(migrationResult, 10);
      }
    }

    const latestVersion = VAULT_VERSIONS[VAULT_VERSIONS.length - 1];
    const needsUpgrade = currentMigrationNumber < latestVersion.revision;
    const availableUpgrades = VAULT_VERSIONS.filter(v => v.revision > currentMigrationNumber);

    return {
      currentVersion,
      currentMigrationNumber,
      targetVersion: latestVersion.version,
      targetMigrationNumber: latestVersion.revision,
      needsUpgrade,
      availableUpgrades
    };
  }

  /**
   * Validate vault structure from table names
   */
  validateVaultStructure(tableNames: string[]): boolean {
    const requiredTables = ['Aliases', 'Services', 'Credentials', 'Passwords', 'Attachments', 'EncryptionKeys', 'Settings', 'TotpCodes'];
    const foundTables = tableNames.filter(name => requiredTables.includes(name));

    // Should have at least 5 core tables (some might not exist in older versions)
    return foundTables.length >= 5;
  }

  /**
   * Get all available vault versions
   */
  getAllVersions(): VaultVersion[] {
    return [...VAULT_VERSIONS];
  }

  /**
   * Get current/latest vault version info
   */
  getLatestVersion(): VaultVersion {
    return VAULT_VERSIONS[VAULT_VERSIONS.length - 1];
  }

  /**
   * Get specific migration SQL by migration number
   */
  getMigrationSql(migrationNumber: number): string | undefined {
    return MIGRATION_SCRIPTS[migrationNumber];
  }

  /**
   * Get complete schema SQL for creating new vault
   */
  getCompleteSchemaSql(): string {
    return COMPLETE_SCHEMA_SQL;
  }
}