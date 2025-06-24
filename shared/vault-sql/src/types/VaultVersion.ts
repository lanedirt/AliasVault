/**
 * Vault database version information
 */
export type VaultVersion = {
  /**
   * The migration revision number
   */
  revision: number;

  /**
   * The internal migration version number that equals the AliasClientDb database version (e.g., "1.5.0").
   * This is not the same as the AliasVault server release version.
   */
  version: string;

  /**
   * Description of changes in this version
   */
  description: string;

  /**
   * The AliasVault release that this vault version was introduced in (e.g., "0.14.0").
   * This value is shown to the user in the UI instead of the actual vault version in order to
   * avoid potential confusion. The "version" field is the actual AliasClientDb database version. While
   * this field is just for display purposes.
   */
  releaseVersion: string;
}
