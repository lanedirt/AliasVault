import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VaultManager, type IDbExecutor } from '../VaultManager.js';
import { CURRENT_VAULT_VERSION } from '../types/VaultVersion.js';

// Mock database executor for testing
class MockDbExecutor implements IDbExecutor {
  private queries: string[] = [];
  private mockResults: Record<string, unknown[]> = {};

  async executeSql(sql: string): Promise<void> {
    this.queries.push(sql);
  }

  async executeSqlWithResults<T = unknown>(sql: string): Promise<T[]> {
    this.queries.push(sql);
    // Normalize SQL for matching - remove extra whitespace and newlines
    const key = sql.toLowerCase().replace(/\s+/g, ' ').trim();
    return (this.mockResults[key] as T[]) || [];
  }

  async executeTransaction(sqlCommands: string[]): Promise<void> {
    this.queries.push(...sqlCommands);
  }

  // Test helpers
  getExecutedQueries(): string[] {
    return [...this.queries];
  }

  clearQueries(): void {
    this.queries = [];
  }

  setMockResult(sql: string, result: unknown[]): void {
    // Normalize SQL for matching - remove extra whitespace and newlines
    const key = sql.toLowerCase().replace(/\s+/g, ' ').trim();
    this.mockResults[key] = result;
  }
}

