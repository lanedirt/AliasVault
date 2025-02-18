/**
 * AppInfo class which contains information about the application version.
 */
export class AppInfo {
  // Current extension version - should be updated with each release.
  public static readonly VERSION = '0.12.0';

  // Minimum supported AliasVault client vault version.
  public static readonly MIN_VAULT_VERSION = '1.4.1';

  /*
   * The client name to use in the X-AliasVault-Client header.
   * TODO: make this configurable when adding other browser support (e.g. Firefox).
   */
  public static readonly CLIENT_NAME = 'chrome';

  /**
   * Prevent instantiation of this utility class
   */
  private constructor() {}

  /**
   * Checks if a given vault version is supported
   * @param vaultVersion The version to check
   * @returns boolean indicating if the version is supported
   */
  public static isVaultVersionSupported(vaultVersion: string): boolean {
    return this.compareVersions(vaultVersion, this.MIN_VAULT_VERSION) >= 0;
  }

  /**
   * Compares two version strings
   * @param version1 First version string (e.g., "1.2.3")
   * @param version2 Second version string (e.g., "1.2.0")
   * @returns -1 if version1 < version2, 0 if equal, 1 if version1 > version2
   */
  private static compareVersions(version1: string, version2: string): number {
    const parts1 = version1.split('.').map(Number);
    const parts2 = version2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] ?? 0;
      const part2 = parts2[i] ?? 0;

      if (part1 < part2) return -1;
      if (part1 > part2) return 1;
    }

    return 0;
  }
}
