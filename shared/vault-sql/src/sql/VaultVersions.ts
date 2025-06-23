/**
 * Vault version information
 * Auto-generated from EF Core migration filenames
 */

import { IVaultVersion } from "../types/VaultVersion";

/**
 * Available vault versions in chronological order
 */
export const VAULT_VERSIONS: IVaultVersion[] = [
  {
    revision: 1,
    version: '1.0.1',
    description: 'Empty Test Migration',
    releaseDate: '2024-07-08'
  },
  {
    revision: 2,
    version: '1.0.2',
    description: 'Change Email Column',
    releaseDate: '2024-07-11'
  },
  {
    revision: 3,
    version: '1.1.0',
    description: 'Add Pki Tables',
    releaseDate: '2024-07-29'
  },
  {
    revision: 4,
    version: '1.2.0',
    description: 'Add Settings Table',
    releaseDate: '2024-08-05'
  },
  {
    revision: 5,
    version: '1.3.0',
    description: 'Update Identity Structure',
    releaseDate: '2024-08-05'
  },
  {
    revision: 6,
    version: '1.3.1',
    description: 'Make Username Optional',
    releaseDate: '2024-08-12'
  },
  {
    revision: 7,
    version: '1.4.0',
    description: 'Add Sync Support',
    releaseDate: '2024-09-16'
  },
  {
    revision: 8,
    version: '1.4.1',
    description: 'Rename Attachments Plural',
    releaseDate: '2024-09-17'
  },
  {
    revision: 9,
    version: '1.5.0',
    description: 'Add Totp Codes',
    releaseDate: '2025-03-10'
  },
];
