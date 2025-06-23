import { describe, it, expect } from 'vitest';
import { VaultSqlGenerator } from '../sql/VaultSqlGenerator.js';
import { CURRENT_VAULT_VERSION } from '../types/VaultVersion.js';

describe('VaultSqlGenerator', () => {
  describe('getCreateVaultSql', () => {
    it('should return SQL commands for creating a new vault', () => {
      const result = VaultSqlGenerator.getCreateVaultSql();

      expect(result.success).toBe(true);
      expect(result.sqlCommands.length).toBeGreaterThan(0);
      expect(result.version).toBe(CURRENT_VAULT_VERSION.version);
      expect(result.migrationNumber).toBe(CURRENT_VAULT_VERSION.migrationNumber);

      // Should include PRAGMA and schema creation
      expect(result.sqlCommands[0]).toBe('PRAGMA foreign_keys = ON;');
      expect(result.sqlCommands.some(cmd => cmd.includes('CREATE TABLE "Aliases"'))).toBe(true);
      expect(result.sqlCommands.some(cmd => cmd.includes('vault_version'))).toBe(true);
    });
  });

  describe('getUpgradeVaultSql', () => {
    it('should return empty commands when vault is already at target version', () => {
      const result = VaultSqlGenerator.getUpgradeVaultSql(CURRENT_VAULT_VERSION.migrationNumber);

      expect(result.success).toBe(true);
      expect(result.sqlCommands).toEqual([]);
      expect(result.version).toBe(CURRENT_VAULT_VERSION.version);
      expect(result.migrationNumber).toBe(CURRENT_VAULT_VERSION.migrationNumber);
    });

    it('should return upgrade commands for older version', () => {
      const result = VaultSqlGenerator.getUpgradeVaultSql(1, 3); // Upgrade from v1.0.0 to v1.1.0

      expect(result.success).toBe(true);
      expect(result.sqlCommands.length).toBeGreaterThan(0);

      // Should include PRAGMA and version updates
      expect(result.sqlCommands[0]).toBe('PRAGMA foreign_keys = ON;');
      expect(result.sqlCommands.some(cmd => cmd.includes('vault_version'))).toBe(true);
    });

    it('should handle invalid target migration number', () => {
      const result = VaultSqlGenerator.getUpgradeVaultSql(1, 999);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('getUpgradeToVersionSql', () => {
    it('should upgrade to specific version', () => {
      const result = VaultSqlGenerator.getUpgradeToVersionSql(1, '1.2.0');

      expect(result.success).toBe(true);
      expect(result.sqlCommands.length).toBeGreaterThan(0);
    });

    it('should handle invalid version', () => {
      const result = VaultSqlGenerator.getUpgradeToVersionSql(1, '99.99.99');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('getVersionCheckSql', () => {
    it('should return SQL commands to check vault version', () => {
      const commands = VaultSqlGenerator.getVersionCheckSql();

      expect(commands.length).toBe(3);
      expect(commands[0]).toContain('sqlite_master');
      expect(commands[1]).toContain('vault_version');
      expect(commands[2]).toContain('vault_migration_number');
    });
  });

  describe('getVaultValidationSql', () => {
    it('should return SQL to validate vault structure', () => {
      const sql = VaultSqlGenerator.getVaultValidationSql();

      expect(sql).toContain('sqlite_master');
      expect(sql).toContain('Aliases');
      expect(sql).toContain('Services');
      expect(sql).toContain('Credentials');
    });
  });

  describe('parseVaultVersionInfo', () => {
    it('should parse vault version info correctly', () => {
      const info = VaultSqlGenerator.parseVaultVersionInfo(true, '1.2.0', '4');

      expect(info.currentVersion).toBe('1.2.0');
      expect(info.currentMigrationNumber).toBe(4);
      expect(info.needsUpgrade).toBe(info.currentMigrationNumber < CURRENT_VAULT_VERSION.migrationNumber);
    });

    it('should handle missing Settings table', () => {
      const info = VaultSqlGenerator.parseVaultVersionInfo(false);

      expect(info.currentVersion).toBe('0.0.0');
      expect(info.currentMigrationNumber).toBe(0);
      expect(info.needsUpgrade).toBe(true);
    });

    it('should handle Settings table without version info', () => {
      const info = VaultSqlGenerator.parseVaultVersionInfo(true);

      expect(info.currentVersion).toBe('1.0.0');
      expect(info.currentMigrationNumber).toBe(1);
    });
  });

  describe('validateVaultStructure', () => {
    it('should validate vault with all required tables', () => {
      const tables = ['Aliases', 'Services', 'Credentials', 'Passwords', 'Settings'];
      const isValid = VaultSqlGenerator.validateVaultStructure(tables);

      expect(isValid).toBe(true);
    });

    it('should reject vault with missing core tables', () => {
      const tables = ['Aliases', 'Services'];
      const isValid = VaultSqlGenerator.validateVaultStructure(tables);

      expect(isValid).toBe(false);
    });

    it('should handle case-insensitive table names', () => {
      const tables = ['aliases', 'services', 'credentials', 'passwords'];
      const isValid = VaultSqlGenerator.validateVaultStructure(tables);

      expect(isValid).toBe(true);
    });
  });

  describe('utility methods', () => {
    it('should return available versions', () => {
      const versions = VaultSqlGenerator.getAvailableVersions();

      expect(versions.length).toBeGreaterThan(0);
      expect(versions[0].version).toBe('1.0.0');
    });

    it('should return current version', () => {
      const version = VaultSqlGenerator.getCurrentVersion();

      expect(version).toEqual(CURRENT_VAULT_VERSION);
    });

    it('should return migration SQL by number', () => {
      const sql = VaultSqlGenerator.getMigrationSql(1);

      expect(sql).toBeDefined();
      expect(sql).toContain('CREATE TABLE');
    });

    it('should return complete schema SQL', () => {
      const sql = VaultSqlGenerator.getCompleteSchemaeSql();

      expect(sql).toBeDefined();
      expect(sql).toContain('CREATE TABLE "Aliases"');
    });
  });
});