describe('VaultManager', () => {
  let vaultManager: VaultManager;
  let mockDb: MockDbExecutor;

  beforeEach(() => {
    mockDb = new MockDbExecutor();
    vaultManager = new VaultManager(mockDb);
  });

  describe('createNewVault', () => {
    it('should create a new vault with latest schema', async () => {
      const result = await vaultManager.createNewVault();

      expect(result.success).toBe(true);
      expect(result.version).toBe(CURRENT_VAULT_VERSION.version);
      expect(result.migrationNumber).toBe(CURRENT_VAULT_VERSION.migrationNumber);

      const queries = mockDb.getExecutedQueries();
      expect(queries).toContain('PRAGMA foreign_keys = ON;');
      expect(queries.some(q => q.includes('CREATE TABLE "Aliases"'))).toBe(true);
      expect(queries.some(q => q.includes('vault_version'))).toBe(true);
    });

    it('should handle errors during vault creation', async () => {
      const failingDb = {
        executeSql: vi.fn().mockRejectedValue(new Error('Database error')),
        executeSqlWithResults: vi.fn(),
        executeTransaction: vi.fn().mockRejectedValue(new Error('Database error'))
      };

      const failingVaultManager = new VaultManager(failingDb);
      const result = await failingVaultManager.createNewVault();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('getCurrentVaultInfo', () => {
    it('should return correct info for new vault without Settings table', async () => {
      // Mock no Settings table exists
      mockDb.setMockResult("select name from sqlite_master where type='table' and name='settings';", []);

      const info = await vaultManager.getCurrentVaultInfo();

      expect(info.version).toBe('0.0.0');
      expect(info.migrationNumber).toBe(0);
      expect(info.needsUpgrade).toBe(true);
      expect(info.availableUpgrades.length).toBeGreaterThan(0);
    });

    it('should return correct info for existing vault with version info', async () => {
      // Mock Settings table exists
      mockDb.setMockResult("select name from sqlite_master where type='table' and name='settings';", [{ name: 'Settings' }]);

      // Mock version queries
      mockDb.setMockResult("select value from settings where key = 'vault_version' and isdeleted = 0 limit 1;", [{ Value: '1.2.0' }]);
      mockDb.setMockResult("select value from settings where key = 'vault_migration_number' and isdeleted = 0 limit 1;", [{ Value: '4' }]);

      const info = await vaultManager.getCurrentVaultInfo();

      expect(info.version).toBe('1.2.0');
      expect(info.migrationNumber).toBe(4);
      expect(info.needsUpgrade).toBe(info.migrationNumber < CURRENT_VAULT_VERSION.migrationNumber);
    });

    it('should handle errors and default to needs upgrade', async () => {
      const failingDb = {
        executeSql: vi.fn(),
        executeSqlWithResults: vi.fn().mockRejectedValue(new Error('Database error')),
        executeTransaction: vi.fn()
      };

      const failingVaultManager = new VaultManager(failingDb);
      const info = await failingVaultManager.getCurrentVaultInfo();

      expect(info.version).toBe('0.0.0');
      expect(info.migrationNumber).toBe(0);
      expect(info.needsUpgrade).toBe(true);
    });
  });

  describe('upgradeVault', () => {
    it('should not upgrade if vault is already current', async () => {
      // Mock Settings table exists
      mockDb.setMockResult("select name from sqlite_master where type='table' and name='settings';", [{ name: 'Settings' }]);

      // Mock current version
      mockDb.setMockResult("select value from settings where key = 'vault_version' and isdeleted = 0 limit 1;", [{ Value: CURRENT_VAULT_VERSION.version }]);
      mockDb.setMockResult("select value from settings where key = 'vault_migration_number' and isdeleted = 0 limit 1;", [{ Value: CURRENT_VAULT_VERSION.migrationNumber.toString() }]);

      const result = await vaultManager.upgradeVault();

      expect(result.success).toBe(true);
      expect(result.version).toBe(CURRENT_VAULT_VERSION.version);
      expect(result.migrationNumber).toBe(CURRENT_VAULT_VERSION.migrationNumber);
    });

    it('should upgrade from older version', async () => {
      // Mock Settings table exists with older version
      mockDb.setMockResult("select name from sqlite_master where type='table' and name='settings';", [{ name: 'Settings' }]);
      mockDb.setMockResult("select value from settings where key = 'vault_version' and isdeleted = 0 limit 1;", [{ Value: '1.0.0' }]);
      mockDb.setMockResult("select value from settings where key = 'vault_migration_number' and isdeleted = 0 limit 1;", [{ Value: '1' }]);

      const result = await vaultManager.upgradeVault();

      expect(result.success).toBe(true);
      expect(result.version).toBe(CURRENT_VAULT_VERSION.version);
      expect(result.migrationNumber).toBe(CURRENT_VAULT_VERSION.migrationNumber);

      const queries = mockDb.getExecutedQueries();
      expect(queries).toContain('PRAGMA foreign_keys = ON;');
      expect(queries.some(q => q.includes('vault_version'))).toBe(true);
    });
  });

  describe('isValidVault', () => {
    it('should return true for valid vault with core tables', async () => {
      mockDb.setMockResult(
        `select name from sqlite_master where type='table' and name in
         ('aliases', 'services', 'credentials', 'passwords', 'attachments', 'encryptionkeys', 'settings', 'totpcodes');`,
        [
          { name: 'Aliases' },
          { name: 'Services' },
          { name: 'Credentials' },
          { name: 'Passwords' },
          { name: 'Attachments' }
        ]
      );

      const isValid = await vaultManager.isValidVault();
      expect(isValid).toBe(true);
    });

    it('should return false for vault with insufficient tables', async () => {
      mockDb.setMockResult(
        `select name from sqlite_master where type='table' and name in
         ('aliases', 'services', 'credentials', 'passwords', 'attachments', 'encryptionkeys', 'settings', 'totpcodes');`,
        [{ name: 'Aliases' }]
      );

      const isValid = await vaultManager.isValidVault();
      expect(isValid).toBe(false);
    });

    it('should return false on database error', async () => {
      const failingDb = {
        executeSql: vi.fn(),
        executeSqlWithResults: vi.fn().mockRejectedValue(new Error('Database error')),
        executeTransaction: vi.fn()
      };

      const failingVaultManager = new VaultManager(failingDb);
      const isValid = await failingVaultManager.isValidVault();
      expect(isValid).toBe(false);
    });
  });
});
