/**
 * Vault database version information
 */
export interface IVaultVersion {
  /**
   * The migration revision number
   */
  revision: number;

  /**
   * The version number (e.g., "1.5.0")
   */
  version: string;

  /**
   * Description of changes in this version
   */
  description: string;

  /**
   * Release date
   */
  releaseDate: string;
}
