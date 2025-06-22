/**
 * Vault database version information
 */
export interface IVaultVersion {
  /**
   * The version number (e.g., "1.5.0")
   */
  version: string;

  /**
   * The migration number
   */
  migrationNumber: number;

  /**
   * Description of changes in this version
   */
  description: string;

  /**
   * Release date
   */
  releaseDate: string;
}

/**
 * Available vault versions in chronological order
 */
export const VAULT_VERSIONS: IVaultVersion[] = [
  {
    version: '1.0.0',
    migrationNumber: 1,
    description: 'Initial database schema with core vault functionality',
    releaseDate: '2024-07-08'
  },
  {
    version: '1.0.2',
    migrationNumber: 2,
    description: 'Email column rename for improved clarity',
    releaseDate: '2024-07-11'
  },
  {
    version: '1.1.0',
    migrationNumber: 3,
    description: 'PKI support with encryption keys table',
    releaseDate: '2024-07-29'
  },
  {
    version: '1.2.0',
    migrationNumber: 4,
    description: 'Settings table for user preferences',
    releaseDate: '2024-08-05'
  },
  {
    version: '1.3.0',
    migrationNumber: 5,
    description: 'Identity structure simplification',
    releaseDate: '2024-08-05'
  },
  {
    version: '1.3.1',
    migrationNumber: 6,
    description: 'Optional username support',
    releaseDate: '2024-08-12'
  },
  {
    version: '1.4.0',
    migrationNumber: 7,
    description: 'Soft delete support for synchronization',
    releaseDate: '2024-09-16'
  },
  {
    version: '1.4.1',
    migrationNumber: 8,
    description: 'Attachment table rename for consistency',
    releaseDate: '2024-09-17'
  },
  {
    version: '1.5.0',
    migrationNumber: 9,
    description: 'TOTP (2FA) support',
    releaseDate: '2025-03-10'
  }
];

/**
 * Current/latest vault version
 */
export const CURRENT_VAULT_VERSION = VAULT_VERSIONS[VAULT_VERSIONS.length - 1];
