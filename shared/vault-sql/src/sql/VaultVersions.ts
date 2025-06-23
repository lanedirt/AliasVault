/**
 * Vault version information
 * Auto-generated from EF Core migration filenames
 */

import { IVaultVersion } from "../types/VaultVersion";

/**
 * All vault migrations/versions in chronological order. When adding a new migration, make sure to
 * update the "releaseVersion" field to the correct AliasVault release version that introduced this
 * migration.
 */
export const VAULT_VERSIONS: IVaultVersion[] = [
  {
    revision: 1,
    version: '1.0.1',
    description: 'Empty Test Migration',
    releaseDate: '2024-07-08',
    releaseVersion: '0.2.0',
  },
  {
    revision: 2,
    version: '1.0.2',
    description: 'Change Email Column',
    releaseDate: '2024-07-11',
    releaseVersion: '0.3.0',
  },
  {
    revision: 3,
    version: '1.1.0',
    description: 'Add Pki Tables',
    releaseDate: '2024-07-29',
    releaseVersion: '0.4.0',
  },
  {
    revision: 4,
    version: '1.2.0',
    description: 'Add Settings Table',
    releaseDate: '2024-08-05',
    releaseVersion: '0.4.0',
  },
  {
    revision: 5,
    version: '1.3.0',
    description: 'Update Identity Structure',
    releaseDate: '2024-08-05',
    releaseVersion: '0.5.0',
  },
  {
    revision: 6,
    version: '1.3.1',
    description: 'Make Username Optional',
    releaseDate: '2024-08-12',
    releaseVersion: '0.5.0',
  },
  {
    revision: 7,
    version: '1.4.0',
    description: 'Add Sync Support',
    releaseDate: '2024-09-16',
    releaseVersion: '0.6.0',
  },
  {
    revision: 8,
    version: '1.4.1',
    description: 'Rename Attachments Plural',
    releaseDate: '2024-09-17',
    releaseVersion: '0.6.0',
  },
  {
    revision: 9,
    version: '1.5.0',
    description: 'Add Totp Codes',
    releaseDate: '2025-03-10',
    releaseVersion: '0.14.0',
  },
];
