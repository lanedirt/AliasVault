import { BaseIdentityGenerator } from "./base/BaseIdentityGenerator";
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Identity generator for English language using English word dictionaries.
 */
export class IdentityGeneratorEn extends BaseIdentityGenerator {
  private readonly dictionaryPath = join(__dirname, '../../dictionaries/en');

  /**
   * Get the male first names.
   */
  protected getFirstNamesMaleJson(): string[] {
    const content = readFileSync(join(this.dictionaryPath, 'firstnames_male_en.txt'), 'utf-8');
    return content.split('\n').filter(name => name.trim() !== '');
  }

  /**
   * Get the female first names.
   */
  protected getFirstNamesFemaleJson(): string[] {
    const content = readFileSync(join(this.dictionaryPath, 'firstnames_female_en.txt'), 'utf-8');
    return content.split('\n').filter(name => name.trim() !== '');
  }

  /**
   * Get the last names.
   */
  protected getLastNamesJson(): string[] {
    const content = readFileSync(join(this.dictionaryPath, 'lastnames_en.txt'), 'utf-8');
    return content.split('\n').filter(name => name.trim() !== '');
  }
}
