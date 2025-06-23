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
   * Date that this vault version was released.
   */
  releaseDate: string;

  /**
   * The AliasVault release that this vault version was introduced in (e.g., "0.14.0").
   * This value is shown to the user in the UI instead of the actual vault version in order to
   * avoid potential confusion. The "version" field is the actual vault database version. While
   * this field is just for display purposes.
   */
  releaseVersion: string;
}
