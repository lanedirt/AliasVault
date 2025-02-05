import { BaseIdentityGenerator } from "./base/BaseIdentityGenerator";

/**
 *
 */
export class IdentityGeneratorEn extends BaseIdentityGenerator {
  /**
   *
   */
  protected getFirstNamesMaleJson(): string[] {
    /*
     * This is a placeholder for the dictionary-loader to replace with the actual data.
     * See vite-plugins/dictionary-loader.ts for more information.
     */
    return '__FIRSTNAMES_MALE_EN__';
  }

  /**
   *
   */
  protected getFirstNamesFemaleJson(): string[] {
    /*
     * This is a placeholder for the dictionary-loader to replace with the actual data.
     * See vite-plugins/dictionary-loader.ts for more information.
     */
    return '__FIRSTNAMES_FEMALE_EN__';
  }

  /**
   *
   */
  protected getLastNamesJson(): string[] {
    /*
     * This is a placeholder for the dictionary-loader to replace with the actual data.
     * See vite-plugins/dictionary-loader.ts for more information.
     */
    return '__LASTNAMES_EN__';
  }
}
