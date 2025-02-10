import { BaseIdentityGenerator } from "./base/BaseIdentityGenerator";

/**
 * Identity generator for Dutch language using Dutch word dictionaries.
 */
export class IdentityGeneratorNl extends BaseIdentityGenerator {
  /**
   * Get the male first names.
   */
  protected getFirstNamesMaleJson(): string[] {
    /*
     * This is a placeholder for the dictionary-loader to replace with the actual data.
     * See vite-plugins/dictionary-loader.ts for more information.
     */
    return '__FIRSTNAMES_MALE_NL__';
  }

  /**
   * Get the female first names.
   */
  protected getFirstNamesFemaleJson(): string[] {
    /*
     * This is a placeholder for the dictionary-loader to replace with the actual data.
     * See vite-plugins/dictionary-loader.ts for more information.
     */
    return '__FIRSTNAMES_FEMALE_NL__';
  }

  /**
   * Get the last names.
   */
  protected getLastNamesJson(): string[] {
    /*
     * This is a placeholder for the dictionary-loader to replace with the actual data.
     * See vite-plugins/dictionary-loader.ts for more information.
     */
    return '__LASTNAMES_NL__';
  }
}
