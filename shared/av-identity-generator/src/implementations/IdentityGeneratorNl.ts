import { BaseIdentityGenerator } from "./base/BaseIdentityGenerator";
import maleNames from '../dictionaries/nl/firstnames_male';
import femaleNames from '../dictionaries/nl/firstnames_female';
import lastNames from '../dictionaries/nl/lastnames';

/**
 * Identity generator for Dutch language using Dutch word dictionaries.
 */
export class IdentityGeneratorNl extends BaseIdentityGenerator {
  /**
   * Get the male first names.
   */
  protected getFirstNamesMaleJson(): string[] {
    return maleNames;
  }

  /**
   * Get the female first names.
   */
  protected getFirstNamesFemaleJson(): string[] {
    return femaleNames;
  }

  /**
   * Get the last names.
   */
  protected getLastNamesJson(): string[] {
    return lastNames;
  }
}
